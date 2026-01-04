import { defineStore } from 'pinia'
import axios from 'axios'
import { io } from 'socket.io-client'

const WS_DOMAIN = import.meta.env.VITE_WS_CONNECTION


export const useCoinStore = defineStore('coin', {
  state: () => ({
    balance: 0,
    transactions: [],
    socket: null
  }),
  actions: {
    async fetchBalance() {
      const res = await axios.get('/api/users/me') // assuming user API returns balance
      this.balance = res.data.coins_balance
    },
    async fetchTransactions() {
      const res = await axios.get('/api/coins/transactions')
      this.transactions = res.data
    },
    async purchaseCoins(payload) {
      const res = await axios.post('/api/coins/purchase', payload)
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
