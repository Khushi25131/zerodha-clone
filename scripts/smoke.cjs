// Optional real-browser verification. See DEPLOYMENT.md. Uses fresh local MongoDB data only.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const root = path.resolve(__dirname, "..");
const mongoose = require(path.join(root, "backend/node_modules/mongoose"));
const { MongoClient } = require(path.join(root, "backend/node_modules/mongodb"));
const servers = [];
const children = [];
let browser;
const pause = (n) => new Promise((resolve) => setTimeout(resolve, n));
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
  await new Promise((resolve) => server.close(resolve));
}
async function serve(app, port) {
  const base = path.join(root, app, "build");
  const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
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
  for (let i = 0; i < 60; i++) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) throw new Error("Service exited during startup");
    try { if ((await fetch(url)).ok) return; } catch {}
    await pause(250);
  }
  throw new Error(`Readiness timed out: ${url}`);
}
(async () => {
  // Never terminate or reuse an existing service on these application ports.
  for (const port of [3000, 3001, 3002]) await available(port);
  const data = fs.mkdtempSync(path.join(os.tmpdir(), "zerodha-browser-"));
  const probe = http.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const mongoPort = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
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
  await mongoose.connect(url);
  const { HoldingsModel } = require(path.join(root, "backend/model/HoldingsModel"));
  const { PositionsModel } = require(path.join(root, "backend/model/PositionsModel"));
  await HoldingsModel.create({ name: "BROWSER_HOLDING", qty: 2, avg: 10, price: 12, day: "-1%" });
  await PositionsModel.create({ product: "CNC", name: "BROWSER_POSITION", qty: 1, avg: 10, price: 9, day: "-10%" });
  await mongoose.disconnect();
  const apiEnv = { MONGO_URL: url, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "3002", CORS_ORIGIN: "http://localhost:3000,http://localhost:3001" };
  let api = launch(process.execPath, ["index.js"], apiEnv);
  await ready("http://127.0.0.1:3002/ready", api);
  await serve("frontend", 3000);
  await serve("dashboard", 3001);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of ["/", "/about", "/product", "/pricing", "/support", "/signup", "/missing"]) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
    const missing = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
    if (missing.length) throw new Error(`Broken marketing assets at ${route}: ${missing.join(", ")}`);
    console.log(`PASS marketing route ${route}, images loaded`);
  }
  await page.goto("http://localhost:3001/holdings");
  await page.getByText("BROWSER_HOLDING", { exact: true }).waitFor();
  await page.getByText("4.00 (20.00%)", { exact: true }).waitFor();
  await page.goto("http://localhost:3001/positions");
  await page.getByText("BROWSER_POSITION", { exact: true }).waitFor();
  await page.getByRole("searchbox").fill("infy");
  await page.getByRole("button", { name: "Buy INFY", exact: true }).click();
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Buy", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByRole("cell", { name: "INFY", exact: true }).waitFor();
  console.log("PASS browser → real API → MongoDB → order history");
  await stop(api);
  api = launch(process.execPath, ["index.js"], apiEnv);
  await ready("http://127.0.0.1:3002/ready", api);
  await page.reload();
  await page.getByRole("cell", { name: "INFY", exact: true }).waitFor();
  console.log("PASS order persistence across API restart");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("searchbox").fill("infy");
  await page.getByRole("button", { name: "Sell INFY", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error("Mobile dashboard overflows viewport");
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Signup", exact: true }).click();
  await page.getByRole("heading", { name: "Explore the educational demo" }).waitFor();
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error("Mobile marketing page overflows viewport");
  console.log("PASS mobile navigation, order dialog and viewport checks");
  if (errors.length) throw new Error(`Browser runtime errors: ${errors.join("; ")}`);
  console.log(`PASS no browser runtime exceptions. Isolated database retained at ${data}`);
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  await browser?.close();
  for (const server of servers) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  for (const child of children.reverse()) await stop(child);
});
