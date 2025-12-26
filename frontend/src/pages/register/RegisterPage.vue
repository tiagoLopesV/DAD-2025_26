<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const submit = async () => {
  try {
    await toast.promise(auth.register(form.value), {
      loading: 'Registering user...',
      success: 'Registration successful!',
      error: (err) => `Registration failed: ${err?.response?.data?.message || err.message}`,
    })

    // Redirect after success
    router.push('/')  // or router.push('/login') if you have a separate login page
  } catch (error) {
    console.error('Registration error:', error)
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="max-w-md mx-auto flex flex-col gap-3">
    <input v-model="form.name" placeholder="Name" class="p-2 border rounded" />
    <input v-model="form.nickname" placeholder="Nickname" class="p-2 border rounded" />
    <input v-model="form.email" placeholder="Email" class="p-2 border rounded" />
    <input v-model="form.password" type="password" placeholder="Password" class="p-2 border rounded" />
    <input v-model="form.password_confirmation" type="password" placeholder="Confirm Password" class="p-2 border rounded" />
    <button type="submit" class="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Register</button>
  </form>
</template>
