const test = require("node:test");
const assert = require("node:assert/strict");

const { validateOrder, validateSignup, validateLogin, hashPassword, verifyPassword, startupFailureMessage } = require("./index");

test("startup diagnostics identify configuration failures without exposing credentials", () => {
  const secret = "mongodb+srv://private-user:private-password@example.invalid/demo";
  const cases = [
    [new Error("Invalid PORT."), "PORT"],
    [new Error("MONGO_URL is required."), "MONGO_URL"],
    [{ name: "MongoParseError", message: secret }, "DATABASE_URI"],
    [{ cause: { code: 18, message: secret } }, "DATABASE_AUTH"],
    [{ cause: { code: "ENOTFOUND", message: secret } }, "DATABASE_DNS"],
    [{ name: "MongooseServerSelectionError", message: secret }, "DATABASE_UNREACHABLE"],
    [{ reason: { servers: new Map([["host", { error: { code: 18, message: secret } }]]) } }, "DATABASE_AUTH"],
    [new Error(secret), "UNKNOWN"],
    [null, "UNKNOWN"],
  ];
  for (const [error, category] of cases) {
    const message = startupFailureMessage(error);
    assert.ok(message.includes(`[${category}]`));
    assert.ok(!message.includes(secret));
    assert.ok(!message.includes("private-password"));
  }
});

test("accepts a valid BUY order", () => {
  const result = validateOrder({ name: "INFY", qty: 2, price: 1520.25, mode: "BUY" });

  assert.equal(result.valid, true);
  assert.deepEqual(result.data, { name: "INFY", qty: 2, price: 1520.25, mode: "BUY" });
});

test("rejects quantity less than one", () => {
  const result = validateOrder({ name: "INFY", qty: 0, price: 1520.25, mode: "BUY" });

  assert.equal(result.valid, false);
  assert.match(result.error, /valid order payload/i);
});

for (const field of ["qty", "price"]) {
  test(`rejects nonnumeric ${field} without coercing objects`, () => {
    for (const value of [{ toString: null }, { toString: "invalid" }, { valueOf: null, toString: null }, [], true, null]) {
      const result = validateOrder({ name: "INFY", qty: 2, price: 1520.25, mode: "BUY", [field]: value });
      assert.equal(result.valid, false);
      assert.match(result.error, /valid order payload/i);
    }
  });
}

test("rejects invalid order mode", () => {
  const result = validateOrder({ name: "INFY", qty: 2, price: 1520.25, mode: "HOLD" });

  assert.equal(result.valid, false);
  assert.match(result.error, /BUY\/SELL/i);
});

test("validates signup and login payloads", () => {
  assert.equal(validateSignup({ name: "Alice", email: "alice@example.test", password: "12345678" }).valid, true);
  assert.equal(validateSignup({ name: "Alice", email: "not-email", password: "12345678" }).valid, false);
  assert.equal(validateSignup({ name: "Alice", email: "alice@example.test", password: "short" }).valid, false);
  assert.equal(validateLogin({ email: "alice@example.test", password: "12345678" }).valid, true);
  assert.equal(validateLogin({ email: "bad", password: "12345678" }).valid, false);
});

test("hashes and verifies passwords without storing plaintext", () => {
  const first = hashPassword("correct horse battery staple");
  const second = hashPassword("correct horse battery staple");
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, "correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", first.salt, first.hash), true);
  assert.equal(verifyPassword("wrong password", first.salt, first.hash), false);
});
