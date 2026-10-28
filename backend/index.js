require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");

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

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
const TOKEN_BYTES = 32;
const sessions = new Map();
const isProduction = () => process.env.NODE_ENV === "production";
const authRequired = () => process.env.AUTH_REQUIRED === "true" || isProduction();
const demoUserId = () => {
  const value = process.env.DEMO_USER_ID || "000000000000000000000001";
  if (!mongoose.Types.ObjectId.isValid(value)) throw new Error("Invalid DEMO_USER_ID.");
  return new mongoose.Types.ObjectId(value);
};
const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions) if (session.expiresAt <= now) sessions.delete(token);
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  hash: crypto.scryptSync(password, salt, 64).toString("hex"),
});
const verifyPassword = (password, salt, expectedHash) => {
  const { hash } = hashPassword(password, salt);
  const actual = Buffer.from(hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const publicUser = (user) => ({ id: String(user._id), name: user.name, email: user.email });
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateSignup = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { valid: false, error: "Provide name, email, and password." };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!name || name.length > 64 || /[\x00-\x1f\x7f]/.test(name) || !validEmail(email) || email.length > 254 || password.length < 8 || password.length > 128) {
    return { valid: false, error: "Use a name up to 64 characters, a valid email, and an 8–128 character password." };
  }
  return { valid: true, data: { name, email, password } };
};
const validateLogin = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { valid: false, error: "Provide email and password." };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!validEmail(email) || !password) return { valid: false, error: "Invalid email or password." };
  return { valid: true, data: { email, password } };
};
const createSession = (userId) => {
  cleanExpiredSessions();
  const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  sessions.set(token, { userId: String(userId), expiresAt: Date.now() + TOKEN_TTL_MS });
  return { token, expiresInSeconds: Math.floor(TOKEN_TTL_MS / 1000) };
};
const currentUserId = (req) => req.user?._id || demoUserId();
const ownerFilter = (req) => (authRequired() ? { userId: currentUserId(req) } : {});
const requireUser = async (req, res, next) => {
  if (!authRequired()) return next();
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: "Authentication required." });
  cleanExpiredSessions();
  const session = sessions.get(match[1]);
  if (!session) return res.status(401).json({ error: "Invalid or expired session." });
  try {
    const user = await UserModel.findById(session.userId).lean().maxTimeMS(5000);
    if (!user) {
      sessions.delete(match[1]);
      return res.status(401).json({ error: "Invalid or expired session." });
    }
    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: "Unable to verify session." });
  }
};

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
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Database unavailable. Please retry later." });
  next();
});
app.post("/auth/signup", async (req, res) => {
  const validation = validateSignup(req.body);
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  try {
    const { name, email, password } = validation.data;
    const existing = await UserModel.exists({ email }).maxTimeMS(5000);
    if (existing) return res.status(409).json({ error: "Email is already registered." });
    const { salt, hash } = hashPassword(password);
    const user = await UserModel.create({ name, email, passwordSalt: salt, passwordHash: hash });
    const session = createSession(user._id);
    return res.status(201).json({ message: "Account created.", token: session.token, expiresInSeconds: session.expiresInSeconds, user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "Email is already registered." });
    console.error("Unable to create account.");
    return res.status(500).json({ error: "Unable to create account." });
  }
});
app.post("/auth/login", async (req, res) => {
  const validation = validateLogin(req.body);
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  try {
    const user = await UserModel.findOne({ email: validation.data.email }).maxTimeMS(5000);
    if (!user || !verifyPassword(validation.data.password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const session = createSession(user._id);
    return res.json({ message: "Logged in.", token: session.token, expiresInSeconds: session.expiresInSeconds, user: publicUser(user) });
  } catch {
    console.error("Unable to log in.");
    return res.status(500).json({ error: "Unable to log in." });
  }
});
app.post("/auth/logout", requireUser, (req, res) => {
  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) sessions.delete(match[1]);
  res.json({ message: "Logged out." });
});
app.get("/auth/me", requireUser, (req, res) => {
  if (!authRequired()) return res.json({ user: { id: String(demoUserId()), name: "Shared demo", email: "demo@example.invalid" }, demo: true });
  res.json({ user: publicUser(req.user), demo: false });
});
const list = (Model, message) => async (req, res) => {
  const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500 || !Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
    return res.status(400).json({ error: "Use limit 1–500 and offset 0–1000000." });
  }
  try {
    const rows = await Model.find(ownerFilter(req)).sort({ _id: -1 }).skip(offset).limit(limit).lean().maxTimeMS(5000);
    res.json(rows);
  } catch {
    console.error(message);
    res.status(500).json({ error: message });
  }
};
app.get("/allHoldings", requireUser, list(HoldingsModel, "Unable to fetch holdings."));
app.get("/allPositions", requireUser, list(PositionsModel, "Unable to fetch positions."));
app.get("/allOrders", requireUser, list(OrdersModel, "Unable to fetch orders."));
app.post("/newOrder", requireUser, async (req, res) => {
  const validation = validateOrder(req.body);
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  try {
    const order = await OrdersModel.create({ ...validation.data, userId: currentUserId(req) });
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
  if (isProduction() && !authRequired()) throw new Error("Production requires AUTH_REQUIRED=true.");
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
  console.error("Startup failed: verify NODE_ENV, PORT, MONGO_URL, AUTH_REQUIRED and database availability.");
  process.exitCode = 1;
});
module.exports = { app, connectToDatabase, startServer, validateOrder, validateSignup, validateLogin, hashPassword, verifyPassword, sessions };
