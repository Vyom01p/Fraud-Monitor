import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateScore } from "./aggregator.js";

test("no rules and low ML score is approved", () => {
  const r = aggregateScore([], 0.1);
  assert.equal(r.status, "APPROVED");
  assert.equal(r.finalScore, 4);
});

test("two rules with a low ML score goes to review", () => {
  const r = aggregateScore(["VELOCITY_SPIKE", "CARD_TESTING_PATTERN"], 0.15);
  assert.equal(r.status, "REVIEW");
  assert.equal(r.finalScore, 46);
});

test("three rules plus a mid ML score is blocked", () => {
  const r = aggregateScore(
    ["VELOCITY_SPIKE", "AMOUNT_ANOMALY", "CARD_TESTING_PATTERN"],
    0.5,
  );
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.finalScore, 80);
});

test("rule points are capped at 60", () => {
  const rules = [
    "VELOCITY_SPIKE",
    "AMOUNT_ANOMALY",
    "CARD_TESTING_PATTERN",
    "X",
    "Y",
  ];
  const r = aggregateScore(rules, 0);
  assert.equal(r.finalScore, 60);
  assert.equal(r.status, "REVIEW");
});

test("a hard-block rule forces a block at score 100", () => {
  const r = aggregateScore(["BLOCKED_COUNTRY"], 0.1);
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.finalScore, 100);
  assert.match(r.decisionReason, /BLOCKED_COUNTRY/);
});

test("hard-block list is configurable", () => {
  const r = aggregateScore(["BLOCKED_COUNTRY"], 0.1, { hardBlockRules: [] });
  assert.equal(r.status, "APPROVED");
});

test("a high-confidence ML score blocks on its own", () => {
  const r = aggregateScore([], 0.97);
  assert.equal(r.status, "BLOCKED");
  assert.ok(r.finalScore >= 71);
  assert.equal(r.decisionReason, "High-confidence ML score");
});

test("custom thresholds are respected", () => {
  const r = aggregateScore(["VELOCITY_SPIKE"], 0, {
    reviewThreshold: 10,
    blockThreshold: 20,
  });
  assert.equal(r.status, "BLOCKED");
});
