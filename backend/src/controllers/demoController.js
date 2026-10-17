import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { processTransaction } from "../services/pipeline.js";
import { getRuleConfig } from "../services/ruleConfigService.js";

const SAMPLES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/demo_samples.json",
);

let samplesCache;

function loadSamples() {
  if (samplesCache) return samplesCache;
  try {
    samplesCache = JSON.parse(fs.readFileSync(SAMPLES_PATH, "utf8"));
  } catch {
    samplesCache = null;
  }
  return samplesCache;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function pick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTx(base, sample, amountOverride) {
  if (!sample) return { ...base, amount: amountOverride ?? 42.5 };
  return {
    ...base,
    amount: Math.max(0.01, amountOverride ?? sample.amount),
    mlFeatures: { time: sample.time, v: sample.v },
  };
}

export function createDemoHandler(io) {
  return async function handleDemo(req, res, next) {
    try {
      const { scenario } = req.body ?? {};
      const userId = `demo_${Math.random().toString(36).slice(2, 8)}`;
      const base = {
        userId,
        ip: "203.0.113.7",
        billingCountry: "US",
        cardToken: `tok_${userId}`,
      };
      const samples = loadSamples();
      const out = [];

      switch (scenario) {
        case "normal": {
          const tx = buildTx(base, samples && pick(samples.normal));
          out.push(await processTransaction(tx, io, "demo"));
          break;
        }
        case "ml_fraud": {
          if (!samples?.fraud?.length) {
            throw httpError(
              503,
              "Demo samples are not installed on this server",
            );
          }
          const tx = buildTx(base, pick(samples.fraud));
          out.push(await processTransaction(tx, io, "demo"));
          break;
        }
        case "blocked_country": {
          const config = await getRuleConfig();
          const country = config.blockedCountries?.[0];
          if (!country) {
            throw httpError(
              400,
              "No blocked countries configured. Add one in the Rules tab.",
            );
          }
          const tx = buildTx(
            { ...base, billingCountry: country },
            samples && pick(samples.normal),
            60,
          );
          out.push(await processTransaction(tx, io, "demo"));
          break;
        }
        case "card_testing": {
          for (let i = 0; i < 5; i++) {
            const tx = buildTx(base, samples && pick(samples.normal), 1.5);
            out.push(await processTransaction(tx, io, "demo"));
          }
          break;
        }
        default:
          throw httpError(400, `Unknown demo scenario: ${scenario}`);
      }

      res.status(201).json({ scenario, transactions: out });
    } catch (err) {
      next(err);
    }
  };
}
