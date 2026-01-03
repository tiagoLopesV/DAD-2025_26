<script setup>
defineProps(['winnerName', 'isVictory'])
</script>

<template>
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border-2 border-yellow-500 p-8 rounded-3xl text-center max-w-sm shadow-[0_0_50px_rgba(234,179,8,0.3)]">
      <h2 class="text-4xl font-black mb-2" :class="isVictory ? 'text-yellow-500' : 'text-slate-400'">
        {{ isVictory ? 'VICTORY!' : 'DEFEAT...' }}
      </h2>
      <p class="text-white text-lg mb-6">
        {{ isVictory ? 'Congratulations! You won the match.' : `Player ${winnerName} won the game.` }}
      </p>
      <button @click="$router.push('/')" class="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition">
        Back to Home
      </button>
    </div>
  </div>
</template>