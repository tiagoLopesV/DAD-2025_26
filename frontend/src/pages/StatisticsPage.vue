<template>
  <div class="container mx-auto p-4 space-y-8">
    <h1 class="text-3xl font-bold mb-6">Platform Statistics</h1>

    <div v-if="loading" class="text-center">Loading statistics...</div>
    <div v-else-if="error" class="text-center text-red-600">{{ error }}</div>
    <div v-else-if="stats">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-card p-6 rounded-lg shadow border text-center">
            <h3 class="text-gray-500 text-sm uppercase tracking-wide">Total Players</h3>
            <p class="text-4xl font-bold text-primary mt-2">{{ stats.total_players }}</p>
        </div>
        <div class="bg-card p-6 rounded-lg shadow border text-center">
            <h3 class="text-gray-500 text-sm uppercase tracking-wide">Total Games</h3>
            <p class="text-4xl font-bold text-primary mt-2">{{ stats.total_games }}</p>
        </div>
        <div class="bg-card p-6 rounded-lg shadow border text-center">
            <h3 class="text-gray-500 text-sm uppercase tracking-wide">Total Matches</h3>
            <p class="text-4xl font-bold text-primary mt-2">{{ stats.total_matches }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <!-- Game Status Distribution -->
        <div class="bg-white p-6 rounded-lg shadow border">
            <h3 class="text-lg font-semibold mb-4 text-center">Game Status Distribution</h3>
            <div class="h-64 relative">
                <Pie :data="statusChartData" :options="chartOptions" />
            </div>
        </div>

        <!-- Recent Activity (Last 7 Days) -->
        <div class="bg-white p-6 rounded-lg shadow border">
            <h3 class="text-lg font-semibold mb-4 text-center">Games Played (Last 7 Days)</h3>
             <div class="h-64 relative">
                <Bar :data="activityChartData" :options="chartOptions" />
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAPIStore } from '@/stores/api'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const api = useAPIStore()
const loading = ref(true)
const stats = ref(null)
const error = ref(null)

const loadStats = async () => {
    try {
        const response = await api.getPublicStatistics()
        stats.value = response.data
    } catch (e) {
        console.error("Failed to load statistics", e)
        error.value = "Failed to load statistics. Please try again later."
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadStats()
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
}

// Data transformation for charts
const statusChartData = computed(() => {
    if (!stats.value) return { labels: [], datasets: [] }
    
    const labels = stats.value.games_by_status.map(s => s.status)
    const data = stats.value.games_by_status.map(s => s.count)
    
    return {
        labels,
        datasets: [{
            backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16'],
            data
        }]
    }
})

const activityChartData = computed(() => {
    if (!stats.value) return { labels: [], datasets: [] }
    
    // Fill in missing days if needed, but for now just map existing data
    // Assuming API returns sorted dates
    const labels = stats.value.games_last_7_days.map(d => d.date)
    const data = stats.value.games_last_7_days.map(d => d.count)

    return {
        labels,
        datasets: [{
            label: 'Games Played',
            backgroundColor: '#3b82f6',
            data
        }]
    }
})
</script>
