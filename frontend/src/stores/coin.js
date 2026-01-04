import { defineStore } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client'

const WS_DOMAIN = import.meta.env.VITE_WS_CONNECTION
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN
const API_BASE_URL = `http://${API_DOMAIN}`  // explicit base URL for all axios calls

export const useCoinStore = defineStore('coin', {
  state: () => ({
    balance: 0,
    transactions: [],
    socket: null
  }),
  actions: {
    async fetchBalance() {
      const res = await axios.get(`${API_BASE_URL}/api/users/me`) // now uses full URL
      this.balance = res.data.coins_balance
    },
    async fetchTransactions() {
      const res = await axios.get(`${API_BASE_URL}/api/coins/transactions`)
      this.transactions = res.data
    },
    async purchaseCoins(payload) {
      const res = await axios.post(`${API_BASE_URL}/api/coins/purchase`, payload)
      this.balance = res.data.balance
      return res.data
    },
    connectWebSocket(userId) {
      this.socket = io(WS_DOMAIN, { withCredentials: true })
      this.socket.emit('join', `coins.${userId}`)

      this.socket.on('coin-updated', (data) => {
        if (data.userId === userId) {
          this.balance = data.balance
        }
      })
    }
  }
})
