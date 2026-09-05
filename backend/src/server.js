import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
