import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'
import { useSocketStore } from './socket'

// Backend base URL
const API_BASE_URL = 'http://localhost:8000'
axios.defaults.baseURL = API_BASE_URL

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()
  const socketStore = useSocketStore()

  const currentUser = ref(undefined)
  const token = ref(localStorage.getItem('auth_token'))

  /* ---------------------------
     Computed
  ---------------------------- */
  const isLoggedIn = computed(() => !!currentUser.value)
  const currentUserID = computed(() => currentUser.value?.id)

  /* ---------------------------
     Helpers
  ---------------------------- */
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const clearToken = () => {
    token.value = null
    localStorage.removeItem('auth_token')
    delete axios.defaults.headers.common['Authorization']
  }

  // Build full avatar URL
  const buildAvatarUrl = (filename) => {
    return filename
      ? `${API_BASE_URL}/storage/photos_avatars/${filename}`
      : `${API_BASE_URL}/storage/photos_avatars/anonymous.png`
  }

  const formatUser = (user) => ({
    ...user,
    photo_avatar_url: buildAvatarUrl(user.photo_avatar_filename),
  })

  /* ---------------------------
     Auth Actions
  ---------------------------- */
  const login = async (credentials) => {
    const response = await apiStore.postLogin(credentials)
    setToken(response.token)

    const userResponse = await apiStore.getAuthUser()
    currentUser.value = formatUser(userResponse.data)
    socketStore.emitJoin(currentUser.value)
    return currentUser.value
  }

  const register = async (formData) => {
    const response = await apiStore.postRegister(formData)
    setToken(response.token)
    currentUser.value = formatUser(response.data.user)
    return currentUser.value
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return
    const response = await apiStore.getAuthUser()
    currentUser.value = formatUser(response.data)
    return currentUser.value
  }

  const logout = async () => {
    try { await apiStore.postLogout() } catch (e) { }
    clearToken()
    currentUser.value = undefined
  }

  const updateProfile = async (formData) => {
    const response = await axios.put('/api/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    currentUser.value = formatUser(response.data)
    return currentUser.value
  }

  const deleteAccount = async (password) => {
    await axios.delete('/api/me', { data: { password } })
    clearToken()
    currentUser.value = undefined
  }

  return {
    currentUser,
    token,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    register,
    fetchCurrentUser,
    updateProfile,
    deleteAccount,
    buildAvatarUrl,
  }
})
