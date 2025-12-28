import { Server } from "socket.io";
import { handleConnectionEvents } from "./events/connection.js";

export const server = {
  io: null,
};

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      origin: "http://localhost:5173", // your Vite frontend
      methods: ["GET", "POST"],
      credentials: true, // allow cookies / headers
    },
  });
  server.io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    handleConnectionEvents(server.io, socket);
  });
};
