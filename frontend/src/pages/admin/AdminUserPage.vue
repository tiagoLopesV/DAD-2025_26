<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()

// Pagination
const perPageOptions = [10, 20, 30, 50]
const perPage = ref(10)
const currentPage = ref(1)

// Search
const searchQuery = ref('')

// Fetch users on mount
onMounted(() => {
    admin.fetchUsers()
})

// Computed: filtered and paginated users
const filteredUsers = computed(() => {
    if (!searchQuery.value) return admin.users

    const q = searchQuery.value.toLowerCase()

    return admin.users.filter(u => {
        const email = u.email ? u.email.toLowerCase() : ''
        const nickname = u.nickname ? u.nickname.toLowerCase() : ''
        return email.includes(q) || nickname.includes(q)
    })
})

const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    const end = start + perPage.value
    return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / perPage.value))

// Watch perPage to reset page if needed
watch(perPage, () => {
    currentPage.value = 1
})

// Actions
const confirmDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
        await admin.deleteUser(id)
    }
}

const toggleBlock = async (id) => {
    await admin.toggleBlock(id)
}
</script>

<template>
    <div>
        <h2 class="text-xl font-bold mb-4">Users</h2>

        <!-- Search + per-page -->
        <div class="flex justify-between mb-4 gap-4">
            <input type="text" v-model="searchQuery" placeholder="Search by email or nickname"
                class="border rounded px-2 py-1 flex-1" />

            <select v-model="perPage" class="border rounded px-2 py-1">
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">
                    {{ opt }} per page
                </option>
            </select>
        </div>

        <table class="w-full border">
            <thead>
                <tr class="border-b">
                    <th>Email</th>
                    <th>Nickname</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="u in paginatedUsers" :key="u.id" class="border-b">
                    <td>{{ u.email }}</td>
                    <td>{{ u.nickname }}</td>
                    <td>{{ u.type === 'A' ? 'Admin' : 'Player' }}</td>
                    <td>
                        <!-- Show status -->
                        <span v-if="u.deleted_at">
                            Deleted - {{ new Date(u.deleted_at).toLocaleString() }}
                        </span>
                        <span v-else>
                            {{ u.blocked ? 'Blocked' : 'Active' }}
                        </span>
                    </td>
                    <td class="flex gap-2">
                        <!-- Actions: hide if deleted -->
                        <template v-if="!u.deleted_at">
                            <button v-if="u.type === 'P'" @click="toggleBlock(u.id)" class="px-2 py-1 border rounded">
                                {{ u.blocked ? 'Unblock' : 'Block' }}
                            </button>

                            <button @click="confirmDelete(u.id)" class="text-red-600 px-2 py-1 border rounded">
                                Delete
                            </button>
                        </template>
                        <template v-else>
                            <!-- Deleted users have no actions -->
                            <span class="text-gray-400 italic">No actions</span>
                        </template>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination controls -->
        <div class="flex justify-between mt-4 items-center">
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