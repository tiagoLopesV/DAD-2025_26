const games = new Map()
let currentGameID = 0
const moveTimeouts = new Map()

const CARD_VALUES = {
    'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2,
    '6': 0, '5': 0, '4': 0, '3': 0, '2': 0
}
const POWER_ORDER = ['A', '7', 'K', 'J', 'Q', '6', '5', '4', '3', '2']

// --- AUXILIARES ---
const generateDeck = () => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const values = ['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K']
    let deck = []
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ id: `${suit}_${value}`, suit, value, points: CARD_VALUES[value], flipped: false })
        })
    })
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
}

export const getGame = (gameID) => {
    return games.get(Number(gameID))
}

export const getGames = () => {
    return Array.from(games.values()).filter(game => !game.complete)
}

export const removeGame = (gameID) => {
    return games.delete(Number(gameID))
}

const evaluateTrick = (move1, move2, trumpSuit) => {
    const card1 = move1.card
    const card2 = move2.card
    if (card1.suit === card2.suit) {
        return POWER_ORDER.indexOf(card1.value) < POWER_ORDER.indexOf(card2.value) ? move1.playerId : move2.playerId
    }
    if (card2.suit === trumpSuit) return move2.playerId
    if (card1.suit === trumpSuit) return move1.playerId
    return move1.playerId
}

// --- CORE LOGIC ---
export const createGame = (type, variant, user, customStake) => { 
    currentGameID++
    const finalStake = type === 'match' ? (customStake || 3) : 2
    const game = {
        id: currentGameID,
        type: type,
        variant: variant,
        creator: user.id,
        player1: { id: user.id, name: user.name, hand: [], points: 0, marks: 0 },
        player2: null,
        winner: null,
        firstPlayerInHand: user.id,
        currentPlayer: user.id,
        board: [],
        deck: generateDeck(),
        trump: null,
        started: false,
        complete: false,
        beganAt: null,
        endedAt: null,
        stake: finalStake,
        currentStake: finalStake,
        payoutDetails: null
    }
    game.trump = game.deck[game.deck.length - 1]
    games.set(currentGameID, game)
    return game
}

export const startGame = (gameID, player2, io) => {
    const game = games.get(gameID)
    if (!game) return
    game.player2 = { id: player2.id, name: player2.name, hand: [], points: 0, marks: 0 }
    dealCards(game)
    game.started = true
    game.beganAt = new Date()
    resetMoveTimer(gameID, io) // Inicia timer no primeiro turno
    return game
}

const dealCards = (game) => {
    const numCards = parseInt(game.variant) || 3
    game.player1.hand = game.deck.splice(0, numCards).map(c => ({ ...c, flipped: true }))
    game.player2.hand = game.deck.splice(0, numCards).map(c => ({ ...c, flipped: true }))
}

export const playCard = (gameID, userId, cardId, io) => {
    const game = games.get(gameID)
    if (!game || game.currentPlayer !== userId || game.board.length >= 2) return null
    
    const player = game.player1.id === userId ? game.player1 : game.player2
    const cardIndex = player.hand.findIndex(c => c.id === cardId)
    if (cardIndex === -1) return null

    const selectedCard = player.hand[cardIndex]

    // REGRA DE ASSISTIR (Fase sem baralho)
    if (game.deck.length === 0 && game.board.length === 1) {
        const leadCard = game.board[0].card
        const hasMatchingSuit = player.hand.some(c => c.suit === leadCard.suit)
        if (hasMatchingSuit && selectedCard.suit !== leadCard.suit) return null 
    }

    const card = player.hand.splice(cardIndex, 1)[0]
    game.board.push({ card, playerId: userId })

    if (game.board.length === 2) {
        const winnerId = evaluateTrick(game.board[0], game.board[1], game.trump.suit)
        const trickPoints = game.board[0].card.points + game.board[1].card.points
        const winner = game.player1.id === winnerId ? game.player1 : game.player2
        winner.points += trickPoints
        game.currentPlayer = winnerId
    } else {
        game.currentPlayer = game.player1.id === userId ? game.player2.id : game.player1.id
    }
    
    resetMoveTimer(gameID, io) // Reinicia timer após jogada válida
    return game
}

export const drawCards = (gameID) => {
    const game = games.get(gameID)
    if (!game) return null
    if (game.deck.length > 0) {
        const winner = game.player1.id === game.currentPlayer ? game.player1 : game.player2
        const loser = game.player1.id === game.currentPlayer ? game.player2 : game.player1
        winner.hand.push({ ...game.deck.shift(), flipped: true })
        if (game.deck.length > 0) loser.hand.push({ ...game.deck.shift(), flipped: true })
    }
    game.board = []
    return game
}

// --- TIMEOUT & FORFEIT ---
export const resetMoveTimer = (gameID, io) => {
    // Se o io não vier, o timer é inútil porque não consegue avisar ninguém
    if (!io) {
        console.error("ERRO CRÍTICO: resetMoveTimer chamado sem 'io'. O timeout não vai funcionar.");
        return; 
    }

    if (moveTimeouts.has(gameID)) {
        clearTimeout(moveTimeouts.get(gameID));
    }


    const timeout = setTimeout(() => {
        handleMoveTimeout(gameID, io);
    }, 20500); 

    moveTimeouts.set(gameID, timeout);
};

const handleMoveTimeout = (gameID, io) => {
    const game = games.get(gameID);
    if (!game || game.complete) return;

    console.log(`[Timer] Timeout na mesa ${gameID}. Jogador ${game.currentPlayer} perdeu.`);

    // 1. Executa o quitGame para definir o vencedor e marcar complete = true
    quitGame(gameID, game.currentPlayer);

    // 2. IMPORTANTE: Envia o estado atualizado para os clientes primeiro
    // Isso garante que o useSocketStore receba o game.winner
    io.to(`game-${gameID}`).emit("game-change", game);
};

export const quitGame = (gameID, quittingUserId) => {
    const game = games.get(Number(gameID))
    if (!game || game.complete) return null

    const winner = game.player1.id === quittingUserId ? game.player2 : game.player1
    const loser = game.player1.id === quittingUserId ? game.player1 : game.player2

    // REGRA: Vencedor ganha todas as cartas restantes
    const remainingCards = [...loser.hand, ...winner.hand, ...game.deck]
    winner.points += remainingCards.reduce((sum, c) => sum + (c.points || 0), 0)
    
    winner.hand = []; loser.hand = []; game.deck = []; game.board = []
    game.complete = true
    game.winner = winner.id
    game.reason = 'timeout'
    game.endedAt = new Date()

    // Payout
    const payout = game.type === 'standalone' ? 3 : (game.stake * 2) - 1
    game.payoutDetails = { winnerId: winner.id, amount: payout }
    
    if (moveTimeouts.has(game.id)) clearTimeout(moveTimeouts.get(game.id))
    return game
}

export const checkForGameComplete = (gameID) => {
    const game = games.get(gameID)
    if (game.deck.length === 0 && game.player1.hand.length === 0 && game.player2.hand.length === 0) {
        game.complete = true
        game.endedAt = new Date()
        if (game.type === 'standalone') calculateStandaloneWinner(game)
        else processMatchHand(game)
        if (moveTimeouts.has(game.id)) clearTimeout(moveTimeouts.get(game.id))
    }
    return game
}

// Lógica Específica para Standalone (Moedas Diretas)
const calculateStandaloneWinner = (game) => {
    if (game.player1.points === game.player2.points) {
        game.winner = 'draw'
        game.payoutDetails = { p1: 1, p2: 1 } // Empate: Reembolso de 1 (Custo é 2)
    } else {
        const isP1Winner = game.player1.points > game.player2.points
        game.winner = isP1Winner ? game.player1.id : game.player2.id
        const winnerPoints = isP1Winner ? game.player1.points : game.player2.points
        
        // Regras de Prémio: 61+ pts = 3 moedas | 91+ pts (Capote) = 4 moedas | 120 pts (Bandeira) = 6 moedas
        let amount = 3
        if (winnerPoints === 120) amount = 6
        else if (winnerPoints >= 91) amount = 4
        
        game.payoutDetails = {
            winnerId: game.winner,
            amount: amount
        }
    }
}

// Lógica Específica para Match (Marcas)
const processMatchHand = (game) => {
    // 1. Atribuir Marcas baseadas nos pontos
    let marksWon = 0
    let handWinner = null // 'p1', 'p2' ou null (empate)

    if (game.player1.points > 60) {
        handWinner = 'p1'
        // 120 = 3 marcas, >=91 = 2 marcas, normal = 1 marca
        marksWon = game.player1.points === 120 ? 3 : (game.player1.points >= 91 ? 2 : 1)
        game.player1.marks += marksWon
    } else if (game.player2.points > 60) {
        handWinner = 'p2'
        marksWon = game.player2.points === 120 ? 3 : (game.player2.points >= 91 ? 2 : 1)
        game.player2.marks += marksWon
    }
    // Empate (60-60) ninguém ganha marcas

    // 2. Verificar se alguém ganhou o Match (>= 4 marcas)
    if (game.player1.marks >= 4 || game.player2.marks >= 4) {
        game.complete = true
        game.endedAt = new Date()
        
        // Quem tem mais marcas ganha (se ambos passaram de 4 na mesma jogada, quem tem mais leva)
        const isP1MatchWinner = game.player1.marks > game.player2.marks
        game.winner = isP1MatchWinner ? game.player1.id : game.player2.id
        
        // Prémio do Match: (Stake Total) - 1 moeda de comissão
        const totalPrize = (game.currentStake * 2) - 1
        
        game.payoutDetails = {
            winnerId: game.winner,
            amount: totalPrize
        }
    } else {
        // 3. Se ninguém ganhou, prepara a PRÓXIMA RONDA
        startNextHand(game)
    }
}

const startNextHand = (game) => {
    // 1. Alternar quem começa
    const nextToStart = game.firstPlayerInHand === game.player1.id 
        ? game.player2.id 
        : game.player1.id;

    game.firstPlayerInHand = nextToStart;
    game.currentPlayer = nextToStart;

    // 2. Reset do estado da mesa
    game.deck = generateDeck();
    game.trump = game.deck[game.deck.length - 1];
    game.player1.points = 0;
    game.player2.points = 0;
    game.board = [];

    // 3. Redistribuir cartas
    dealCards(game);
}