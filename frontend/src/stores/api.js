import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'

import http from '@/services/http'
import { ref } from 'vue'

export const useAPIStore = defineStore('api', () => {


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
    const response = await http.post('/login', credentials)
    token.value = response.data.token
    http.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response.data
  }

  // LOGOUT
  const postLogout = async () => {
    await http.post('/logout')
    token.value = undefined
    delete http.defaults.headers.common['Authorization']
  }

  // GET AUTH USER
  const getAuthUser = () => http.get('/users/me')
  // REGISTER
  const postRegister = (formData) => http.post('/register', formData)

  // GAMES

  const postGame = async (game) => {
  try {
    const response = await http.post('/games', game)
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

    return http.get(`/games?${queryParams}`)
  }

  const postMatch = async (match) => {
  try {
    const response = await http.post('/matches', match)
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
    getGlobalLeaderboard: () => http.get('/leaderboard/global'),
    getPersonalLeaderboard: () => http.get('/leaderboard/personal'),
    getMyHistory: (page = 1) => http.get(`/history/my-games?page=${page}`),
    getAllHistory: (page = 1) => http.get(`/history/all-games?page=${page}`),
    getPublicStatistics: () => http.get('/statistics/public'),
  }
})
