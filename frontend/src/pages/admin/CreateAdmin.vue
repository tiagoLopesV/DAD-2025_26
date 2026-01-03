<script setup>
import { ref } from 'vue'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()

// Form fields
const email = ref('')
const nickname = ref('')
const name = ref('')
const password = ref('')

// Feedback
const loading = ref(false)
const error = ref('')
const success = ref('')

const createAdmin = async () => {
    error.value = ''
    success.value = ''
    loading.value = true

    try {
        await admin.createAdmin({
            email: email.value,
            nickname: nickname.value,
            name: name.value,
            password: password.value,
        })

        // Clear form
        email.value = ''
        nickname.value = ''
        name.value = ''
        password.value = ''

        success.value = 'Admin created successfully!'
    } catch (err) {
        console.log('Raw error:', err) // <-- add this
        if (err.response?.data?.message) {
            error.value = err.response.data.message
        } else if (err.response?.data?.errors) {
            const messages = Object.values(err.response.data.errors)
            error.value = messages.flat().join(' ')
        } else {
            // fallback
            error.value = err.message || 'An unexpected error occurred.'
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div>
        <h2 class="text-xl font-bold mb-4">Create Admin</h2>

        <form @submit.prevent="createAdmin" class="flex flex-col gap-2 max-w-md">
            <input v-model="name" placeholder="Name" required class="border rounded px-2 py-1" />
            <input v-model="nickname" placeholder="Nickname" required class="border rounded px-2 py-1" />
            <input v-model="email" type="email" placeholder="Email" required class="border rounded px-2 py-1" />
            <input v-model="password" type="password" placeholder="Password" required
                class="border rounded px-2 py-1" />

            <button type="submit" :disabled="loading" class="px-3 py-1 bg-blue-600 text-white rounded mt-2">
                {{ loading ? 'Creating...' : 'Create Admin' }}
            </button>

            <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>
            <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
        </form>
    </div>
</template>
