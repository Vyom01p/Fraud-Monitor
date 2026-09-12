import axios from "axios";

const API_URL = "http://localhost:5000/api/v1/transactions";
const FRAUD_PERCENT = 0.2;
const INTERVAL_MS = 2000;

const users = ["user_1", "user_2", "user_3", "user_4"];
const countries = ["US", "UK", "IN", "DE"];
const blockedCountries = ["XX", "YY"]; // match RuleConfig.blockedCountries to test geo-fencing

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransaction() {
  const isFraudAttempt = Math.random() < FRAUD_PERCENT;

  if (isFraudAttempt) {
    return {
      userId: randomChoice(users),
      amount: Math.random() < 0.5 ? 999 + Math.random() * 5000 : 1.5,
      ip: "203.0.113.1",
      billingCountry:
        Math.random() < 0.5
          ? randomChoice(blockedCountries)
          : randomChoice(countries),
      cardToken: "tok_test",
    };
  }

  return {
    userId: randomChoice(users),
    amount: 10 + Math.random() * 100,
    ip: "198.51.100.1",
    billingCountry: randomChoice(countries),
    cardToken: "tok_test",
  };
}

async function tick() {
  const tx = generateTransaction();
  try {
    const { data } = await axios.post(API_URL, tx);
    console.log(
      `[${data.transaction.status}] $${tx.amount.toFixed(2)} — score ${data.transaction.finalScore}`,
    );
  } catch (err) {
    console.error("Simulator request failed:", err.message);
  }
}

console.log(
  `Starting simulator — posting to ${API_URL} every ${INTERVAL_MS}ms`,
);
setInterval(tick, INTERVAL_MS);
