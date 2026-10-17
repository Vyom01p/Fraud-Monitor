import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { transactionRoutes } from "./routes/transactionRoutes.js";
import { ruleRoutes } from "./routes/ruleRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp(io) {
  const app = express();

  if (env.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/health" },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGINS }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use("/api/v1/transactions", transactionRoutes(io));
  app.use("/api/v1/rules", ruleRoutes());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
