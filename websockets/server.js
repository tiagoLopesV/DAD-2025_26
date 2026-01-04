import { Server } from "socket.io";
import { handleConnectionEvents } from "./events/connection.js";
import { handleGameEvents } from "./events/game.js"

export const server = {
  io: null,
};

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      origin: ["http://web-dad-group-42-172.22.21.253.sslip.io"], // frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  })
  server.io.on("connection", (socket) => {
    console.log("New connection:", socket.id)

    handleConnectionEvents(server.io, socket)
    handleGameEvents(server.io, socket)
  })
}