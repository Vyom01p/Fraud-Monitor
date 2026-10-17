import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: env.CLIENT_ORIGINS } });

  io.on("connection", (socket) => {
    logger.debug({ id: socket.id }, "Dashboard connected");
    socket.on("disconnect", () =>
      logger.debug({ id: socket.id }, "Dashboard disconnected"),
    );
  });

  return io;
}
