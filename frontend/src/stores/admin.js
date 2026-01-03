import { defineStore } from 'pinia'
import axios from 'axios'

export const useAdminStore = defineStore('admin', {
    state: () => ({
        users: [],
        transactions: [],
        games: [],
        matches: []
    }),

    actions: {
        async fetchUsers() {
            this.users = (await axios.get('/api/admin/users')).data
        },
        async toggleBlock(id) {
            await axios.patch(`/api/admin/users/${id}/block`)
            this.fetchUsers()
        },
        async deleteUser(id) {
            await axios.delete(`/api/admin/users/${id}`)
            this.fetchUsers()
        },
        async fetchTransactions() {
            this.transactions = (await axios.get('/api/admin/transactions')).data
        },
        async createAdmin(data) {
            const res = await axios.post('/api/admin/admins', data)
            // Optionally refresh the users list
            await this.fetchUsers()
            return res.data
        },
        async fetchGames() {
            try {
                const res = await axios.get('/api/admin/games')
                this.games = res.data
            } catch (err) {
                console.error('Failed to fetch games:', err)
            }
        }
    }
})
