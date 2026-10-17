import { test } from "node:test";
import assert from "node:assert/strict";
import { transactionSchema, ruleUpdateSchema } from "./schemas.js";

const valid = {
  userId: "user_1",
  amount: 49.99,
  ip: "1.2.3.4",
  billingCountry: "us",
};

test("a valid transaction passes and country is upper-cased", () => {
  const r = transactionSchema.safeParse(valid);
  assert.equal(r.success, true);
  assert.equal(r.data.billingCountry, "US");
});

test("negative amounts are rejected", () => {
  assert.equal(
    transactionSchema.safeParse({ ...valid, amount: -5 }).success,
    false,
  );
});

test("missing userId is rejected", () => {
  const { userId, ...rest } = valid;
  assert.equal(transactionSchema.safeParse(rest).success, false);
});

test("3-letter country codes are rejected", () => {
  assert.equal(
    transactionSchema.safeParse({ ...valid, billingCountry: "USA" }).success,
    false,
  );
});

test("mlFeatures must contain exactly 28 values", () => {
  const bad = { ...valid, mlFeatures: { time: 10, v: [1, 2, 3] } };
  assert.equal(transactionSchema.safeParse(bad).success, false);
  const good = { ...valid, mlFeatures: { time: 10, v: new Array(28).fill(0) } };
  assert.equal(transactionSchema.safeParse(good).success, true);
});

test("clients cannot inject server-computed fields", () => {
  const r = transactionSchema.safeParse({
    ...valid,
    status: "APPROVED",
    finalScore: 0,
  });
  assert.equal(r.success, true);
  assert.equal("status" in r.data, false);
  assert.equal("finalScore" in r.data, false);
});

test("reviewThreshold must be lower than blockThreshold", () => {
  const r = ruleUpdateSchema.safeParse({
    reviewThreshold: 80,
    blockThreshold: 70,
  });
  assert.equal(r.success, false);
});

test("a partial rule update is accepted", () => {
  assert.equal(
    ruleUpdateSchema.safeParse({ velocityMaxTxPerWindow: 5 }).success,
    true,
  );
});
