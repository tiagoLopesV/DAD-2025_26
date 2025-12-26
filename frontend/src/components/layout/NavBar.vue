<template>
  <div>
    <NavigationMenu>
      <NavigationMenuList class="justify-around gap-20">
        
        <!-- Testing Dropdown -->
        <NavigationMenuItem>
          <NavigationMenuTrigger>Testing</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <RouterLink to="/testing/laravel">Laravel</RouterLink>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <RouterLink to="/testing/websockets">Web Sockets</RouterLink>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <!-- Profile Link (logged-in only) -->
        <NavigationMenuItem v-if="userLoggedIn">
          <NavigationMenuLink as-child>
            <RouterLink to="/profile">Profile</RouterLink>
          </NavigationMenuLink>
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
  </div>
</template>

<script setup>
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

const { userLoggedIn } = defineProps(['userLoggedIn'])
const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  try {
    await authStore.logout()
    router.push({ name: 'login' })  // redirect to login page
  } catch (err) {
    console.error('Logout failed:', err)
  }
}
</script>
