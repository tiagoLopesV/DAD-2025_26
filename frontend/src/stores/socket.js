import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'
import { useGameStore } from './game'
import { useRouter } from 'vue-router'
import { useAPIStore } from './api'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')
  const apiStore = useAPIStore()
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  const router = useRouter()

  const joined = ref(false)

  // ----------------- Maps and State -----------------
  const matchIdMap = new Map()   // socketGameId -> DB match id
  const gameIdMap = new Map()    // roundKey -> DB game id

  const createdMatches = new Set()   // matches already created
  const finishedMatches = new Set()  // matches ended
  const processedRounds = new Set()  // rounds saved

  // ----------------- Utils -----------------
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const getRoundKey = game => `${game.id}-${game.player1.marks}-${game.player2.marks}`

  const waitForMatchId = async (socketMatchId, timeout = 3000) => {
    const start = Date.now()
    while (!matchIdMap.has(socketMatchId)) {
      if (Date.now() - start > timeout) {
        console.error('❌ Match ID timeout:', socketMatchId)
        return null
      }
      await sleep(50)
    }
    return matchIdMap.get(socketMatchId)
  }

  // ----------------- Socket Emitters -----------------
  const emitJoin = () => {
    if (joined.value || !authStore.currentUser) return
    socket.emit('join', authStore.currentUser)
    joined.value = true
    console.log(`[Socket] Joined as ${authStore.currentUser.name}`)
  }

  const emitCancelGame = (gameId) => {
    console.log("A fechar mesa:", gameId)
    socket.emit('cancel-game', gameId)
  }

  const emitLeaveGame = (gameId) => {
    socket.emit('leave-game', gameId)
  }

  const emitCreateGame = (type, variant, stake) => {
    const finalStake = type === 'match' ? stake : 2
    socket.emit('create-game', type, variant, finalStake)
  }

  const emitJoinGame = (gameId) => {
    if (authStore.currentUser.coins_balance < 2) return
    socket.emit('join-game', gameId)
  }

  const emitPlayCard = (gameId, cardId) => {
    socket.emit('play-card', gameId, cardId)
  }

  const emitGetGames = () => {
    socket.emit('get-games')
  }


  // ----------------- Connection Handlers -----------------
  const handleConnection = () => {
    socket.on('connect', () => {
      console.log(`[Socket] Connected: ${socket.id}`)
      if (authStore.currentUser && !joined.value) emitJoin()
    })
    socket.on('disconnect', () => { joined.value = false; console.log('[Socket] Disconnected') })
  }

  // ----------------- Match Finisher -----------------
  const endMatchIfNeeded = async (game) => {
    if (game.type !== 'match') return

    // Detetar se o jogo foi interrompido por timeout ou desistência
    // Ajusta 'interrupted' ou 'timeout' conforme o que o teu servidor emite
    const isAborted = game.status === 'interrupted' || game.status === 'timeout' || game.timeout === true
    const hasReachedMaxMarks = game.player1.marks >= 4 || game.player2.marks >= 4
    
    // O Match termina se alguém chegou às 4 marcas OU se foi abortado
    const matchFinished = hasReachedMaxMarks || isAborted || game.complete

    if (!matchFinished) return
    if (finishedMatches.has(game.id)) return

    finishedMatches.add(game.id)
    console.log('🏁 Match Terminado:', isAborted ? 'Por Timeout/Desistência' : 'Por Pontuação')

    // 1. Gravar a última ronda (Game)
    const roundKey = getRoundKey(game)
    if (!processedRounds.has(roundKey)) {
      processedRounds.add(roundKey)
      await saveGame(game, 'Ended')
    }

    console.log('Dados para o Laravel:', {
        id: game.id,
        status: 'Ended',
        winner: game.winner // VERIFICA ISTO NA CONSOLA DO BROWSER
    });

    // 2. Gravar o Match (Isto dispara o Payout no Laravel)
    // GARANTE QUE O WINNER ESTÁ DEFINIDO NO SOCKET SERVER
    await saveMatch(game, 'Ended')
  }

  // ----------------- Game Event Handlers -----------------
  const handleGameEvents = () => {
    socket.off('games')
    socket.off('game-change')

    socket.on('games', games => gameStore.setLobbyGames(games))

    socket.on('game-change', async game => {
      gameStore.setActiveGame(game)

      // ---------------- START ----------------
      if (game.started && !game.complete) {
        if (router.currentRoute.value.path.includes('lobby')) {
          router.push({ name: 'multiplayer', params: { id: game.id } })
        }

        if (authStore.currentUser.id === game.creator && !createdMatches.has(game.id)) {
          createdMatches.add(game.id)

          if (game.type === 'match') await saveMatch(game, 'Playing')
          await saveGame(game, 'Playing')
        }
      }

      // ---------------- END ----------------
      if (game.complete && authStore.currentUser.id === game.creator) {
        if (game.type === 'standalone') {
          if (!processedRounds.has(game.id)) {
            processedRounds.add(game.id)
            await saveGame(game, 'Ended')
          }
        }

        if (game.type === 'match') {
          await endMatchIfNeeded(game)
        }
      }
    })
  }

  // ----------------- Persistence -----------------
  const saveMatch = async (game, status) => {
    const socketMatchId = game.id
    const dbMatchId = matchIdMap.get(socketMatchId) ?? null

    const payload = {
      id: dbMatchId,
      type: game.variant,
      player1_user_id: game.player1.id,
      player2_user_id: game.player2.id,
      status,
      stake: game.stake,
      began_at: game.beganAt,
      ended_at: status === 'Ended' ? new Date().toISOString() : null,
      player1_marks: game.player1.marks || 0,
      player2_marks: game.player2.marks || 0,
      // Usar pontos acumulados do Match
      player1_points: game.player1.cumulativePoints || 0,
      player2_points: game.player2.cumulativePoints || 0,
      winner_user_id: status === 'Ended' ? game.winner : null
    }

    const response = await apiStore.postMatch(payload)
    if (response?.data?.id) {
      matchIdMap.set(socketMatchId, response.data.id)
    }
  }

  const saveGame = async (game, status) => {
    let dbMatchId = null
    if (game.type === 'match') {
      dbMatchId = await waitForMatchId(game.id)
      if (!dbMatchId) return
    }

    const roundKey = getRoundKey(game)
    const dbGameId = gameIdMap.get(roundKey) ?? null

    console.log('🧪 USING MATCH ID:', dbMatchId)

    const payload = {
      id: dbGameId,
      type: game.variant === '3' ? '3' : '9',
      status,
      player1_user_id: game.player1.id,
      player2_user_id: game.player2.id,
      match_id: dbMatchId,
      began_at: game.beganAt,
      ended_at: status === 'Ended' ? new Date().toISOString() : null,
      player1_points: game.player1.points || 0,
      player2_points: game.player2.points || 0,
      is_draw: status === 'Ended' && game.winner === 'draw',
      winner_user_id: status === 'Ended' && game.winner !== 'draw' ? game.winner : null,
      total_time: status === 'Ended' ? Math.ceil((Date.now() - new Date(game.beganAt)) / 1000) : 0
    }

    const response = await apiStore.postGame(payload)
    if (response?.data?.id) {
      gameIdMap.set(roundKey, response.data.id)
      console.log('✅ GAME ID STORED:', roundKey, response.data.id)
    }
  }

  return {
    socket,
    joined,
    handleConnection,
    handleGameEvents,
    emitJoin,
    emitLeaveGame,
    emitCancelGame,
    emitCreateGame,
    emitJoinGame,
    emitPlayCard,
    emitGetGames
  }
})
