import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import http from '@/services/http'

const WS_DOMAIN = import.meta.env.VITE_WS_CONNECTION


export const useCoinStore = defineStore('coin', {
  state: () => ({
    balance: 0,
    transactions: [],
    socket: null
  }),
  actions: {
    async fetchBalance() {
      const res = await http.get('/api/users/me') // assuming user API returns balance
      this.balance = res.data.coins_balance
    },
    async fetchTransactions() {
      const res = await http.get('/api/coins/transactions')
      this.transactions = res.data
    },
    async purchaseCoins(payload) {
      const res = await http.post('/api/coins/purchase', payload)
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
