require("dotenv").config({ quiet: true });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");

const app = express();
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Cache-Control": "no-store" });
  next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    const error = new Error("Origin not allowed.");
    error.status = 403;
    callback(error);
  },
}));
app.use(express.json({ limit: "16kb", inflate: false }));

const validateOrder = (body) => {
  const invalid = { valid: false, error: "Provide a valid order payload with name (up to 64 characters), integer qty (1–1000000), price (0.01–100000000), and BUY/SELL mode." };
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const numeric = (value) => typeof value === "number" || (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim()));
  // Reject untrusted objects before Number() can invoke their coercion methods.
  if (!numeric(body.qty) || !numeric(body.price)) return invalid;
  const qty = Number(body.qty);
  const price = Number(body.price);
  const mode = typeof body.mode === "string" ? body.mode.trim().toUpperCase() : "";
  if (!name || name.length > 64 || /[\x00-\x1f\x7f]/.test(name) || !numeric(body.qty) || !Number.isSafeInteger(qty) || qty < 1 || qty > 1000000 || !numeric(body.price) || !Number.isFinite(price) || price < 0.01 || price > 100000000 || !["BUY", "SELL"].includes(mode)) return invalid;
  return { valid: true, data: { name, qty, price, mode } };
};

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
});
// These are shared demo collections, NOT multi-user accounts. Keep the service private.
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database unavailable. Please retry later." });
  next();
});
const list = (Model, message) => async (req, res) => {
  const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500 || !Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
    return res.status(400).json({ error: "Use limit 1–500 and offset 0–1000000." });
  }
  try {
    const rows = await Model.find({}).sort({ _id: -1 }).skip(offset).limit(limit).lean().maxTimeMS(5000);
    res.json(rows);
  } catch {
    console.error(message);
    res.status(500).json({ error: message });
  }
};
app.get("/allHoldings", list(HoldingsModel, "Unable to fetch holdings."));
app.get("/allPositions", list(PositionsModel, "Unable to fetch positions."));
app.get("/allOrders", list(OrdersModel, "Unable to fetch orders."));
app.post("/newOrder", async (req, res) => {
  const validation = validateOrder(req.body);
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  try {
    const order = await OrdersModel.create(validation.data);
    return res.status(201).json({ message: "Order recorded (demo only; not executed).", order });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ error: "Invalid order." });
    console.error("Unable to save order.");
    return res.status(500).json({ error: "Unable to save order." });
  }
});
app.use((req, res) => res.status(404).json({ error: "Endpoint not found." }));
app.use((error, req, res, next) => {
  const status = [400, 403, 413, 415].includes(error.status) ? error.status : 500;
  const messages = { 400: "Invalid JSON body.", 403: "Origin not allowed.", 413: "Request body too large.", 415: "Unsupported request encoding." };
  res.status(status).json({ error: messages[status] || "Internal server error." });
});

const connectToDatabase = async () => {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is required.");
  await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10, autoIndex: process.env.NODE_ENV !== "production" });
};
const startServer = async () => {
  const port = Number(process.env.PORT || 3002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT.");
  // Fail closed: public production use requires real authentication and ownership first.
  if (process.env.NODE_ENV === "production") throw new Error("Public production is blocked: implement authentication and account ownership. Use a private staging environment with NODE_ENV=staging.");
  await connectToDatabase();
  const server = app.listen(port, process.env.HOST || "127.0.0.1", () => console.log(`API listening on port ${port}`));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on("error", () => { console.error("HTTP server failed."); mongoose.disconnect().finally(() => { process.exitCode = 1; }); });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => mongoose.disconnect().finally(() => clearTimeout(timer)));
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
};
if (require.main === module) startServer().catch(() => {
  console.error("Startup failed: verify NODE_ENV, PORT, MONGO_URL and database availability. Public production requires authentication and account ownership.");
  process.exitCode = 1;
});
module.exports = { app, connectToDatabase, startServer, validateOrder };
