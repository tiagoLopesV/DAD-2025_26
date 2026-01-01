import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'

export const useGameStore = defineStore('game', () => {
  // --- REGRAS E PONTUAÇÃO ---
  const pointsMap = { 'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2 }
  const cardPower = { 'A': 10, '7': 9, 'K': 8, 'J': 7, 'Q': 6, '6': 5, '5': 4, '4': 3, '3': 2, '2': 1 }

  // --- ESTADO ---
  const gameType = ref('3') 
  const myHand = ref([])
  const botHand = ref([])
  const cardsOnTable = ref([])
  const trump = ref(null)
  const deck = ref([])
  const player1 = ref({ points: 0, marks: 0 })
  const player2 = ref({ points: 0, marks: 0 })
  const myTurn = ref(true)
  const leaderThisTrick = ref(true) 
  const isResolving = ref(false)
  const lastWinner = ref(null) // 1 = Tu, 2 = BOT
  const gameMode = ref('game') // 'game' ou 'match'
  const isGameComplete = ref(false)

  // --- COMPUTED ---
  const isDeckEmpty = computed(() => deck.value.length === 0)
  const deckCount = computed(() => deck.value.length)
  const opponentCardCount = computed(() => botHand.value.length)
  const isMatchOver = computed(() => player1.value.marks >= 4 || player2.value.marks >= 4)

  // --- AUXILIARES ---
  const canFollowSuit = (hand, suit) => hand.some(c => c.suit === suit)

  // --- AÇÕES ---
  const prepareNewGame = (variant = '3', mode = 'game') => {
    gameType.value = variant
    gameMode.value = mode
    const suits = ['hearts', 'diamonds', 'spades', 'clubs']
    const values = ['A', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K']
    
    let newDeck = []
    suits.forEach(s => values.forEach(v => {
      newDeck.push({ suit: s, value: v, id: `${s}${v}`, flipped: false })
    }))
    
    newDeck.sort(() => Math.random() - 0.5)
    deck.value = newDeck
    trump.value = deck.value[0]
    trump.value.flipped = true

    const count = parseInt(gameType.value)
    myHand.value = deck.value.splice(-count).map(c => ({ ...c, flipped: true }))
    botHand.value = deck.value.splice(-count).map(c => ({ ...c, flipped: false }))
    
    player1.value.points = 0
    player2.value.points = 0
    if (mode === 'game') {
      player1.value.marks = 0
      player2.value.marks = 0
    }
    cardsOnTable.value = []
    isResolving.value = false
    lastWinner.value = null

    if (!myTurn.value) playBotMove()
  }

  const playCard = (card) => {
    if (!myTurn.value || isResolving.value || cardsOnTable.value.length >= 2) return

    // REGRA FASE FINAL: Assistir ao naipe
    if (isDeckEmpty.value && cardsOnTable.value.length === 1) {
      const leadCard = cardsOnTable.value[0]
      if (canFollowSuit(myHand.value, leadCard.suit) && card.suit !== leadCard.suit) {
        toast.error(`Must follow suit: ${leadCard.suit}`)
        return
      }
    }

    const index = myHand.value.findIndex(c => c.id === card.id)
    if (index !== -1) {
      const played = myHand.value.splice(index, 1)[0]
      if (cardsOnTable.value.length === 0) leaderThisTrick.value = true
      cardsOnTable.value.push(played)
      
      if (cardsOnTable.value.length === 2) resolveTrick()
      else { myTurn.value = false; playBotMove() }
    }
  }

  const playBotMove = async () => {
    if (isResolving.value || botHand.value.length === 0) return
    if (cardsOnTable.value.length === 0) {
      leaderThisTrick.value = false
      myTurn.value = false
    }

    await new Promise(r => setTimeout(r, 1000))
    let cardIndex = -1
    const tSuit = trump.value.suit

    if (cardsOnTable.value.length === 1) {
      const lead = cardsOnTable.value[0]
      if (isDeckEmpty.value) {
        cardIndex = botHand.value.findIndex(c => c.suit === lead.suit)
        if (cardIndex === -1) cardIndex = botHand.value.findIndex(c => c.suit === tSuit)
      }
      if (cardIndex === -1) {
        cardIndex = botHand.value.findIndex(c => c.suit === lead.suit && cardPower[c.value] > cardPower[lead.value])
        if (cardIndex === -1 && lead.suit !== tSuit && pointsMap[lead.value] > 0) {
          cardIndex = botHand.value.findIndex(c => c.suit === tSuit)
        }
      }
    }
    
    if (cardIndex === -1) cardIndex = 0

    const played = botHand.value.splice(cardIndex, 1)[0]
    cardsOnTable.value.push(played)

    if (cardsOnTable.value.length === 2) resolveTrick()
    else myTurn.value = true
  }

  const resolveTrick = async () => {
    isResolving.value = true
    await new Promise(r => setTimeout(r, 1000))

    const c1 = cardsOnTable.value[0]
    const c2 = cardsOnTable.value[1]
    const tSuit = trump.value.suit

    let firstWins = true
    if (c1.suit === c2.suit) {
      if (cardPower[c2.value] > cardPower[c1.value]) firstWins = false
    } else if (c2.suit === tSuit) {
      firstWins = false
    } else {
      firstWins = true
    }

    let playerWonTrick = leaderThisTrick.value ? firstWins : !firstWins
    const pts = (pointsMap[c1.value] || 0) + (pointsMap[c2.value] || 0)
    
    lastWinner.value = playerWonTrick ? 1 : 2
    await new Promise(r => setTimeout(r, 600)) // Tempo da animação

    if (playerWonTrick) { player1.value.points += pts; myTurn.value = true }
    else { player2.value.points += pts; myTurn.value = false }

    cardsOnTable.value = []
    lastWinner.value = null
    if (!isDeckEmpty.value) drawCards(playerWonTrick)

    isResolving.value = false
    if (myHand.value.length === 0) resolveGameEnd()
    else if (!myTurn.value) playBotMove()
  }

  const drawCards = (playerWon) => {
    if (playerWon) {
      myHand.value.push({ ...deck.value.pop(), flipped: true })
      if (deck.value.length > 0) botHand.value.push({ ...deck.value.pop(), flipped: false })
    } else {
      botHand.value.push({ ...deck.value.pop(), flipped: false })
      if (deck.value.length > 0) myHand.value.push({ ...deck.value.pop(), flipped: true })
    }
  }

  const resolveGameEnd = () => {
    // Cálculo de marcas ganhas nesta mão
    let marksWon = 0
    if (player1.value.points > 60) {
      marksWon = player1.value.points === 120 ? 3 : (player1.value.points >= 91 ? 2 : 1)
      player1.value.marks += marksWon
    } else if (player2.value.points > 60) {
      marksWon = player2.value.points === 120 ? 3 : (player2.value.points >= 91 ? 2 : 1)
      player2.value.marks += marksWon
    }

    // Decisão: O jogo acaba aqui ou continua?
    if (gameMode.value === 'game') {
      // Jogo Único: Acaba mal a primeira mão termine
      isGameComplete.value = true
      // saveGame()
    } else {
      // Modo Match: Só acaba quando alguém chega às 4 marcas
      if (isMatchOver.value) {
        isGameComplete.value = true
        // saveGame()
      } else {
        toast.info("Preparing next hand...")
        setTimeout(() => prepareNewGame(gameType.value, 'match'), 3000)
      }
    }
  }

  const isCardPlayable = (card) => {
  if (!myTurn.value || isResolving.value) return false;
  
  // Regra da Fase Final (Deck Vazio)
  if (isDeckEmpty.value && cardsOnTable.value.length === 1) {
    const leadCard = cardsOnTable.value[0];
    const myHandCards = myHand.value;

    // Se tens o naipe, és obrigado a jogar o naipe (assistir)
    if (canFollowSuit(myHandCards, leadCard.suit)) {
      return card.suit === leadCard.suit;
    }
    
    // Se NÃO tens o naipe, podes jogar qualquer carta (incluindo trunfo ou balda)
    return true; 
  }
  
  return true; 
};

  return {
    gameType, myHand, botHand: botHand, cardsOnTable, trump, player1, player2, 
    myTurn, isResolving, isDeckEmpty, deckCount, opponentCardCount, gameMode,
    isGameComplete, isMatchOver, lastWinner, prepareNewGame, playCard, isCardPlayable
  }
})