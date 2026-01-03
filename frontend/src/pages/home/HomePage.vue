<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

const selectedVariant = ref('3')
const selectedMode = ref('game') // 'game' ou 'match'
const highScores = ref([])

const startSinglePlayer = () => {
  router.push({ 
    name: 'singleplayer', 
    query: { 
      variant: selectedVariant.value,
      mode: selectedMode.value 
    } 
  })
}

const goToLobby = () => {
  router.push({ name: 'multiplayerlobby' })
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
              <CardDescription>Play solo against the BOT now</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="space-y-2">
                <p class="text-[10px] uppercase font-bold text-slate-500">Cards in Hand</p>
                <div class="flex gap-2 p-1 bg-slate-800 rounded-lg">
                  <Button v-for="v in ['3', '9']" :key="v" @click="selectedVariant = v" size="sm" class="flex-1 font-bold"
                    :variant="selectedVariant === v ? 'default' : 'ghost'"
                    :class="selectedVariant === v ? 'bg-white text-black' : 'text-slate-400'">
                    {{ v }} Cards
                  </Button>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-[10px] uppercase font-bold text-slate-500">Game Type</p>
                <div class="flex gap-2 p-1 bg-slate-800 rounded-lg">
                  <Button @click="selectedMode = 'game'" size="sm" class="flex-1 font-bold"
                    :variant="selectedMode === 'game' ? 'default' : 'ghost'"
                    :class="selectedMode === 'game' ? 'bg-blue-500 text-white' : 'text-slate-400'">
                    Single Game
                  </Button>
                  <Button @click="selectedMode = 'match'" size="sm" class="flex-1 font-bold"
                    :variant="selectedMode === 'match' ? 'default' : 'ghost'"
                    :class="selectedMode === 'match' ? 'bg-blue-500 text-white' : 'text-slate-400'">
                    Match (4 Marks)
                  </Button>
                </div>
              </div>

              <Button @click="startSinglePlayer" size="lg" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase">
                Play Solo
              </Button>
            </CardContent>
          </Card>

          <Card class="bg-emerald-950 border-emerald-800 text-emerald-100">
            <CardHeader>
              <CardTitle class="text-2xl font-bold text-white">Multiplayer</CardTitle>
              <CardDescription>Challenge other players</CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div v-if="!authStore.currentUser" class="text-center py-4">
                <p class="text-xs text-emerald-500 mb-4">Log in for online mode</p>
                <Button @click="router.push('/login')" variant="outline" class="w-full border-emerald-500 text-emerald-500 hover:bg-emerald-500">
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
    </div>
  </div>
</template>