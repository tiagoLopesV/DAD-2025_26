import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pages
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

  // Guest-only
  { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },

  // Authenticated
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

  // Public
  { path: '/leaderboard', name: 'leaderboard', component: LeaderboardPage },
  { path: '/statistics', name: 'statistics', component: StatisticsPage },

  // Admmin stuff
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
  // Authenticated
  { path: '/history', name: 'history', component: HistoryPage, meta: { requiresAuth: true } },

  // Testing
  {
    path: '/testing',
    children: [
      { path: 'laravel', component: LaravelPage },
      { path: 'websockets', component: WebsocketsPage },
    ],
  },

  //Game
  {
    path: '/lobby',
    name: 'multiplayerlobby',
    component: MultiplayerLobbyPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/multiplayer/:id',
    name: 'multiplayer',
    component: MultiplayerGamePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/singleplayer/',
    name: 'singleplayer',
    component: SingleplayerGamePage,
    meta: { requiresAuth: false }
  },

   {
    path: '/profile/transactions',
    name: 'profile-transactions',
    component: UserTransactionsPage,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Global navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // If token exists but currentUser not loaded
  if (auth.token && !auth.currentUser) {
    try {
      await auth.fetchCurrentUser()
    } catch {
      await auth.logout()
      return { name: 'login' }
    }
  }

  // Blocked users → force logout
  if (auth.currentUser?.blocked) {
    await auth.logout()
    return { name: 'login' }
  }

  // Route requires auth
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  // Guest-only routes
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'home' }
  }

  // Admin Guard
  if (to.meta.admin && auth.currentUser?.type !== 'A') {
    return { name: 'home' }
  }
})

export default router
