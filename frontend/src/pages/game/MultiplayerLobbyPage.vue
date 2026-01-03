<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { useGameStore } from '@/stores/game'
import { useCoinStore } from '@/stores/coin' // Store de moedas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const socketStore = useSocketStore()
const gameStore = useGameStore()
const coinStore = useCoinStore()

// --- ESTADO LOCAL ---
const selectedVariant = ref('3')
const selectedType = ref('standalone') // 'standalone' ou 'match'
const matchStake = ref(3) // Stake mínima para Match
const errorMessage = ref('')
const isLoading = ref(false)

// --- COMPUTED ---
const user = computed(() => authStore.currentUser)
// Saldo agora vem da coinStore para ser assíncrono e reativo a WebSockets
const userCoins = computed(() => coinStore.balance)

// --- FILTROS ---
const availableGames = computed(() => {
    return (gameStore.lobbyGames || []).filter(g => !g.started && g.player1?.id !== user.value?.id)
})

const myWaitingGames = computed(() => {
    return (gameStore.lobbyGames || []).filter(g => g.player1?.id === user.value?.id && !g.complete)
})

// --- CÁLCULO DE CUSTO ---
const currentCost = computed(() => {
    return selectedType.value === 'standalone' ? 2 : matchStake.value
})

// --- AÇÕES ---

const createNewGame = async () => {
    errorMessage.value = ""
    
    // Validar saldo atualizado na API antes de proceder
    await coinStore.fetchBalance()

    if (userCoins.value < currentCost.value) {
        errorMessage.value = `Insufficient balance. You need ${currentCost.value} coins.`
        return
    }

    // Join no socket room do utilizador se necessário
    socketStore.socket.emit('join', authStore.currentUser)
    
    // Emitir criação
    socketStore.emitCreateGame(selectedType.value, selectedVariant.value, currentCost.value)
    
    // Feedback: atualizar saldo logo após a criação (o backend irá descontar)
    setTimeout(() => coinStore.fetchBalance(), 500)
}

const joinGame = async (game) => {
    errorMessage.value = ""
    
    // Validar saldo atualizado
    await coinStore.fetchBalance()
    
    const requiredStake = game.stake

    if (userCoins.value >= requiredStake) {
        socketStore.emitJoinGame(game.id)
        // Atualizar saldo após entrar
        setTimeout(() => coinStore.fetchBalance(), 500)
    } else {
        errorMessage.value = `Saldo insuficiente. Esta mesa exige ${requiredStake} moedas.`
    }
}

const startGame = (game) => {
    router.push({ name: 'multiplayer', params: { id: game.id } })
}

const cancelGame = async (game) => {
    socketStore.emitCancelGame(game.id)
    // Ao cancelar, o Laravel devolve as moedas, por isso atualizamos o saldo
    setTimeout(() => coinStore.fetchBalance(), 500)
}

onMounted(async () => {
    socketStore.handleConnection()
    socketStore.handleGameEvents()
    
    // Inicialização assíncrona do Lobby
    if (user.value) {
        await coinStore.fetchBalance()
        // Conectar ao socket privado de moedas para atualizações em tempo real
        coinStore.connectWebSocket(user.value.id)
    }
    socketStore.emitGetGames()
})

onUnmounted(() => {
    // Limpeza opcional se necessário
})
</script>

<template>
    <div class="container mx-auto p-4 max-w-4xl">
        <div class="space-y-6">
            <div class="flex justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
                <div>
                    <h1 class="text-3xl font-black text-white italic tracking-tighter uppercase">Bisca Arena</h1>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Multiplayer Lobby</p>
                </div>
                <div class="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span class="text-slate-400 text-sm font-bold uppercase">Saldo:</span>
                    <Badge
                        class="bg-yellow-500 text-black font-black px-4 py-1 text-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                        :class="{ 'animate-pulse': isLoading }">
                        {{ userCoins }} 🪙
                    </Badge>
                </div>
            </div>

            <div v-if="errorMessage"
                class="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg text-sm font-bold">
                ⚠️ {{ errorMessage }}
            </div>

            <Card class="bg-slate-900 border-slate-800 text-white shadow-lg">
                <CardHeader>
                    <CardTitle class="text-lg font-bold uppercase text-blue-400">✚ Create New Table</CardTitle>
                </CardHeader>
                <CardContent class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] font-black mb-2 block text-slate-500 uppercase tracking-widest">Mode</label>
                                <div class="flex gap-2">
                                    <Button @click="selectedType = 'standalone'"
                                        class="flex-1 font-bold transition-all border border-transparent" :class="[
                                            selectedType === 'standalone'
                                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-600 cursor-default'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                        ]">
                                        SINGLE GAME
                                    </Button>

                                    <Button @click="selectedType = 'match'"
                                        class="flex-1 font-bold transition-all border border-transparent" :class="[
                                            selectedType === 'match'
                                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-600 cursor-default'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                        ]">
                                        MATCH (4 marks)
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-black mb-2 block text-slate-500 uppercase tracking-widest">Cards</label>
                                <div class="flex gap-2">
                                    <Button v-for="v in ['3', '9']" :key="v" @click="selectedVariant = v"
                                        class="flex-1 font-black text-2xl py-8 transition-all border border-transparent"
                                        :class="[
                                            selectedVariant === v
                                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-600 cursor-default'
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                        ]">
                                        <div class="flex flex-col items-center">
                                            <span>{{ v }}</span>
                                            <span class="text-[10px] font-bold uppercase opacity-60">Cards</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <label class="text-[10px] font-black mb-3 block text-slate-400 uppercase tracking-widest">Player Stake</label>

                            <div v-if="selectedType === 'standalone'" class="py-4 text-center">
                                <span class="text-4xl font-black text-yellow-500">2 🪙</span>
                                <p class="text-[10px] text-slate-500 mt-2 italic">Fixed cost for single game</p>
                            </div>

                            <div v-else class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjust Stake</label>
                                    <Badge class="bg-blue-500/20 text-blue-400 border-blue-500/50">Min 3 - Max 100</Badge>
                                </div>
                                <div class="flex items-center gap-4">
                                    <Button variant="outline" size="icon" @click="matchStake = Math.max(3, matchStake - 1)"
                                        class="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-white"> - </Button>
                                    <input type="range" v-model.number="matchStake" min="3" max="100"
                                        class="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500">
                                    <Button variant="outline" size="icon" @click="matchStake = Math.min(100, matchStake + 1)"
                                        class="h-8 w-8 rounded-full border-slate-700 bg-slate-800 text-white"> + </Button>
                                </div>
                                <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                                    <div class="flex flex-col">
                                        <span class="text-[10px] text-slate-500 font-bold uppercase">Total Stake</span>
                                        <span class="text-2xl font-black text-blue-500">{{ matchStake }} 🪙</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-[10px] text-slate-500 font-bold uppercase">Estimated Prize</span>
                                        <span class="text-xl font-black text-green-500 block">{{ (matchStake * 2) - 1 }} 🪙</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button @click="createNewGame"
                        class="w-full bg-green-600 hover:bg-green-500 h-16 text-xl font-black uppercase shadow-lg shadow-green-900/20"
                        :disabled="userCoins < currentCost">
                        {{ userCoins >= currentCost ? `Create Table (${currentCost} 🪙)` : 'Insufficient Balance' }}
                    </Button>
                </CardContent>
            </Card>

            <Card v-if="myWaitingGames.length > 0" class="border-2 border-blue-500 bg-slate-900 text-white shadow-lg">
                <CardHeader class="pb-2">
                    <CardTitle class="text-sm font-black uppercase flex items-center gap-2">
                        <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        A Tua Mesa está Ativa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div v-for="game in myWaitingGames" :key="game.id"
                        class="bg-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <Badge class="bg-blue-600 mb-1 uppercase text-[10px]">{{ game.type }}</Badge>
                            <div class="text-sm font-bold">{{ game.variant }} Cards | Stake: {{ game.stake }} 🪙</div>
                            <div v-if="game.player2" class="text-green-400 text-xs font-black animate-pulse uppercase">
                                Opponent Ready!</div>
                        </div>
                        <div class="flex gap-2">
                            <Button v-if="game.player2" @click="startGame(game)"
                                class="bg-green-600 hover:bg-green-500 font-black px-6">START</Button>
                            <Button @click="cancelGame(game)" variant="destructive" size="sm">CLOSE</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card class="bg-slate-900 border-slate-800 text-white shadow-lg">
                <CardHeader>
                    <CardTitle class="text-lg flex justify-between items-center font-bold">
                        <span>Tables of Other Players</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div v-if="availableGames.length === 0"
                        class="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl uppercase font-black text-xs">
                        No tables open right now.
                    </div>
                    <div v-else class="grid gap-3">
                        <div v-for="game in availableGames" :key="game.id"
                            class="flex items-center justify-between p-4 border border-slate-800 rounded-xl bg-slate-950/50">
                            <div>
                                <span class="font-black text-slate-200 block">{{ game.player1.name }}</span>
                                <div class="flex gap-2 mt-1">
                                    <Badge variant="outline" class="text-[10px] text-white">{{ game.type }}</Badge>
                                    <Badge variant="outline" class="text-[10px] text-blue-400 border-blue-400/30">{{
                                        game.variant }} Cards</Badge>
                                </div>
                            </div>
                            <div class="text-right flex flex-col gap-2">
                                <span class="text-xs font-bold text-yellow-500 uppercase">Stake: {{ game.stake }} 🪙</span>
                                <Button @click="joinGame(game)" class="bg-blue-600 hover:bg-blue-500 font-black"
                                    :disabled="userCoins < game.stake">
                                    JOIN
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>

<style scoped>
/* Estilização para o slider de range para parecer mais gaming */
input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #3b82f6;
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid white;
}
</style>