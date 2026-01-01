<script setup>
import { computed } from 'vue'

const props = defineProps({
    player1: { type: Object, required: true },
    player2: { type: Object, required: true },
    is9Cards: { type: Boolean, default: false },
    // Adicionamos esta prop para controlar a visibilidade das marcas
    gameMode: { type: String, default: 'game' } 
})

const p1Percentage = computed(() => (props.player1.points / 120) * 100)
const p2Percentage = computed(() => (props.player2.points / 120) * 100)
</script>

<template>
    <div class="bg-slate-900 border-2 border-slate-700 p-6 rounded-3xl shadow-2xl text-white w-full max-w-xs">
        <div class="text-center mb-6">
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-500">Bisca Score</h2>
            <div class="flex flex-col gap-1 mt-2">
                <div class="text-[10px] bg-slate-800 py-1 px-3 rounded-full inline-block">
                    {{ is9Cards ? 'Variant: 9 Cards' : 'Variant: 3 Cards' }}
                </div>
                <div class="text-[10px] bg-blue-900/30 text-blue-400 py-1 px-3 rounded-full inline-block border border-blue-800/50">
                    {{ gameMode === 'match' ? 'Mode: Match (First to 4)' : 'Mode: Single Game' }}
                </div>
            </div>
        </div>

        <div class="space-y-8">
            <div class="relative">
                <div class="flex justify-between items-end mb-2">
                    <div>
                        <p class="text-xs text-blue-400 font-bold uppercase">You</p>
                        <p class="text-lg font-bold truncate">{{ player1.name || 'Player' }}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-3xl font-black">{{ player1.points }}</span>
                        <span class="text-[10px] block text-slate-500 uppercase tracking-tighter">Points</span>
                    </div>
                </div>
                
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-500 h-full transition-all duration-500" :style="{ width: p1Percentage + '%' }"></div>
                </div>

                <div v-if="gameMode === 'match'" class="flex gap-2 mt-3 items-center">
                    <div v-for="n in 4" :key="n" 
                         class="w-4 h-4 rounded-sm border-2 rotate-45 transition-all"
                         :class="n <= player1.marks ? 'bg-orange-500 border-orange-300 shadow-[0_0_10px_orange]' : 'border-slate-700'">
                    </div>
                    <span class="text-[10px] ml-2 text-slate-500 uppercase font-black">Marks</span>
                </div>
            </div>

            <div class="border-t border-slate-800 border-dashed"></div>

            <div class="relative">
                <div class="flex justify-between items-end mb-2">
                    <div>
                        <p class="text-xs text-red-400 font-bold uppercase">Opponent</p>
                        <p class="text-lg font-bold truncate">{{ player2.name || 'BOT' }}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-3xl font-black text-slate-300">{{ player2.points }}</span>
                        <span class="text-[10px] block text-slate-500 uppercase tracking-tighter">Points</span>
                    </div>
                </div>

                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-slate-600 h-full transition-all duration-500" :style="{ width: p2Percentage + '%' }"></div>
                </div>

                <div v-if="gameMode === 'match'" class="flex gap-2 mt-3 items-center">
                    <div v-for="n in 4" :key="n" 
                         class="w-4 h-4 rounded-sm border-2 rotate-45"
                         :class="n <= player2.marks ? 'bg-slate-400 border-slate-200 shadow-lg' : 'border-slate-700'">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>