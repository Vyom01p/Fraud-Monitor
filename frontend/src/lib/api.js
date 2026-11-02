import axios from "axios";
import { API_URL } from "../config.js";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 45000,
});

export function errorMessage(err) {
  const data = err.response?.data;
  if (data?.details)
    return data.details.map((d) => `${d.field}: ${d.message}`).join(" · ");
  return data?.error || err.message;
}
