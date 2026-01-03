<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const props = defineProps({
  userLoggedIn: Boolean,
})

const authStore = useAuthStore()
const router = useRouter()

const isAdmin = computed(() => authStore.currentUser?.type === 'A')


const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList class="justify-around gap-20">

      <!-- Testing -->
      <NavigationMenuItem>
        <NavigationMenuTrigger>Testing</NavigationMenuTrigger>
        <NavigationMenuContent>
          <li>
            <NavigationMenuLink as-child>
              <RouterLink to="/testing/laravel">Laravel</RouterLink>
            </NavigationMenuLink>
            <NavigationMenuLink as-child>
              <RouterLink to="/testing/websockets">WebSockets</RouterLink>
            </NavigationMenuLink>
          </li>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <RouterLink to="/leaderboard">Leaderboard</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <RouterLink to="/statistics">Statistics</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn">
        <NavigationMenuLink as-child>
          <RouterLink to="/history">History</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn">
        <NavigationMenuLink as-child>
          <RouterLink to="/profile">Profile</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- ✅ ADMIN DROPDOWN -->
      <!-- inside NavigationMenuList -->
      <!-- Admin Dropdown (visible only for admin users) -->
      <NavigationMenuItem v-if="isAdmin">
        <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
        <NavigationMenuContent>
          <li class="flex flex-col gap-2">
            <RouterLink class="block p-2 hover:bg-gray-100" to="/admin/users">Users</RouterLink>
            <RouterLink class="block p-2 hover:bg-gray-100" to="/admin/transactions">Transactions</RouterLink>
            <RouterLink class="block p-2 hover:bg-gray-100" to="/admin/games">Games</RouterLink>
            <RouterLink class="block p-2 hover:bg-gray-100" to="/admin/admins">Create Admin</RouterLink>
          </li>
        </NavigationMenuContent>
      </NavigationMenuItem>


      <!-- Login / Logout -->
      <NavigationMenuItem v-if="!userLoggedIn">
        <NavigationMenuLink as-child>
          <RouterLink to="/login">Login</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-else>
        <NavigationMenuLink>
          <a @click.prevent="logout">Logout</a>
        </NavigationMenuLink>
      </NavigationMenuItem>

    </NavigationMenuList>
  </NavigationMenu>
</template>
