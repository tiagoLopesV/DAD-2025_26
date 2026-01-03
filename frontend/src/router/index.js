import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pages (unchanged)
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import RegisterPage from '@/pages/register/RegisterPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import MultiplayerLobbyPage from '@/pages/game/MultiplayerLobbyPage.vue'
import SingleplayerGamePage from '@/pages/game/SingleplayerGamePage.vue'
import MultiplayerGamePage from '@/pages/game/MultiplayerGamePage.vue'
import LeaderboardPage from '@/pages/LeaderboardPage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'
import StatisticsPage from '@/pages/StatisticsPage.vue'
import UserTransactionsPage from '@/pages/profile/UserTransactionsPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },

  { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },

  { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },

  {
    path: '/logout',
    name: 'logout',
    meta: { requiresAuth: true },
    beforeEnter: async () => {
      const auth = useAuthStore()
      await auth.logout()
      return { name: 'login' }
    },
  },

  { path: '/leaderboard', component: LeaderboardPage },
  { path: '/statistics', component: StatisticsPage },

  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, admin: true },
    children: [
      { path: 'users', component: () => import('@/pages/admin/AdminUserPage.vue') },
      { path: 'transactions', component: () => import('@/pages/admin/AdminTransactions.vue') },
      { path: 'games', component: () => import('@/pages/admin/AdminGames.vue') },
      { path: 'admins', component: () => import('@/pages/admin/CreateAdmin.vue') },
    ],
  },

  { path: '/history', component: HistoryPage, meta: { requiresAuth: true } },

  {
    path: '/testing',
    children: [
      { path: 'laravel', component: LaravelPage },
      { path: 'websockets', component: WebsocketsPage },
    ],
  },

  {
    path: '/profile/transactions',
    name: 'profile-transactions',
    component: UserTransactionsPage,
    meta: { requiresAuth: true }
  },

  {
    path: '/lobby',
    component: MultiplayerLobbyPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/multiplayer/:id',
    component: MultiplayerGamePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/singleplayer',
    component: SingleplayerGamePage,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Restore user if token exists
  if (auth.token && !auth.currentUser) {
    try {
      await auth.fetchCurrentUser()
    } catch {
      await auth.logout()
      return { name: 'login' }
    }
  }

  // Blocked users
  if (auth.currentUser?.blocked) {
    await auth.logout()
    return { name: 'login' }
  }

  // Auth guard
  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login' }
  }

  // Guest-only guard
  if (to.meta.guestOnly && auth.token) {
    return { name: 'home' }
  }

  // Admin guard
  if (to.meta.admin && auth.currentUser?.type !== 'A') {
    return { name: 'home' }
  }
})

export default router
