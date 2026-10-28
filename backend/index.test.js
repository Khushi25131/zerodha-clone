const test = require("node:test");
const assert = require("node:assert/strict");

const { validateOrder, validateSignup, validateLogin, hashPassword, verifyPassword } = require("./index");

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
