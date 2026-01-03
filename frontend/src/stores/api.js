import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const token = ref()
  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  // LOGIN
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    token.value = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response.data
  }

  // LOGOUT
  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`)
    token.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }

  // GET AUTH USER
  const getAuthUser = () => axios.get(`${API_BASE_URL}/users/me`)

  // REGISTER
  const postRegister = (formData) => axios.post(`${API_BASE_URL}/register`, formData)

  // GAMES

  const postGame = async (game) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/games`, game)
    toast.success(`[API] Game saved successfully`)
    return response
  } catch (error) {
    toast.error(`[API] Error saving game - ${error?.response?.data?.message || error.message}`)
    throw error
  }
}

  const getGames = (resetPagination = false) => {
    if (resetPagination) gameQueryParameters.value.page = 1

    const queryParams = new URLSearchParams({
      page: gameQueryParameters.value.page,
      ...(gameQueryParameters.value.filters.type && {
        type: gameQueryParameters.value.filters.type,
      }),
      ...(gameQueryParameters.value.filters.status && {
        status: gameQueryParameters.value.filters.status,
      }),
      sort_by: gameQueryParameters.value.filters.sort_by,
      sort_direction: gameQueryParameters.value.filters.sort_direction,
    }).toString()

    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
  }

  const postMatch = async (match) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/matches`, match)
    toast.success(`[API] Match saved successfully`)
    return response
  } catch (error) {
    toast.error(`[API] Error saving match - ${error?.response?.data?.message || error.message}`)
    throw error
  }
}

  return {
    token,
    postLogin,
    postLogout,
    getAuthUser,
    postGame,
    getGames,
    postMatch,
    gameQueryParameters,
    postRegister,
  }
})
