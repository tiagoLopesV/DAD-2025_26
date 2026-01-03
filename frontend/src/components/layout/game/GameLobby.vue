<script setup>
defineProps({
    games: Array, // Lista de jogos pendentes vinda do WebSocket
    connectedUsers: Array
})
const emits = defineEmits(['join', 'create'])
</script>

<template>
  <div class="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-white">Bisca Lobby</h2>
      <button @click="emits('create')" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition">
        Create New Game
      </button>
    </div>

    <div class="grid gap-4">
      <div v-for="game in games" :key="game.id" class="flex justify-between items-center p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div>
          <p class="text-white font-bold">Game by {{ game.player1_name }}</p>
          <p class="text-xs text-slate-400">{{ game.type }} Cards</p>
        </div>
        <button @click="emits('join', game.id)" class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
          Join
        </button>
      </div>
      <p v-if="games.length === 0" class="text-slate-500 text-center py-4">There are no games available at the moment...</p>
    </div>
  </div>
</template>