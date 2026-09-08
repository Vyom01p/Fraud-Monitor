import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import { transactionRoutes } from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

app.use("/api/v1/transactions", transactionRoutes(io));

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`),
  );
});
