import { defineStore } from 'pinia'
import http from '@/services/http'

export const useAdminStore = defineStore('admin', {
    state: () => ({
        users: [],
        transactions: [],
        games: [],
        matches: []
    }),

    actions: {
        async fetchUsers() {
            this.users = (await http.get('/admin/users')).data
        },
        async toggleBlock(id) {
            await http.patch(`/admin/users/${id}/block`)
            this.fetchUsers()
        },
        async deleteUser(id) {
            await http.delete(`/admin/users/${id}`)
            this.fetchUsers()
        },
        async fetchTransactions() {
            this.transactions = (await http.get('/admin/transactions')).data
        },
        async createAdmin(data) {
            const res = await http.post('/admin/admins', data)
            // Optionally refresh the users list
            await this.fetchUsers()
            return res.data
        },
        async fetchGames() {
            try {
                const res = await http.get('/admin/games')
                this.games = res.data
            } catch (err) {
                console.error('Failed to fetch games:', err)
            }
        }
    }
})
