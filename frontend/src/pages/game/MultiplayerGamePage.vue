<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from "@/stores/socket"
import { useAuthStore } from "@/stores/auth"
import { useRouter } from 'vue-router'

// UI Components
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BiscaCard from '@/components/layout/game/BiscaCard.vue'

const gameStore = useGameStore()
const socketStore = useSocketStore()
const authStore = useAuthStore()
const router = useRouter()

const timeLeft = ref(20)
let timerInterval = null

// --- ESTADO DE ANIMAÇÃO LOCAL ---
const lastWinnerId = ref(null)
const isCollecting = ref(false)
const cardsToAnimate = ref([])

const timeOutOccurred = ref(false)

// --- ESTADO COMPUTADO ---
const game = computed(() => gameStore.activeMultiplayerGame)

const isPlayer1 = computed(() => game.value?.player1.id === authStore.currentUser?.id)
const myData = computed(() => isPlayer1.value ? game.value?.player1 : game.value?.player2)
const opponentData = computed(() => isPlayer1.value ? game.value?.player2 : game.value?.player1)

const myHand = computed(() => myData.value?.hand || [])
const cardsOnTable = computed(() => game.value?.board || [])
const deckCount = computed(() => game.value?.deck?.length || 0)
const isMatchMode = computed(() => game.value?.type === 'match')

const isReallyOver = computed(() => {
    // 1. O jogo não existe?
    if (!game.value) return false
    
    // 2. O servidor disse que acabou? (Status final ou flag complete)
    if (game.value.complete || game.value.status === 'finished') return true
    
    // 3. Eu perdi por tempo localmente?
    if (timeOutOccurred.value) return true
    
    // 4. Modo Match: Alguém chegou às marcas?
    if (isMatchMode.value) {
        if (myData.value?.marks >= 4 || opponentData.value?.marks >= 4) return true
    }
    
    return false
})

const trumpCard = computed(() => {
    if (!game.value?.trump) return null
    return { ...game.value.trump, flipped: true }
})

const myTurn = computed(() => game.value?.currentPlayer === authStore.currentUser?.id)

// --- LÓGICA DE VALIDAÇÃO DE CARTA (FRONTEND) ---
const isCardPlayable = (card) => {
    // 1. Bloqueios base
    if (!myTurn.value || isReallyOver.value || isCollecting.value) return false

    // 2. Regra de Assistir (Baralho vazio e já existe 1 carta na mesa)
    if (deckCount.value === 0 && cardsOnTable.value.length === 1) {
        const leadCard = cardsOnTable.value[0].card
        const hasMatchingSuit = myHand.value.some(c => c.suit === leadCard.suit)

        // Se eu tiver o naipe, só posso jogar cartas desse naipe
        if (hasMatchingSuit) {
            return card.suit === leadCard.suit
        }
    }

    return true
}

const startTimer = () => {
    if (isReallyOver.value) return

    clearInterval(timerInterval)
    timeLeft.value = 20
    
    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--
        } else {
            // CHEGOU A 0: Para tudo!
            clearInterval(timerInterval)
            if (myTurn.value) {
                timeOutOccurred.value = true
                // Opcional: emitir um evento de forfeit para o servidor acelerar o processo
                socketStore.socket.emit('player-timeout', game.value.id)
            }
        }
    }, 1000)
}

// --- WATCHERS ---
watch(() => [game.value?.currentPlayer, game.value?.board?.length, game.value?.complete], () => {
    // Se o jogo marcou como completo ou alguém perdeu por tempo, limpamos o timer
    if (game.value?.complete || timeOutOccurred.value) {
        clearInterval(timerInterval)
        return
    }
    
    // Só reinicia se o jogo ainda estiver ativo
    if (game.value && !isReallyOver.value) {
        startTimer()
    }
}, { immediate: true })

// Limpar o timer se o jogo acabar
watch(isReallyOver, (over) => {
    if (over) clearInterval(timerInterval)
})

watch(() => game.value?.board, (newBoard, oldBoard) => {
    if (oldBoard?.length === 2 && newBoard?.length === 0) {
        lastWinnerId.value = game.value.currentPlayer
        cardsToAnimate.value = [...oldBoard]
        isCollecting.value = true

        setTimeout(() => {
            isCollecting.value = false
            lastWinnerId.value = null
            cardsToAnimate.value = []
        }, 1200)
    }
}, { deep: true })

// --- AÇÕES ---
const handlePlayCard = (card) => {
    if (!isCardPlayable(card)) return
    socketStore.socket.emit('play-card', game.value.id, card.id)
}

onMounted(() => {
    socketStore.handleGameEvents()
    startTimer()
})
</script>

<template>
    <div v-if="game"
        class="min-h-screen bg-emerald-950 p-4 flex flex-col items-center justify-between text-white overflow-hidden relative">

        <div
            class="w-full max-w-5xl flex justify-between items-center bg-black/40 p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl z-20">
            <div class="flex items-center gap-4">
                <div class="text-left">
                    <p class="text-[10px] uppercase font-black text-emerald-500">Opponent</p>
                    <p class="font-black text-lg leading-tight">{{ opponentData?.name }}</p>
                    <div v-if="isMatchMode" class="flex gap-1.5 mt-1">
                        <div v-for="i in 4" :key="i" class="w-3.5 h-3.5 rounded-sm border border-white/10"
                            :class="i <= (opponentData?.marks || 0) ? 'bg-orange-500 shadow-[0_0_12px_orange]' : 'bg-slate-900'">
                        </div>
                    </div>
                </div>
                <Badge variant="outline" class="border-emerald-500/50 text-white font-black">{{ opponentData?.points ||
                    0 }} PTS</Badge>
            </div>

            <div class="text-center min-w-[120px] relative">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                    {{ isMatchMode ? 'Match Mode' : 'Single Game' }}
                </p>

                <div class="relative flex flex-col items-center">
                    <Badge :class="[
                        myTurn ? 'bg-yellow-500 text-black animate-pulse' : 'bg-slate-800 text-slate-400',
                        'px-6 py-1 transition-all duration-300'
                    ]">
                        {{ myTurn ? 'YOUR TURN' : "WAITING" }}
                    </Badge>

                    <div class="mt-2 flex items-center justify-center gap-2">
                        <span :class="[
                            'text-2xl font-black tabular-nums tracking-tighter',
                            timeLeft <= 5 ? 'text-red-500 animate-bounce' : 'text-white'
                        ]">
                            00:{{ timeLeft < 10 ? '0' + timeLeft : timeLeft }} </span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <Badge variant="outline" class="border-blue-500/50 text-white font-black">{{ myData?.points || 0 }} PTS
                </Badge>
                <div class="text-right">
                    <p class="text-[10px] uppercase font-black text-blue-500">You</p>
                    <p class="font-black text-lg leading-tight">{{ authStore.currentUser?.name }}</p>
                    <div v-if="isMatchMode" class="flex gap-1.5 mt-1 justify-end">
                        <div v-for="i in 4" :key="i" class="w-3.5 h-3.5 rounded-sm border border-white/10"
                            :class="i <= (myData?.marks || 0) ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 'bg-slate-900'">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="relative w-full max-w-4xl h-[450px] flex items-center justify-center border-[12px] border-emerald-900/40 rounded-[150px] bg-gradient-to-b from-emerald-800/10 to-transparent my-4 shadow-inner">

            <div class="absolute left-10 flex flex-col items-center gap-6">
                <div v-if="trumpCard && deckCount > 0">
                    <p class="text-[9px] font-black text-center uppercase mb-2 text-emerald-500">Trump</p>
                    <BiscaCard :card="trumpCard" disabled class="scale-75 shadow-2xl opacity-100" />
                </div>

                <div v-if="deckCount > 0" class="relative">
                    <BiscaCard :card="{ flipped: false }" disabled class="scale-75 opacity-90" />
                    <Badge class="absolute -top-2 -right-2 bg-blue-600 border-2 border-white/20">{{ deckCount }}</Badge>
                </div>
            </div>

            <div class="flex gap-10 items-center justify-center relative">
                <div v-for="(move, index) in (isCollecting ? cardsToAnimate : cardsOnTable)" :key="index"
                    class="relative flex flex-col items-center trick-transition" :class="[
                        isCollecting && lastWinnerId === authStore.currentUser?.id ? 'trick-to-me' : '',
                        isCollecting && lastWinnerId !== authStore.currentUser?.id ? 'trick-to-opponent' : ''
                    ]">

                    <BiscaCard :card="move.card" disabled class="shadow-2xl opacity-100" />

                    <div v-if="!isCollecting"
                        class="absolute -top-10 bg-black/60 px-4 py-1 rounded-full text-[9px] font-black uppercase border border-white/10">
                        {{ move.playerId === authStore.currentUser?.id ? 'You' : "Opponent" }}
                    </div>
                </div>

                <Transition name="scale-fade">
                    <div v-if="isCollecting"
                        class="absolute z-30 font-black text-3xl italic text-yellow-400 drop-shadow-2xl uppercase">
                        {{ lastWinnerId === authStore.currentUser?.id ? 'Trick Won!' : 'Opponent Takes' }}
                    </div>
                </Transition>
            </div>
        </div>

        <div class="w-full max-w-4xl flex flex-col items-center gap-6 pb-6 z-20">
            <div class="flex justify-center gap-4">
                <div v-for="(card) in myHand" :key="card.id" class="transition-all duration-500"
                    :style="{ transform: `translateY(${myTurn && isCardPlayable(card) ? '-20px' : '0px'})` }">
                    <BiscaCard :card="card" :disabled="!isCardPlayable(card)" @clicked="handlePlayCard"
                        class="transition-all duration-300" :class="[
                            !isCardPlayable(card)
                                ? 'opacity-40 grayscale scale-95 cursor-not-allowed blur-[0.5px]'
                                : 'cursor-pointer hover:translate-y-[-30px] shadow-xl'
                        ]" />
                </div>
            </div>
        </div>

        <div v-if="isReallyOver"
            class="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-6">
            <Card class="bg-slate-900 border-2 border-white/10 text-white p-12 text-center max-w-md w-full">
                <div class="mb-8">
                    <div class="text-8xl mb-6">{{ game.winner === authStore.currentUser?.id ? '🏆' : '💀' }}</div>
                    <h2 class="text-5xl font-black italic uppercase tracking-tighter mb-2">
                        <span v-if="timeOutOccurred || game.reason === 'timeout'" class="text-red-500">
                            TIME OUT
                        </span>
                        <span v-else>
                            {{ game.winner === authStore.currentUser?.id ? 'VICTORY!' : 'DEFEAT' }}
                        </span>
                    </h2>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-10 bg-black/40 p-6 rounded-2xl border border-white/5">
                    <div>
                        <p class="text-blue-500 text-xs font-black uppercase">Marks</p>
                        <p class="text-4xl font-black">{{ myData?.marks || 0 }}</p>
                    </div>
                    <div>
                        <p class="text-orange-500 text-xs font-black uppercase">Marks</p>
                        <p class="text-4xl font-black">{{ opponentData?.marks || 0 }}</p>
                    </div>
                </div>

                <Button @click="router.push({ name: 'multiplayerlobby' })"
                    class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-8 text-xl rounded-2xl transition-all">
                    BACK TO LOBBY
                </Button>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.bg-emerald-950 {
    background: radial-gradient(circle at center, #065f46 0%, #022c22 100%);
}

.trick-transition {
    transition: all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.trick-to-me {
    transform: translateY(600px) scale(0) !important;
    opacity: 0;
}

.trick-to-opponent {
    transform: translateY(-600px) scale(0) !important;
    opacity: 0;
}

.scale-fade-enter-active {
    animation: scale-up 0.8s ease-out;
}

@keyframes scale-up {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.shadow-inner {
    box-shadow: inset 0 0 150px rgba(0, 0, 0, 0.6);
}
</style>