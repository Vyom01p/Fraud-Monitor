import { Server } from "socket.io";

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*" },
  });
  io.on("connection", (socket) => {
    console.log("Dashboard Connected :", socket.id);
    socket.on("disconnect", () =>
      console.log("Database disconnected:", socket.id),
    );
  });
  return io;
}
