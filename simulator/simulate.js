import axios from "axios";
const API_URL = "http://localhost:5000/api/v1/transactions";

const FRAUD_PERCENT = 0.2;
const INTERVAL_MS = 2000;

const users = ["user_1", "user_2", "user_3", "user_4"];
const countries = ["IN", "US", "UK", "JP"];
const blockedCountries = ["XX", "YY"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
