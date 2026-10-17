import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const API_URL = `${process.env.API_URL ?? "http://localhost:5000"}/api/v1/transactions`;
const API_KEY = process.env.INGEST_API_KEY;
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 1500);
const FRAUD_PERCENT = Number(process.env.FRAUD_PERCENT ?? 0.15);
const CSV_PATH =
  process.env.CSV_PATH ??
  path.resolve(here, "../ml-service/data/replay_holdout.csv");

const BLOCKED = ["XX", "YY"];
const COUNTRIES = ["US", "GB", "IN", "DE", "FR", "CA"];
const users = Array.from({ length: 150 }, (_, i) => `user_${i + 1}`);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomIp = () =>
  `${rand(1, 223)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;

async function loadRows() {
  const normal = [];
  const fraud = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let header = true;
  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const p = line.split(",").map((s) => s.replace(/"/g, ""));
    if (p.length < 31) continue;
    const row = {
      time: Number(p[0]),
      v: p.slice(1, 29).map(Number),
      amount: Number(p[29]),
      label: Number(p[30]),
    };
    if (!(row.amount > 0)) continue;
    (row.label === 1 ? fraud : normal).push(row);
  }
  return { normal, fraud };
}

function toPayload(row, userId, extra = {}) {
  return {
    userId,
    amount: Math.max(0.01, Number(row.amount.toFixed(2))),
    ip: randomIp(),
    billingCountry: pick(COUNTRIES),
    cardToken: `tok_${userId}`,
    mlFeatures: { time: row.time, v: row.v },
    ...extra,
  };
}

async function post(payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(res.status, JSON.stringify(data));
      return;
    }
    const t = data.transaction;
    console.log(
      `[${t.status}] ${t.userId} $${t.amount.toFixed(2)} score=${t.finalScore} ml=${t.mlRiskScore?.toFixed(3)} rules=${t.rulesTriggered.join(",") || "-"}`,
    );
  } catch (err) {
    console.error("Request failed:", err.message);
  }
}

const { normal, fraud } = await loadRows();
console.log(
  `Loaded ${normal.length} normal and ${fraud.length} fraud rows from ${CSV_PATH}`,
);
if (!normal.length || !fraud.length) {
  console.error("Dataset rows missing. Run train_model.py first.");
  process.exit(1);
}

async function velocityBurst() {
  const user = pick(users);
  for (let i = 0; i < 5; i++) await post(toPayload(pick(normal), user));
}

async function cardTesting() {
  const user = pick(users);
  for (let i = 0; i < 4; i++)
    await post(toPayload(pick(normal), user, { amount: 1 + Math.random() }));
  await post(
    toPayload(pick(normal), user, { amount: 800 + Math.random() * 1500 }),
  );
}

async function tick() {
  const r = Math.random();
  if (r < FRAUD_PERCENT * 0.5) return post(toPayload(pick(fraud), pick(users)));
  if (r < FRAUD_PERCENT * 0.7) return velocityBurst();
  if (r < FRAUD_PERCENT * 0.85) return cardTesting();
  if (r < FRAUD_PERCENT)
    return post(
      toPayload(pick(normal), pick(users), { billingCountry: pick(BLOCKED) }),
    );
  return post(toPayload(pick(normal), pick(users)));
}

async function loop() {
  await tick();
  setTimeout(loop, INTERVAL_MS);
}

console.log(`Posting to ${API_URL} every ${INTERVAL_MS}ms (Ctrl+C to stop)`);
loop();
