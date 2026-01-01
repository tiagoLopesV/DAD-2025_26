import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pages
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import RegisterPage from '@/pages/register/RegisterPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
// import LobbyPage from '@/pages/game/LobbyPage.vue'
import SingleplayerGamePage from '@/pages/game/SingleplayerGamePage.vue'

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

  // Testing
  {
    path: '/testing',
    children: [
      { path: 'laravel', component: LaravelPage },
      { path: 'websockets', component: WebsocketsPage },
    ],
  },

  //Game
  // { 
  //   path: '/lobby', 
  //   name: 'lobby', 
  //   component: LobbyPage, 
  //   meta: { requiresAuth: true } 
  // },
  { 
    path: '/singleplayer/', 
    name: 'singleplayer', 
    component: SingleplayerGamePage, 
    meta: { requiresAuth: false } 
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
})

export default router
