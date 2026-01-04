import { Server } from "socket.io";
import { handleConnectionEvents } from "./events/connection.js";
import { handleGameEvents } from "./events/game.js"
import { handleCoinEvents } from "./events/coin.js"

export const server = {
  io: null,
};

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      cors: { origin: '*' },
      methods: ["GET", "POST"],
    },
  })
  server.io.on("connection", (socket) => {
    console.log("New connection:", socket.id)

    handleConnectionEvents(server.io, socket)
    handleGameEvents(server.io, socket)
    handleCoinEvents(server.io, socket)
  })
}