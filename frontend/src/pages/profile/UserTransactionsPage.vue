<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const auth = useAuthStore()

// Pagination
const perPageOptions = [10, 20, 30, 50]
const perPage = ref(10)
const currentPage = ref(1)

// Transactions data
const transactions = ref([])

const fetchTransactions = async () => {
    try {
        const response = await axios.get('/api/coins/transactions')
        // Filter only for current logged-in user
        transactions.value = response.data.filter(t => t.user_id === auth.currentUser?.id)
    } catch (err) {
        toast.error('Failed to fetch transactions')
        console.error(err)
    }
}

onMounted(fetchTransactions)

/* ---------------------------
   Pagination
---------------------------- */
const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return transactions.value.slice(start, start + perPage.value)
})

const totalPages = computed(() =>
    Math.max(1, Math.ceil(transactions.value.length / perPage.value))
)
</script>

<template>
    <div class="max-w-4xl mx-auto p-5">
        <h2 class="text-xl font-bold mb-4">Your Transactions</h2>

        <!-- Per page -->
        <select v-model="perPage" class="border rounded px-2 py-1 mb-4">
            <option v-for="opt in perPageOptions" :key="opt" :value="opt">
                {{ opt }} per page
            </option>
        </select>

        <!-- Table -->
        <table class="w-full border">
            <thead>
                <tr class="border-b">
                    <th>Date</th>
                    <th>Type</th>
                    <th>Coins</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="t in paginatedTransactions" :key="t.id" class="border-b">
                    <td>{{ new Date(t.transaction_datetime).toLocaleString() }}</td>
                    <td>{{ t.type?.name ?? 'Unknown' }}</td>
                    <td>{{ t.coins }}</td>
                </tr>

                <tr v-if="paginatedTransactions.length === 0">
                    <td colspan="3" class="text-center py-4 text-gray-500">
                        No transactions found
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
