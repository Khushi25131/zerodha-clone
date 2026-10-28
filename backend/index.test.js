const test = require("node:test");
const assert = require("node:assert/strict");

const { validateOrder } = require("./index");

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
