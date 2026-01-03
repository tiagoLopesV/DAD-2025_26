import { getUser } from "../state/connection.js"
import {
  createGame,
  getGames,
  getGame,
  removeGame,
  quitGame,
  startGame,
  playCard,
  drawCards,
  checkForGameComplete,
  resetMoveTimer
} from "../state/game.js"
import { server } from "../server.js"

export const handleGameEvents = (io, socket) => {

  // Criar um novo jogo (standalone ou match)
  socket.on("create-game", (type, variant, stake) => {
    const user = getUser(socket.id)
    console.log("Tentativa de criar jogo. User encontrado:", user)

    if (!user) {
      console.log("Erro: Socket ID não associado a nenhum utilizador.")
      return
    }

    const game = createGame(type, variant, user, stake)
    socket.join(`game-${game.id}`)
    console.log(`[Bisca] ${user.name} criou mesa #${game.id} (${type})`)

    io.emit("games", getGames())
  })

  socket.on("get-games", () => {
    socket.emit("games", getGames())
  })

  socket.on("join-game", (gameID) => {
    const user = getUser(socket.id)
    if (!user) return

    const game = startGame(gameID, user, io)

    if (game) {
      socket.join(`game-${gameID}`)
      io.emit("games", getGames()) // Atualiza lobby (remove a mesa da lista)
      io.to(`game-${gameID}`).emit("game-change", game)
    }
  })

  socket.on("play-card", (gameID, cardID) => {
    const user = getUser(socket.id)
    const game = playCard(gameID, user.id, cardID, io)

    if (game) {
      // Envia o estado com a carta na mesa
      io.to(`game-${gameID}`).emit("game-change", game)

      // Se a rodada acabou (2 cartas), espera um pouco e limpa
      if (game.board.length === 2) {
        setTimeout(() => {
          triggerNextTurn(gameID)
        }, 1500)
      }
    }
  })

  socket.on("cancel-game", (gameID) => {
    const game = getGame(gameID)

    // Regra de segurança: Só cancela se o jogo NÃO começou
    if (game && !game.started) {
      removeGame(gameID)
      console.log(`[Bisca] Mesa #${gameID} cancelada com sucesso.`)

      // Atualiza o lobby para toda a gente
      io.emit("games", getGames())
    } else {
      console.log(`[Bisca] Tentativa inválida de cancelar mesa #${gameID}`)
    }
  })

  // Se quiseres implementar o SAIR (Leave) durante o jogo
  socket.on("leave-game", (gameID) => {
    const user = getUser(socket.id)
    if (!user) return

    const game = quitGame(gameID, user.id)
    if (game) {
      io.to(`game-${gameID}`).emit("game-change", game)
      io.emit("games", getGames())
    }
  })

  socket.on("player-timeout", (gameID) => {
    const user = getUser(socket.id);
    if (!user) return;

    // Chamamos a função quitGame que já tens e que já limpa o timer
    const game = quitGame(gameID, user.id);

    if (game) {
        console.log(`[Timer] Timeout na mesa ${gameID}. Jogador ${user.name} perdeu.`);
        
        // Notifica todos na sala que o jogo acabou
        io.to(`game-${gameID}`).emit("game-change", game);
        
        // Atualiza o lobby para remover o jogo da lista
        io.emit("games", getGames());
    }
})
}

// Processa a limpeza da mesa e verifica fim do jogo
export const triggerNextTurn = (gameID) => {
  let game = drawCards(gameID)
  game = checkForGameComplete(gameID)

  server.io.to(`game-${gameID}`).emit("game-change", game)

  // Se o jogo NÃO acabou, temos de reiniciar o timer para o jogador que vai começar a ronda
  if (!game.complete) {
    resetMoveTimer(gameID, server.io)
  } else {
    console.log(`[Bisca] Jogo #${game.id} terminado.`)
  }
}