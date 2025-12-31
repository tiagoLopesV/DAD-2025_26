<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

const selectedVariant = ref('3')
const highScores = ref([]) // Definido aqui

const startSinglePlayer = () => {
  router.push({ name: 'singleplayer', query: { variant: selectedVariant.value } })
}

const goToLobby = () => {
  router.push({ name: 'lobby' })
}

onMounted(async () => {
  try {
    const response = await apiStore.getGames()
    highScores.value = response.data.data
      .map(item => ({
        points: item.player1_points,
        username: item.player1?.name || 'Anónimo',
        date: new Date(item.created_at).toLocaleDateString()
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
  } catch (error) {
    console.error("Erro ao carregar scores:", error)
  }
})
</script>

<template>
  <div class="container mx-auto py-10 px-4">
    <h1 class="text-5xl font-black text-center mb-10 text-gray-700 drop-shadow-lg italic uppercase tracking-tighter">
      Bisca Game
    </h1>

    <div class="flex flex-col lg:flex-row justify-center items-start gap-8">
      
      <div class="flex flex-col gap-8 w-full max-w-2xl">
        <div class="grid md:grid-cols-2 gap-8">
          <Card class="bg-slate-900 border-slate-700 text-slate-200">
            <CardHeader>
              <CardTitle class="text-2xl font-bold text-white">Singleplayer</CardTitle>
              <br>
              <CardDescription>Play against the CPU now</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="flex gap-2 p-1 bg-slate-800 rounded-lg">
                <Button 
                  v-for="v in ['3', '9']" :key="v"
                  @click="selectedVariant = v"
                  size="sm"
                  class="flex-1 font-bold transition-all"
                  :variant="selectedVariant === v ? 'default' : 'ghost'"
                  :class="selectedVariant === v ? 'bg-white text-black' : 'text-slate-400'"
                >
                  {{ v }} Cards
                </Button>
              </div>
              <Button @click="startSinglePlayer" size="lg" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase">
                Play Solo
              </Button>
            </CardContent>
          </Card>

          <Card class="bg-emerald-950 border-emerald-800 text-emerald-100">
            <CardHeader>
              <CardTitle class="text-2xl font-bold text-white">Multiplayer</CardTitle>
              <br>
              <CardDescription>Challenge other players</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div v-if="!authStore.user" class="text-center py-4">
                <p class="text-xs text-emerald-500 mb-4">Log in for online mode</p>
                <Button @click="router.push('/login')" variant="outline" class="w-full border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black">
                  Login
                </Button>
              </div>
              <Button v-else @click="goToLobby" size="lg" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase">
                Go to Lobby
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card class="w-full lg:w-80 bg-slate-50 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle class="text-xl font-bold flex items-center gap-2">
            <span>🏆</span> Top 5 Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="highScores.length > 0" class="space-y-4">
            <div v-for="(score, index) in highScores" :key="index" class="flex justify-between items-center border-b pb-2 last:border-0">
              <div>
                <p class="font-bold text-slate-800 leading-none">{{ score.username }}</p>
                <p class="text-[10px] text-slate-500">{{ score.date }}</p>
              </div>
              <span class="text-lg font-black text-blue-600">{{ score.points }}</span>
            </div>
          </div>
          <p v-else class="text-center text-slate-400 italic py-4">Loading scores...</p>
        </CardContent>
      </Card>

    </div>
  </div>
</template>