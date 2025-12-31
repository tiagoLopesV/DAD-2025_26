import { server } from "../server.js";
import { getUser } from "../state/connection.js"

export const handleGameEvents = (io, socket) => {

  socket.on("join-game", (matchId) => {
    socket.join(`match-${matchId}`);
  });

  socket.on("play-card", (data) => {
    const { matchId, card } = data;
    
    // Obtemos o utilizador através do socket.id (Segurança G3)
    const user = getUser(socket.id);

    if (user) {
      const roomName = `match-${matchId}`;

      // Emitimos para a sala: quem jogou e qual a carta
      server.io.to(roomName).emit("card-played", {
        card: card,
        userId: user.id,
        userName: user.name
      });

      console.log(`${user.name} played ${card.value} of ${card.suit} in match ${matchId}`);
    }
  });
};