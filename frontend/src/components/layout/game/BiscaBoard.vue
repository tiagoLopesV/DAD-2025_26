<script setup>
import BiscaCard from './BiscaCard.vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

const props = defineProps({
    cards: { type: Array, required: true },
    tableCards: { type: Array, required: true },
    trumpCard: { type: Object, required: true },
    opponentCardCount: { type: Number, required: true },
    myTurn: { type: Boolean, default: false }
})

const emits = defineEmits(['playCard'])

const handleCardClick = (card) => {
    // Agora verifica também se a carta é válida antes de emitir o evento
    if (props.myTurn && !gameStore.isResolving && gameStore.isCardPlayable(card)) {
        emits('playCard', card)
    }
}
</script>

<template>
    <div class="relative w-full max-w-6xl h-[90vh] m-auto bg-emerald-800 rounded-[3rem] p-4 md:p-8 shadow-2xl border-[12px] border-emerald-950 flex flex-col justify-between overflow-x-hidden overflow-y-hidden">
        
        <div class="flex justify-center -space-x-8 md:-space-x-12 pt-4">
            <BiscaCard 
                v-for="n in opponentCardCount" 
                :key="'opp' + n"
                :card="{ flipped: false }" 
                class="w-16 md:w-24 rotate-180 opacity-80 shadow-md"
            />
        </div>

        <div class="flex items-center justify-center space-x-4 md:space-x-16 my-4">
            <div class="flex items-center justify-center min-w-[150px] md:min-w-[220px]">
                <template v-if="!gameStore.isDeckEmpty">
                    <div class="flex items-center">
                        <div class="transform rotate-90 -mr-10 md:-mr-14 drop-shadow-xl">
                            <BiscaCard 
                                :card="{ ...trumpCard, flipped: true }" 
                                class="w-20 md:w-28 brightness-110"
                            />
                        </div>
                        <div class="relative z-10 drop-shadow-2xl">
                            <BiscaCard :card="{ flipped: false }" class="w-20 md:w-28" />
                            <div class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] md:text-xs font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full border-2 border-white shadow-xl z-20">
                                {{ gameStore.deckCount }}
                            </div>
                        </div>
                    </div>
                </template>
                <div v-else class="w-20 h-28 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/10 text-[10px] italic text-center">
                    Empty
                </div>
            </div>

            <div class="flex items-center justify-center space-x-2 md:space-x-4 p-4 md:p-8 border-2 border-dashed border-white/10 rounded-full min-w-[200px] md:min-w-[450px] h-40 md:h-56 bg-black/10 relative shadow-inner">
                <BiscaCard 
                    v-for="playedCard in tableCards" 
                    :key="playedCard.id"
                    :card="{ ...playedCard, flipped: true }"
                    class="w-20 md:w-28 transition-all duration-700 ease-in-out transform"
                    :class="{
                        'translate-y-[-100vh] opacity-0 rotate-[120deg] scale-50': gameStore.lastWinner === 2,
                        'translate-y-[100vh] opacity-0 rotate-[-120deg] scale-50': gameStore.lastWinner === 1
                    }"
                />
            </div>
        </div>

        <div class="flex flex-col items-center w-full pb-4">
            <div v-if="myTurn && !gameStore.isResolving" class="mb-2 bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] md:text-xs font-black animate-pulse uppercase tracking-widest z-50">
                Your Turn
            </div>
            
            <div 
                class="flex justify-center w-full max-w-full px-2 transition-all duration-500"
                :class="[cards.length > 3 ? '-space-x-10 md:-space-x-14' : 'space-x-2 md:space-x-4']"
            >
                <BiscaCard
                    @clicked="handleCardClick"
                    v-for="item in cards"
                    :card="{ ...item, flipped: true }"
                    :key="item.id"
                    class="transition-all duration-300 origin-bottom shadow-lg"
                    :class="[
                        cards.length > 3 ? 'w-16 md:w-28' : 'w-24 md:w-32',
                        // Lógica de desativação dinâmica
                        gameStore.isCardPlayable(item) 
                            ? 'cursor-pointer hover:-translate-y-12 hover:z-50 hover:scale-125 brightness-100' 
                            : 'grayscale opacity-40 cursor-not-allowed scale-90 translate-y-2'
                    ]"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
div { background-image: radial-gradient(circle, #065f46 0%, #064e3b 100%); }

.flex-col {
    justify-content: space-between;
}
</style>