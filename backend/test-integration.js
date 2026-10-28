// Starts a disposable local mongod, never the database in .env.
const { spawn } = require("node:child_process");
const { mkdtemp } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const net = require("node:net");
(async () => {
  const dir = await mkdtemp(join(tmpdir(), "zerodha-audit-"));
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const mongo = spawn("mongod", ["--dbpath", dir, "--port", String(port), "--bind_ip", "127.0.0.1", "--logpath", join(dir, "mongod.log")], { stdio: "ignore" });
  let failed;
  mongo.on("error", (error) => { failed = error; });
  try {
    const { MongoClient } = require("mongodb");
    const url = `mongodb://127.0.0.1:${port}/zerodha_audit_test`;
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (failed || mongo.exitCode !== null) throw failed || new Error("mongod exited before ready");
      const client = new MongoClient(url, { serverSelectionTimeoutMS: 200 });
      try { await client.connect(); ready = true; } catch {} finally { await client.close(); }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error("Local mongod startup timed out");
    const child = spawn(process.execPath, ["--test", "index.test.js", "integration.test.js"], { cwd: __dirname, env: { ...process.env, TEST_MONGO_URL: url }, stdio: "inherit" });
    process.exitCode = await new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 1)));
  } finally {
    if (mongo.exitCode === null && !failed) {
      const stopped = new Promise((resolve) => mongo.once("exit", resolve));
      mongo.kill("SIGTERM");
      await stopped;
    }
    console.log(`Isolated test data and MongoDB log retained at ${dir}`);
  }
})().catch(() => { console.error("Integration runner failed. Install mongod and check local process permissions."); process.exitCode = 1; });
