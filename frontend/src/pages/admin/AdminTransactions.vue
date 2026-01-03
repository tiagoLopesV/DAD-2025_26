<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()

// Pagination
const perPageOptions = [10, 20, 30, 50]
const perPage = ref(10)
const currentPage = ref(1)

// Search + filters
const searchQuery = ref('')
const selectedType = ref('')
const selectedUser = ref(null)
const showUserSuggestions = ref(false)

onMounted(() => {
    admin.fetchTransactions()
})

/* ---------------------------
   Transaction Types Dropdown
---------------------------- */
const transactionTypes = computed(() => {
    const types = admin.transactions
        .map(t => t.type?.name)
        .filter(Boolean)
    return [...new Set(types)]
})

/* ---------------------------
   User Suggestions
---------------------------- */
const userSuggestions = computed(() => {
    if (!searchQuery.value) return []

    const q = searchQuery.value.toLowerCase()

    const users = admin.transactions
        .map(t => t.user)
        .filter(Boolean)

    // unique users by id
    const uniqueUsers = Object.values(
        users.reduce((acc, u) => {
            acc[u.id] = u
            return acc
        }, {})
    )

    return uniqueUsers.filter(u => {
        const email = u.email?.toLowerCase() ?? ''
        const nickname = u.nickname?.toLowerCase() ?? ''
        return email.includes(q) || nickname.includes(q)
    })
})

const selectUser = (user) => {
    selectedUser.value = user
    searchQuery.value = user.nickname ?? user.email
    showUserSuggestions.value = false
}

const clearUserFilter = () => {
    selectedUser.value = null
    searchQuery.value = ''
}

/* ---------------------------
   Filtering
---------------------------- */
const filteredTransactions = computed(() => {
    let list = admin.transactions

    // User filter
    if (selectedUser.value) {
        list = list.filter(t => t.user?.id === selectedUser.value.id)
    } else if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(t => {
            if (!t.user) return false
            const email = t.user.email?.toLowerCase() ?? ''
            const nickname = t.user.nickname?.toLowerCase() ?? ''
            return email.includes(q) || nickname.includes(q)
        })
    }

    // Type filter
    if (selectedType.value) {
        list = list.filter(t => t.type?.name === selectedType.value)
    }

    return list
})

/* ---------------------------
   Pagination
---------------------------- */
const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return filteredTransactions.value.slice(start, start + perPage.value)
})

const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredTransactions.value.length / perPage.value))
)

watch([perPage, searchQuery, selectedType, selectedUser], () => {
    currentPage.value = 1
})
</script>

<template>
    <div>
        <h2 class="text-xl font-bold mb-4">All Transactions</h2>

        <!-- Filters -->
        <div class="flex gap-4 mb-4 items-start">

            <!-- User autocomplete -->
            <div class="relative flex-1">
                <input v-model="searchQuery" type="text" placeholder="Search user"
                    class="border rounded px-2 py-1 w-full" @focus="showUserSuggestions = true" />

                <!-- Clear selected user -->
                <button v-if="selectedUser" @click="clearUserFilter"
                    class="absolute right-2 top-1 text-xs text-red-500">
                    ✕
                </button>

                <!-- Suggestions dropdown -->
                <ul v-if="showUserSuggestions && !selectedUser && userSuggestions.length"
                    class="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-auto">
                    <li v-for="u in userSuggestions" :key="u.id" @click="selectUser(u)"
                        class="px-2 py-1 hover:bg-gray-100 cursor-pointer">
                        <strong>{{ u.nickname }}</strong>
                        <span class="text-xs text-gray-500">
                            ({{ u.email }})
                        </span>
                    </li>
                </ul>
            </div>

            <!-- Type filter -->
            <select v-model="selectedType" class="border rounded px-2 py-1">
                <option value="">All types</option>
                <option v-for="t in transactionTypes" :key="t" :value="t">
                    {{ t }}
                </option>
            </select>

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
                    <th>Date</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Coins</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="t in paginatedTransactions" :key="t.id" class="border-b">
                    <td>{{ new Date(t.transaction_datetime).toLocaleString() }}</td>

                    <td>
                        <span v-if="t.user">
                            {{ t.user.nickname ?? t.user.email }}
                        </span>
                        <span v-else class="italic text-gray-400">
                            Deleted user
                        </span>
                    </td>

                    <td>{{ t.type?.name ?? 'Unknown' }}</td>
                    <td>{{ t.coins }}</td>
                </tr>

                <tr v-if="paginatedTransactions.length === 0">
                    <td colspan="4" class="text-center py-4 text-gray-500">
                        No transactions found
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex justify-between items-center mt-4">
            <span>Page {{ currentPage }} of {{ totalPages }}</span>

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
