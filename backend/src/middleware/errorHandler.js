import { logger } from "../config/logger.js";

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) logger.error({ err }, "Unhandled error");
  res
    .status(status)
    .json({ error: status >= 500 ? "Internal Server Error" : err.message });
}
