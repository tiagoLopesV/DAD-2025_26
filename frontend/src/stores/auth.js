import { defineStore } from 'pinia'
import axios from 'axios'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

// Hardcoded backend URL
const API_BASE_URL = 'http://localhost:8000'

// Set default base URL for all axios requests
axios.defaults.baseURL = API_BASE_URL

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()
  const currentUser = ref(undefined)

  const isLoggedIn = computed(() => currentUser.value !== undefined)
  const currentUserID = computed(() => currentUser.value?.id)

  // LOGIN
  const login = async (credentials) => {
    const response = await apiStore.postLogin(credentials)
    // Set token header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`

    // Fetch current user
    const userResponse = await apiStore.getAuthUser()
    currentUser.value = userResponse.data
    return userResponse.data
  }

  // REGISTER
  const register = async (formData) => {
    const response = await apiStore.postRegister(formData)
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`
    currentUser.value = response.data.user
    return response.data
  }

  // LOGOUT
  const logout = async () => {
    await apiStore.postLogout()
    delete axios.defaults.headers.common['Authorization'] // remove token
    currentUser.value = undefined
  }

  // UPDATE PROFILE
  const updateProfile = async (formData) => {
    console.log('[auth store] updateProfile called with', formData)

    const response = await axios.put('/api/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    console.log('[auth store] response:', response.data)
    currentUser.value = response.data
    return response.data
  }

  // DELETE ACCOUNT
  const deleteAccount = async (password) => {
    console.log('[auth store] deleteAccount called with password:', password)
    const response = await axios.delete('/api/me', { data: { password } }) // <-- changed here
    console.log('[auth store] delete response:', response.data)
    currentUser.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }


  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    register,
    updateProfile,
    deleteAccount,
  }
})
