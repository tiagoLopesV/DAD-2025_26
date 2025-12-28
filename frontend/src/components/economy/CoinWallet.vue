<template>
  <div>
    <h3>Coin Balance: {{ balance }}</h3>

    <form @submit.prevent="buyCoins">
      <input v-model="euros" type="number" placeholder="Euros" min="1" max="99" />
      <select v-model="payment_type">
        <option>MBWAY</option>
        <option>PAYPAL</option>
        <option>IBAN</option>
        <option>MB</option>
        <option>VISA</option>
      </select>
      <input v-model="payment_reference" placeholder="Reference" />
      <button type="submit">Buy Coins</button>
    </form>

    <h4>Transaction History</h4>
    <ul>
      <li v-for="tx in transactions" :key="tx.id">
        {{ tx.transaction_datetime }} - {{ tx.coins }} coins ({{ tx.type.name }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCoinStore } from '@/stores/coin'

const store = useCoinStore()

const euros = ref(1)
const payment_type = ref('MBWAY')
const payment_reference = ref('')

// Computed properties
const balance = computed(() => store.balance)
const transactions = computed(() => store.transactions)

// Buy coins
const buyCoins = async () => {
  try {
    await store.purchaseCoins({
      euros: euros.value,
      payment_type: payment_type.value,
      payment_reference: payment_reference.value
    })
    await store.fetchTransactions()
  } catch (e) {
    console.error('Purchase failed', e)
  }
}

// On mounted
onMounted(async () => {
  await store.fetchBalance()
  await store.fetchTransactions()
  // Ensure userId exists; replace with store.userId or authenticated user id
  store.connectWebSocket(store.userId || store.id || 1)
})
</script>
