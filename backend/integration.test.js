const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app, validateOrder, connectToDatabase, startServer } = require("./index");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");

for (const body of [null, [], true, {}, { name: "X", qty: true, price: 1, mode: "BUY" }, { name: "X", qty: 1.5, price: 1, mode: "BUY" }, { name: "X", qty: 1, price: [], mode: "BUY" }, { name: "X", qty: 1, price: Infinity, mode: "BUY" }, { name: "X".repeat(65), qty: 1, price: 1, mode: "BUY" }, { name: "X", qty: 1000001, price: 1, mode: "BUY" }]) {
  test(`invalid payload: ${JSON.stringify(body)}`, () => assert.equal(validateOrder(body).valid, false));
}
test("normalizes numeric strings and SELL mode", () => assert.deepEqual(validateOrder({ name: " INFY ", qty: "2", price: "1.25", mode: " sell " }).data, { name: "INFY", qty: 2, price: 1.25, mode: "SELL" }));
test("order schema enforces validation, declared fields, and ownership", async () => {
  const ownerId = new mongoose.Types.ObjectId();
  const bad = new OrdersModel({ userId: ownerId, name: "X", qty: 1.5, price: 0, mode: "HOLD" });
  await assert.rejects(bad.validate(), { name: "ValidationError" });
  const missingOwner = new OrdersModel({ name: "INFY", qty: 2, price: 10, mode: "BUY" });
  await assert.rejects(missingOwner.validate(), { name: "ValidationError" });
  const good = new OrdersModel({ userId: ownerId, name: "INFY", qty: 2, price: 10, mode: "BUY" });
  await good.validate();
  assert.equal(good.name, "INFY");
  assert.equal(String(good.userId), String(ownerId));
});
test("startup requires a database URL", async () => {
  const saved = process.env.MONGO_URL;
  try {
    delete process.env.MONGO_URL;
    await assert.rejects(connectToDatabase(), /MONGO_URL/);
  } finally {
    if (saved === undefined) delete process.env.MONGO_URL; else process.env.MONGO_URL = saved;
  }
});

test("HTTP parsing, CORS, readiness, and safe errors without a database", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/ready`)).status, 503);
  assert.equal((await fetch(`${base}/allHoldings`)).status, 503);
  const denied = await fetch(`${base}/health`, { headers: { Origin: "https://untrusted.invalid" } });
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { error: "Origin not allowed." });
  const allowed = await fetch(`${base}/health`, { headers: { Origin: "http://localhost:3001" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3001");
  assert.equal(allowed.headers.get("x-content-type-options"), "nosniff");
  const invalid = await fetch(`${base}/newOrder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "Invalid JSON body." });
  const large = await fetch(`${base}/newOrder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "x".repeat(17000) }) });
  assert.equal(large.status, 413);
});

test("real MongoDB API integration (isolated database only)", { skip: !process.env.TEST_MONGO_URL }, async (t) => {
  // Never use MONGO_URL/.env: the test runner supplies an isolated mongod URL.
  assert.match(process.env.TEST_MONGO_URL, /^mongodb:\/\/127\.0\.0\.1:\d+\/zerodha_audit_test$/);
  await mongoose.connect(process.env.TEST_MONGO_URL, { serverSelectionTimeoutMS: 3000 });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (payload) => fetch(`${base}/newOrder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  assert.equal((await fetch(`${base}/ready`)).status, 200);
  for (const path of ["allHoldings", "allPositions", "allOrders"]) assert.deepEqual(await (await fetch(`${base}/${path}`)).json(), []);
  for (const payload of [{}, { name: "INFY", qty: 0.5, price: 1, mode: "BUY" }, null]) assert.equal((await post(payload)).status, 400);
  const payload = { name: "INFY", qty: 2, price: 1555.45, mode: "BUY" };
  for (const field of ["qty", "price"]) {
    const invalid = await post({ ...payload, [field]: { toString: null } });
    assert.equal(invalid.status, 400, `${field} objects must be rejected as invalid input, not server errors`);
    assert.match((await invalid.json()).error, /valid order payload/i);
  }
  assert.equal(await OrdersModel.countDocuments(), 0, "invalid numeric objects must not persist orders");
  const response = await post(payload);
  assert.equal(response.status, 201);
  const { order } = await response.json();
  assert.ok(order._id);
  assert.ok(order.createdAt);
  assert.equal(order.name, "INFY");
  assert.equal((await OrdersModel.findById(order._id)).qty, 2);
  const concurrent = await Promise.all(Array.from({ length: 5 }, (_, i) => post({ ...payload, name: `TEST${i}`, mode: "SELL" })));
  assert.ok(concurrent.every((res) => res.status === 201));
  const page = await (await fetch(`${base}/allOrders?limit=2&offset=2`)).json();
  assert.equal(page.length, 2);
  assert.equal((await fetch(`${base}/allOrders?limit=501`)).status, 400);
  assert.equal((await fetch(`${base}/allOrders?offset=-1`)).status, 400);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  await mongoose.disconnect();
  await mongoose.connect(process.env.TEST_MONGO_URL);
  assert.equal(await OrdersModel.countDocuments(), 6, "records survive reconnect");

  await OrdersModel.deleteMany({});
  await UserModel.deleteMany({});
  const savedAuth = process.env.AUTH_REQUIRED;
  process.env.AUTH_REQUIRED = "true";
  try {
    assert.equal((await fetch(`${base}/allOrders`)).status, 401, "authenticated mode rejects anonymous reads");
    assert.equal((await post(payload)).status, 401, "authenticated mode rejects anonymous writes");
    const signup = (name, email) => fetch(`${base}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: "correct horse battery staple" }) });
    const aliceResponse = await signup("Alice", "alice@example.test");
    assert.equal(aliceResponse.status, 201);
    const alice = await aliceResponse.json();
    assert.ok(alice.token);
    assert.equal(alice.user.email, "alice@example.test");
    assert.equal((await signup("Alice Clone", "alice@example.test")).status, 409);
    const badLogin = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "alice@example.test", password: "wrong password" }) });
    assert.equal(badLogin.status, 401);
    const bobResponse = await signup("Bob", "bob@example.test");
    assert.equal(bobResponse.status, 201);
    const bob = await bobResponse.json();
    const authedPost = (token, body) => fetch(`${base}/newOrder`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    assert.equal((await authedPost(alice.token, { ...payload, name: "ALICE" })).status, 201);
    assert.equal((await authedPost(bob.token, { ...payload, name: "BOB" })).status, 201);
    const authedGet = (token, path) => fetch(`${base}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const aliceOrders = await (await authedGet(alice.token, "allOrders")).json();
    const bobOrders = await (await authedGet(bob.token, "allOrders")).json();
    assert.deepEqual(aliceOrders.map((order) => order.name), ["ALICE"]);
    assert.deepEqual(bobOrders.map((order) => order.name), ["BOB"]);
    assert.notEqual(aliceOrders[0].userId, bobOrders[0].userId);
    assert.equal(await OrdersModel.countDocuments(), 2);
    assert.equal((await fetch(`${base}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${alice.token}` } })).status, 200);
    assert.equal((await authedGet(alice.token, "auth/me")).status, 401);
  } finally {
    if (savedAuth === undefined) delete process.env.AUTH_REQUIRED; else process.env.AUTH_REQUIRED = savedAuth;
  }
});
