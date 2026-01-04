import { defineStore } from 'pinia'
import axios from 'axios'

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN
const API_BASE_URL = `http://${API_DOMAIN}`

export const useAdminStore = defineStore('admin', {
    state: () => ({
        users: [],
        transactions: [],
        games: [],
        matches: []
    }),

    actions: {
        async fetchUsers() {
            this.users = (await axios.get(`${API_BASE_URL}/api/admin/users`)).data
        },
        async toggleBlock(id) {
            await axios.patch(`${API_BASE_URL}/api/admin/users/${id}/block`)
            this.fetchUsers()
        },
        async deleteUser(id) {
            await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`)
            this.fetchUsers()
        },
        async fetchTransactions() {
            this.transactions = (await axios.get(`${API_BASE_URL}/api/admin/transactions`)).data
        },
        async createAdmin(data) {
            const res = await axios.post(`${API_BASE_URL}/api/admin/admins`, data)
            // Optionally refresh the users list
            await this.fetchUsers()
            return res.data
        },
        async fetchGames() {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/admin/games`)
                this.games = res.data
            } catch (err) {
                console.error('Failed to fetch games:', err)
            }
        }
    }
})
