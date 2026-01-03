<template>
  <div class="container mx-auto p-4 space-y-8">
    <h1 class="text-3xl font-bold mb-6">My History & Stats</h1>

    <!-- Personal Stats -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
        <div class="text-sm text-gray-500">Total Game Wins</div>
        <div class="text-2xl font-bold">{{ stats.game_wins_total }}</div>
      </div>
      <div class="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
        <div class="text-sm text-gray-500">Match Wins</div>
        <div class="text-2xl font-bold">{{ stats.match_wins }}</div>
      </div>
      <div class="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
        <div class="text-sm text-gray-500">Total Marks</div>
        <div class="text-2xl font-bold">{{ stats.total_marks }}</div>
      </div>
       <div class="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
        <div class="text-sm text-gray-500">Bisca 3 / 9 Wins</div>
        <div class="text-xl font-bold">{{ stats.game_wins_bisca_3 }} / {{ stats.game_wins_bisca_9 }}</div>
      </div>
    </div>

    <!-- History List -->
    <div class="bg-card rounded-lg shadow border overflow-hidden">
      <h2 class="text-xl font-semibold p-4 bg-gray-50 border-b">Recent Games</h2>
      <div v-if="loadingHistory" class="p-4 text-center">Loading history...</div>
      <div v-else-if="games.length === 0" class="p-4 text-center text-gray-500">No games found.</div>
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr class="text-left text-sm text-gray-600">
            <th class="p-3">Date</th>
            <th class="p-3">Type</th>
            <th class="p-3">Status</th>
            <th class="p-3">Outcome</th>
            <th class="p-3 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in games" :key="game.id" class="border-b last:border-0 hover:bg-gray-50">
            <td class="p-3">{{ formatDate(game.began_at) }}</td>
            <td class="p-3">Bisca {{ game.type }}</td>
            <td class="p-3">
                <span :class="getStatusClass(game.status)" class="px-2 py-1 rounded text-xs font-bold">{{ game.status }}</span>
            </td>
            <td class="p-3 font-medium">
                <span v-if="game.winner_user_id === userId" class="text-green-600">WIN</span>
                <span v-else-if="game.winner_user_id" class="text-red-600">LOSS</span>
                 <span v-else class="text-gray-500">{{ game.is_draw ? 'DRAW' : '-' }}</span>
            </td>
            <td class="p-3 text-right">{{ formatDuration(game.total_time) }}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination Controls (Generic) -->
      <div class="p-4 flex justify-between items-center border-t">
          <button @click="changePage(page - 1)" :disabled="page <= 1" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Page {{ page }}</span>
          <button @click="changePage(page + 1)" :disabled="!hasMore" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'

const api = useAPIStore()
const auth = useAuthStore()
const { currentUserID } = storeToRefs(auth)
const userId = currentUserID

const stats = ref(null)
const games = ref([])
const loadingHistory = ref(true)
const page = ref(1)
const hasMore = ref(false)

const loadData = async () => {
    loadingHistory.value = true
    try {
        const [statsRes, historyRes] = await Promise.all([
            api.getPersonalLeaderboard(),
            api.getMyHistory(page.value)
        ])
        stats.value = statsRes.data
        games.value = historyRes.data.data
        hasMore.value = !!historyRes.data.next_page_url
    } catch (e) {
        console.error("Error loading history", e)
    } finally {
        loadingHistory.value = false
    }
}

const changePage = (newPage) => {
    if (newPage < 1) return
    page.value = newPage
    loadData()
}

onMounted(() => {
    loadData()
})

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
}

const formatDuration = (seconds) => {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}m ${s}s`
}

const getStatusClass = (status) => {
    switch (status) {
        case 'Ended': return 'bg-green-100 text-green-800'
        case 'Playing': return 'bg-blue-100 text-blue-800'
        case 'Interrupted': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
</script>
