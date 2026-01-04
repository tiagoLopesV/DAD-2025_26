import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
//import axios from 'axios'
import http from './services/http'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const apiDomain = import.meta.env.VITE_API_DOMAIN
const wsConnection = import.meta.env.VITE_WS_CONNECTION

console.log('[main.js] api domain', apiDomain)
console.log('[main.js] ws connection', wsConnection)

const app = createApp(App)
const pinia = createPinia()

/* ---------------------------
   Restore auth token
---------------------------- */
const token = localStorage.getItem('auth_token')
if (token) {
  http.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

/* ---------------------------
   Socket
---------------------------- */
const socket = io(wsConnection, {
  //withCredentials: true,
  transports: ['websocket'],
})

console.log("Socket instance mainjs:", socket)
app.provide('socket', socket)
app.provide('serverBaseURL', `http://${apiDomain}`)
app.provide('apiBaseURL', `http://${apiDomain}/api`)
http.defaults.baseURL = `http://${apiDomain}/api`

app.use(pinia)
app.use(router)

/* ---------------------------
   Restore user AFTER Pinia
---------------------------- */
const auth = useAuthStore()
if (token && !auth.currentUser) {
  auth.fetchCurrentUser().catch(() => {
    auth.logout()
  })
}

app.mount('#app')
