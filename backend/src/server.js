import http from "node:http";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import { createApp } from "./app.js";

let app;
const httpServer = http.createServer((req, res) => app(req, res));
const io = initSocket(httpServer);
app = createApp(io);

await connectDB();

httpServer.listen(env.PORT, () =>
  logger.info(`Server listening on port ${env.PORT}`),
);

function shutdown(signal) {
  logger.info({ signal }, "Shutting down");
  io.close(() => {
    mongoose.connection.close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) =>
  logger.error({ err }, "Unhandled rejection"),
);
