import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import http from '@/services/http'
import { inject, ref } from 'vue'

const WS_DOMAIN = import.meta.env.VITE_WS_CONNECTION


export const useCoinStore = defineStore('coin', () => {
const socket = inject('socket')
  const balance = ref(0)
  const transactions = ref([])


  const fetchBalance = async () => {
    const res = await http.get('/users/me') // assuming user API returns balance
    balance.value = res.data.coins_balance
  }
  const fetchTransactions = async () => {
    const res = await http.get('/coins/transactions')
    transactions.value = res.data
  }
  const purchaseCoins = async (payload) => {
    const res = await http.post('/coins/purchase', payload)
    balance.value = res.data.balance
    return res.data
  }
  const connectWebSocket = (userId) => {
    
    console.log("Socket instance:", socket)
    console.log("Joining coin updates channel for user", userId)
    socket.emit('join_coin_updates', userId)

    socket.on('coin-updated', (data) => {
      if (data.userId === userId) {
        balance.value = data.balance
      }
    })
  }
  return {
    balance,
    transactions,
    fetchBalance,
    fetchTransactions,
    purchaseCoins,
    connectWebSocket
  }
})