<template>
  <div class="container mx-auto p-4 space-y-8">
    <h1 class="text-3xl font-bold mb-6">Leaderboards</h1>

    <div v-if="loading" class="text-center">Loading...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <!-- Most Games Won -->
      <div class="bg-card p-6 rounded-lg shadow border">
        <h2 class="text-xl font-semibold mb-4">Top Game Winners</h2>
        <table class="w-full">
          <thead>
            <tr class="text-left border-b">
              <th class="p-2">Rank</th>
              <th class="p-2">Player</th>
              <th class="p-2 text-right">Wins</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in mostGamesWon" :key="player.id" class="border-b last:border-0">
              <td class="p-2">{{ index + 1 }}</td>
              <td class="p-2 flex items-center gap-2">
                <img :src="getAvatar(player.photo_avatar_filename)" class="w-8 h-8 rounded-full bg-gray-200" />
                <span class="font-medium">{{ player.nickname }}</span>
              </td>
              <td class="p-2 text-right">{{ player.wins }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Most Matches Won -->
      <div class="bg-card p-6 rounded-lg shadow border">
        <h2 class="text-xl font-semibold mb-4">Top Match Winners</h2>
        <table class="w-full">
          <thead>
            <tr class="text-left border-b">
              <th class="p-2">Rank</th>
              <th class="p-2">Player</th>
              <th class="p-2 text-right">Wins</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in mostMatchesWon" :key="player.id" class="border-b last:border-0">
              <td class="p-2">{{ index + 1 }}</td>
              <td class="p-2 flex items-center gap-2">
                <img :src="getAvatar(player.photo_avatar_filename)" class="w-8 h-8 rounded-full bg-gray-200" />
                <span class="font-medium">{{ player.nickname }}</span>
              </td>
              <td class="p-2 text-right">{{ player.wins }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'

const api = useAPIStore()
const loading = ref(true)
const mostGamesWon = ref([])
const mostMatchesWon = ref([])

onMounted(async () => {
    try {
        const response = await api.getGlobalLeaderboard()
        mostGamesWon.value = response.data.most_games_won
        mostMatchesWon.value = response.data.most_matches_won
    } catch (e) {
        console.error("Failed to fetch leaderboard", e)
    } finally {
        loading.value = false
    }
})

const getAvatar = (filename) => {

    return filename ? `http://localhost:8000/storage/avatars/${filename}` : 'https://placehold.co/40' 
}
</script>
