// Real UI + authenticated API verification. Only disposable local MongoDB data is used.
const { chromium, firefox, webkit } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const mongoose = require(path.join(root, "backend/node_modules/mongoose"));
const { MongoClient } = require(path.join(root, "backend/node_modules/mongodb"));
const servers = [], children = [];
let browser;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), "zerodha-ui-"));
function launch(command, args, env) {
  const child = spawn(command, args, { cwd: path.join(root, "backend"), env: { ...process.env, ...env }, stdio: "ignore" });
  child.on("error", () => {});
  children.push(child);
  return child;
}
async function stop(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  await exited;
}
async function available(port) {
  const server = http.createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  const assigned = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return assigned;
}
async function serve(app, port) {
  const base = path.join(root, app, "build");
  const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = path.resolve(base, `.${pathname}`);
    if (!file.startsWith(base + path.sep) && file !== base) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (path.extname(pathname)) { res.writeHead(404); return res.end(); }
      file = path.join(base, "index.html");
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolve); });
  servers.push(server);
}
async function ready(url, child) {
  for (let i = 0; i < 80; i++) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error("Service exited during startup");
    try { if ((await fetch(url)).ok) return; } catch {}
    await pause(250);
  }
  throw new Error(`Readiness timed out: ${url}`);
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: viewport overflow`);
}
(async () => {
  for (const port of [3000, 3001, 3002]) await available(port);
  const mongoPort = await available(0);
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "zerodha-browser-"));
  const mongo = launch("mongod", ["--dbpath", data, "--port", String(mongoPort), "--bind_ip", "127.0.0.1", "--logpath", path.join(data, "mongod.log")]);
  const url = `mongodb://127.0.0.1:${mongoPort}/zerodha_browser_test`;
  let connected = false;
  for (let i = 0; i < 40; i++) {
    if (mongo.exitCode !== null) throw new Error("mongod startup failed");
    const client = new MongoClient(url, { serverSelectionTimeoutMS: 200 });
    try { await client.connect(); connected = true; } catch {} finally { await client.close(); }
    if (connected) break;
    await pause(250);
  }
  if (!connected) throw new Error("MongoDB unavailable");
  const apiEnv = { MONGO_URL: url, NODE_ENV: "test", AUTH_REQUIRED: "true", HOST: "127.0.0.1", PORT: "3002", CORS_ORIGIN: "http://localhost:3000,http://localhost:3001" };
  let api = launch(process.execPath, ["index.js"], apiEnv);
  await ready("http://127.0.0.1:3002/ready", api);
  await serve("frontend", 3000);
  await serve("dashboard", 3001);
  const engines = (process.env.BROWSER_ENGINES || "chromium").split(",");
  for (const engine of engines) {
    assert.ok(["chromium", "firefox", "webkit"].includes(engine), "Unknown browser");
    browser = await ({ chromium, firefox, webkit })[engine].launch({ headless: true, ...(engine === "chromium" ? { channel: "chrome" } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["/", "/about", "/product", "/pricing", "/support", "/signup", "/missing"]) {
        await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
        const missing = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
        assert.deepEqual(missing, [], `Broken assets ${route}`);
        await noOverflow(page, `${engine} marketing ${route} ${width}`);
      }
    }
    console.log(`PASS ${engine}: 7 marketing routes/assets at 1440, 768, 390px`);
    await page.goto("http://localhost:3000/");
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Signup", exact: true }).click();
    await page.getByRole("heading", { name: "Explore the educational demo" }).waitFor();
    await page.screenshot({ path: path.join(artifacts, `${engine}-marketing-mobile.png`), fullPage: true });
    await page.goto("http://localhost:3001/");
    await page.getByRole("heading", { name: "Log in to dashboard" }).waitFor();
    await noOverflow(page, "mobile login");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: path.join(artifacts, `${engine}-login.png`), fullPage: true });
    const email = `ui-${engine}@example.test`, password = "isolated-browser-password";
    await page.getByRole("button", { name: "Need an account? Create one" }).click();
    await page.getByLabel("Name", { exact: true }).fill("UI Tester");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByRole("link", { name: "Dashboard", exact: true }).waitFor();
    const owner = await page.evaluate(() => JSON.parse(localStorage.getItem("zerodha_demo_user")).id);
    await mongoose.connect(url);
    const { HoldingsModel } = require(path.join(root, "backend/model/HoldingsModel"));
    const { PositionsModel } = require(path.join(root, "backend/model/PositionsModel"));
    await HoldingsModel.create({ userId: owner, name: "BROWSER_HOLDING", qty: 2, avg: 10, price: 12, day: "-1%" });
    await PositionsModel.create({ userId: owner, product: "CNC", name: "BROWSER_POSITION", qty: 1, avg: 10, price: 9, day: "-10%" });
    await mongoose.disconnect();
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["/", "/orders", "/holdings", "/positions", "/funds", "/apps"]) {
        await page.goto(`http://localhost:3001${route}`, { waitUntil: "networkidle" });
        await page.getByRole("link", { name: "Logout", exact: true }).count();
        if (route === "/holdings") await page.getByText("4.00 (20.00%)", { exact: true }).waitFor();
        if (route === "/positions") await page.getByText("BROWSER_POSITION", { exact: true }).waitFor();
        await noOverflow(page, `${engine} dashboard ${route} ${width}`);
        if (width !== 768 && ["/", "/holdings", "/funds"].includes(route)) await page.screenshot({ path: path.join(artifacts, `${engine}-${route.slice(1) || "overview"}-${width}.png`), fullPage: true });
      }
    }
    await page.getByRole("searchbox").fill("infy");
    await page.getByRole("button", { name: "Buy INFY", exact: true }).click();
    await page.getByLabel("Quantity", { exact: true }).fill("3");
    await noOverflow(page, "mobile order modal");
    assert.ok(await page.getByRole("dialog").evaluate((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }), "Dialog outside viewport");
    await page.getByRole("dialog").evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
    assert.equal(await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).opacity), "1", "Dialog must be fully visible");
    await page.screenshot({ path: path.join(artifacts, `${engine}-order-mobile.png`), fullPage: true });
    await page.getByRole("button", { name: "Buy", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("link", { name: "Orders", exact: true }).click();
    await page.getByRole("cell", { name: "INFY", exact: true }).waitFor();
    await page.getByLabel("Order side", { exact: true }).selectOption("SELL");
    await page.getByRole("heading", { name: "No matching orders", exact: true }).waitFor();
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    await page.getByLabel("Order time range", { exact: true }).selectOption("7");
    await page.getByRole("cell", { name: "INFY", exact: true }).waitFor();
    await page.getByText("View chart data", { exact: true }).click();
    await page.getByText(/UTC · Buy: 1 · Sell: 0/).waitFor();
    await page.goto("http://localhost:3001/holdings", { waitUntil: "networkidle" });
    await page.getByLabel("Chart metric", { exact: true }).selectOption("profit");
    await page.getByRole("img", { name: /Unrealized profit and loss by instrument/ }).waitFor();
    await page.getByRole("searchbox", { name: "Search holdings", exact: true }).fill("missing");
    await page.getByRole("heading", { name: "No matching holdings", exact: true }).waitFor();
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    await page.getByRole("cell", { name: "BROWSER_HOLDING", exact: true }).waitFor();
    await page.goto("http://localhost:3001/orders", { waitUntil: "networkidle" });
    await page.getByRole("searchbox", { name: "Search watchlist", exact: true }).fill("infy");
    await page.getByRole("button", { name: "Sell INFY", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await stop(api);
    api = launch(process.execPath, ["index.js"], apiEnv);
    await ready("http://127.0.0.1:3002/ready", api);
    await page.reload();
    await page.getByRole("heading", { name: "Log in to dashboard" }).waitFor();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.getByRole("cell", { name: "INFY", exact: true }).waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".menu").first().evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
    await page.getByRole("button", { name: "Logout", exact: true }).click();
    await page.getByRole("heading", { name: "Log in to dashboard" }).waitFor();
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log(`PASS ${engine}: signup/login/logout, 6 dashboard routes at 3 widths, real DB totals/orders, modal Escape, restart persistence, reduced motion, zero runtime errors`);
    await browser.close(); browser = null;
  }
  console.log(`Screenshots retained at ${artifacts}`);
})().catch((error) => { console.error(error.stack); console.error(`Artifacts: ${artifacts}`); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  for (const server of servers) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  for (const child of children.reverse()) await stop(child);
});
