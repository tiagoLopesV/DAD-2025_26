import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)

  const isLoggedIn = computed(() => currentUser.value !== undefined)
  const currentUserID = computed(() => currentUser.value?.id)

  // LOGIN
  const login = async (credentials) => {
    const response = await apiStore.postLogin(credentials)
    // Get authenticated user
    const userResponse = await apiStore.getAuthUser()
    currentUser.value = userResponse.data
    return userResponse.data
  }

  // LOGOUT
  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined
  }

  // REGISTER
  const register = async (formData) => {
    const response = await apiStore.postRegister(formData)
    
    // Save token in apiStore
    apiStore.token = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${apiStore.token}`

    // Save current user
    currentUser.value = response.data.user
    return response.data
  }

  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    register,
  }
})
