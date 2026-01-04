import axios from 'axios'

const http = axios.create({
  // Centralizamos a URL aqui. Se o deploy mudar, só mexes aqui.
  baseURL: `http://${import.meta.env.VITE_API_DOMAIN}/api`,
})

// INTERCEPTOR: Este código corre antes de QUALQUER pedido sair
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default http