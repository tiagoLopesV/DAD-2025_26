<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router' // Importante para ler a variant
import { useGameStore } from '@/stores/game'
import { toast } from 'vue-sonner'
import BiscaBoard from '@/components/layout/game/BiscaBoard.vue'
import ScoreBoard from '@/components/layout/game/ScoreBoard.vue'

const gameStore = useGameStore()
const route = useRoute() // Aceder à rota atual

const handlePlayCard = (card) => {
  if (!gameStore.myTurn) {
    toast.error("Wait for the opponent's move!")
    return
  }
  gameStore.playCard(card)
}

// Monitoriza o fim da partida (quando alguém atinge 4 marcas)
watch(
  () => gameStore.isGameComplete,
  (isComplete) => {
    if (isComplete) {
      const victory = gameStore.player1.marks >= 4
      if (victory) {
        toast.success(`Victory! You won the Bisca game!`)
      } else {
        toast.error(`Defeat. The computer won the game.`)
      }
      gameStore.saveGame() 
    }
  }
)

// Feedback de vitória na mão (60+ pontos)
watch(
  () => gameStore.player1.points,
  (newPoints) => {
    if (newPoints > 60) toast.info("You won this hand!")
  }
)

onMounted(() => {
  // Captura a variante da URL (?variant=9 ou ?variant=3)
  // Se não existir, o padrão é '3'
  const variant = route.query.variant || '3'
  gameStore.prepareNewGame(variant) 
})
</script>

<template>
  <div class="container mx-auto p-4 flex flex-col lg:flex-row gap-8 items-start justify-center">
    
    <aside class="w-full lg:w-72">
      <ScoreBoard 
        :player1="gameStore.player1" 
        :player2="gameStore.player2"
        :is9Cards="gameStore.gameType === '9'"
      />
      
      <div class="mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center">
        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">State of the Game</p>
        <p class="text-white font-bold mt-1">
          {{ gameStore.myTurn ? 'Your turn' : 'AI is thinking...' }}
        </p>
        <p class="text-xs text-blue-400 mt-2 font-medium">
          Bisca de {{ gameStore.gameType }} cartas
        </p>
      </div>

      <button 
        @click="$router.push('/')" 
        class="mt-4 w-full py-2 text-xs text-slate-400 hover:text-white transition-colors uppercase font-bold tracking-tighter"
      >
        ← Sair do Jogo
      </button>
    </aside>

    <main class="flex-1 w-full">
      <BiscaBoard 
        :cards="gameStore.myHand"
        :table-cards="gameStore.cardsOnTable"
        :trump-card="gameStore.trump"
        :opponent-card-count="gameStore.opponentCardCount"
        :my-turn="gameStore.myTurn"
        @playCard="handlePlayCard"
      />
    </main>

  </div>
</template>

<style scoped>
.container {
  min-height: calc(100vh - 100px);
}
</style>