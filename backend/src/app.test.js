import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
process.env.INGEST_API_KEY = "test-ingest-key-123";
process.env.ADMIN_API_KEY = "test-admin-key-123";

const { createApp } = await import("./app.js");
const app = createApp({ emit() {} });

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("POST /transactions without an API key is unauthorized", async () => {
  const res = await request(app)
    .post("/api/v1/transactions")
    .send({ userId: "u", amount: 5 });
  assert.equal(res.status, 401);
});

test("POST /transactions with an invalid body returns 400 and details", async () => {
  const res = await request(app)
    .post("/api/v1/transactions")
    .set("x-api-key", "test-ingest-key-123")
    .send({ userId: "u", amount: -5 });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Validation failed");
  assert.equal(res.body.details[0].field, "amount");
});

test("PUT /rules without an admin key is unauthorized", async () => {
  const res = await request(app)
    .put("/api/v1/rules")
    .send({ velocityMaxTxPerWindow: 5 });
  assert.equal(res.status, 401);
});

test("POST /demo rejects unknown scenarios", async () => {
  const res = await request(app)
    .post("/api/v1/transactions/demo")
    .send({ scenario: "nope" });
  assert.equal(res.status, 400);
});

test("malformed JSON returns 400", async () => {
  const res = await request(app)
    .post("/api/v1/transactions")
    .set("x-api-key", "test-ingest-key-123")
    .set("Content-Type", "application/json")
    .send("{bad json");
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Invalid JSON");
});

test("unknown routes return 404", async () => {
  const res = await request(app).get("/nope");
  assert.equal(res.status, 404);
});
