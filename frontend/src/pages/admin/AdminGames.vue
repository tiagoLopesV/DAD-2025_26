<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()

/* ---------------------------
   Pagination
---------------------------- */
const perPageOptions = [10, 20, 30, 50]
const perPage = ref(10)
const currentPage = ref(1)

/* ---------------------------
   Search
---------------------------- */
const searchQuery = ref('')
const searchField = ref('player1') // default search field

const searchFields = [
    { value: 'player1', label: 'Player 1' },
    { value: 'player2', label: 'Player 2' },
    { value: 'winner', label: 'Winner' },
    { value: 'type', label: 'Game Variant' },
    { value: 'id', label: 'Game ID' },
]

onMounted(() => {
    admin.fetchGames()
})

/* ---------------------------
   Filtering
---------------------------- */
const filteredGames = computed(() => {
    let list = admin.games

    if (!searchQuery.value) return list

    const q = searchQuery.value.toLowerCase()

    return list.filter(g => {
        const matchUser = (u) => {
            if (!u) return false
            const nick = u.nickname?.toLowerCase() ?? ''
            const email = u.email?.toLowerCase() ?? ''
            return nick.includes(q) || email.includes(q)
        }

        switch (searchField.value) {
            case 'player1':
                return matchUser(g.player1)

            case 'player2':
                return matchUser(g.player2)

            case 'winner':
                return matchUser(g.winner)

            case 'type':
                return g.type?.toLowerCase().includes(q)

            case 'id':
                return String(g.id).includes(q)

            default:
                return true
        }
    })
})

/* ---------------------------
   Pagination
---------------------------- */
const paginatedGames = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return filteredGames.value.slice(start, start + perPage.value)
})

const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredGames.value.length / perPage.value))
)

watch([perPage, searchQuery, searchField], () => {
    currentPage.value = 1
})
</script>

<template>
    <div>
        <h2 class="text-xl font-bold mb-4">Multiplayer Games</h2>

        <!-- Search Controls -->
        <div class="flex gap-4 mb-4 items-center">

            <!-- Field selector -->
            <select v-model="searchField" class="border rounded px-2 py-1">
                <option v-for="f in searchFields" :key="f.value" :value="f.value">
                    {{ f.label }}
                </option>
            </select>

            <!-- Search input -->
            <input v-model="searchQuery" type="text" placeholder="Search..." class="border rounded px-2 py-1 flex-1" />

            <!-- Per page -->
            <select v-model="perPage" class="border rounded px-2 py-1">
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">
                    {{ opt }} per page
                </option>
            </select>
        </div>

        <!-- Table -->
        <table class="w-full border">
            <thead>
                <tr class="border-b">
                    <th>ID</th>
                    <th>Variant</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Winner</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="g in paginatedGames" :key="g.id" class="border-b">
                    <td>{{ g.id }}</td>

                    <td>
                        Bisca de {{ g.type }}
                    </td>

                    <td>
                        {{ g.player1?.nickname ?? 'Deleted user' }}
                    </td>

                    <td>
                        {{ g.player2?.nickname ?? 'Deleted user' }}
                    </td>

                    <td>
                        {{ g.winner?.nickname ?? '—' }}
                    </td>

                    <td>
                        {{ g.status }}
                    </td>
                </tr>

                <tr v-if="paginatedGames.length === 0">
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No games found
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-between items-center mt-4">
            <span>
                Page {{ currentPage }} of {{ totalPages }}
            </span>

            <div class="flex gap-2">
                <button :disabled="currentPage === 1" @click="currentPage--"
                    class="px-2 py-1 border rounded disabled:opacity-50">
                    Prev
                </button>

                <button :disabled="currentPage === totalPages" @click="currentPage++"
                    class="px-2 py-1 border rounded disabled:opacity-50">
                    Next
                </button>
            </div>
        </div>
    </div>
</template>
