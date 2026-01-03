<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import CoinWallet from '@/components/economy/CoinWallet.vue'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({ name: '', nickname: '', email: '' })
const readonlyFields = ref({ type: '', blocked: false, coins_balance: 0, deleted_at: null, custom: '' })
const deletePassword = ref('')
const photoFile = ref(null)
const photoPreview = ref(null)

const showPasswordModal = ref(false)
const passwordForm = ref({ password: '', password_confirmation: '' })

// Load user data
const loadUser = () => {
  const user = authStore.currentUser
  if (!user) return
  form.value.name = user.name
  form.value.nickname = user.nickname
  form.value.email = user.email
  readonlyFields.value = {
    type: user.type,
    blocked: user.blocked,
    coins_balance: user.coins_balance,
    deleted_at: user.deleted_at,
    custom: user.custom
  }
  photoPreview.value = user.photo_avatar_url
}

onMounted(loadUser)

// Keep preview in sync if user changes
watch(() => authStore.currentUser?.photo_avatar_url, (val) => {
  photoPreview.value = val
})

// Handle file select
const handlePhotoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

// Update profile (name, email, nickname, avatar)
const updateProfile = async () => {
  try {
    const payload = new FormData()
    payload.append('name', form.value.name)
    payload.append('nickname', form.value.nickname)
    payload.append('email', form.value.email)
    if (photoFile.value) payload.append('photo_avatar', photoFile.value)

    const updatedUser = await authStore.updateProfile(payload)
    toast.success('Profile updated!')
    photoFile.value = null
    photoPreview.value = updatedUser.photo_avatar_url
  } catch (err) {
    console.error(err)
    toast.error(err?.response?.data?.message || 'Error updating profile')
  }
}

// Update password
const updatePassword = async () => {
  if (!passwordForm.value.password || !passwordForm.value.password_confirmation) {
    return toast.error('Both fields are required')
  }
  try {
    const payload = new FormData()
    payload.append('password', passwordForm.value.password)
    payload.append('password_confirmation', passwordForm.value.password_confirmation)

    const updatedUser = await authStore.updateProfile(payload)
    toast.success('Password updated successfully!')
    passwordForm.value.password = ''
    passwordForm.value.password_confirmation = ''
    showPasswordModal.value = false

    // Refresh local user data
    loadUser()
  } catch (err) {
    console.error(err)
    toast.error(err?.response?.data?.message || 'Error updating password')
  }
}

// Delete account
const deleteAccount = async () => {
  if (!deletePassword.value) return toast.error('Password is required')
  try {
    await authStore.deleteAccount(deletePassword.value)
    toast.success('Account deleted.')
    await authStore.logout()
    router.push('/')
  } catch (err) {
    console.error(err)
    toast.error(err?.response?.data?.message || 'Error deleting account')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto p-5 border rounded-md mt-5 space-y-6">
    <h2 class="text-2xl font-bold text-center mb-4">Edit Profile</h2>

    <!-- Avatar + Form -->
    <div class="flex flex-col md:flex-row gap-6">
      <div class="flex flex-col items-center">
        <img :src="photoPreview" alt="Avatar" class="w-32 h-32 rounded-full object-cover" />
        <input type="file" @change="handlePhotoChange" class="mt-2" />
      </div>

      <form @submit.prevent="updateProfile" class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input v-model="form.name" placeholder="Name" class="border p-2 rounded w-full" />
        <input v-model="form.nickname" placeholder="Nickname" class="border p-2 rounded w-full" />
        <input v-model="form.email" type="email" placeholder="Email" class="border p-2 rounded w-full" />

        <div class="md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-2">
          <button type="submit" class="bg-blue-500 text-white p-3 rounded hover:bg-blue-600 w-full md:w-auto">
            Save Changes
          </button>
          <button type="button" @click="showPasswordModal = true"
            class="bg-gray-200 text-gray-800 p-3 rounded hover:bg-gray-300 w-full md:w-auto">
            Change Password
          </button>
        </div>
      </form>
    </div>

    <!-- Read-only + Coins -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <h3 class="font-semibold mb-2">Account Details</h3>
        <div><strong>Type:</strong> {{ readonlyFields.type }}</div>
        <div><strong>Blocked:</strong> {{ readonlyFields.blocked ? 'Yes' : 'No' }}</div>
        <div><strong>Deleted At:</strong> {{ readonlyFields.deleted_at || 'Not deleted' }}</div>
        <div><strong>Custom:</strong> {{ readonlyFields.custom }}</div>
      </div>

      <div class="bg-gray-50 p-4 rounded shadow-sm flex flex-col justify-between space-y-4">
        <h3 class="font-semibold mb-2">Coins</h3>
        <div class="text-2xl font-bold text-center">{{ readonlyFields.coins_balance }} 💰</div>
        <CoinWallet />
      </div>
    </div>

    <!-- Transactions -->
    <div class="text-center">
      <router-link to="/profile/transactions">
        <button class="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded shadow">
          View Transaction History
        </button>
      </router-link>
    </div>

    <!-- Delete Account -->
    <div class="bg-red-50 p-4 rounded border border-red-200 space-y-3">
      <h3 class="text-lg font-semibold text-red-600">Delete Account</h3>
      <form @submit.prevent="deleteAccount" class="flex flex-col gap-3">
        <input v-model="deletePassword" type="password" placeholder="Confirm with your password"
          class="border p-2 rounded w-full" />
        <button type="submit" class="bg-red-500 text-white p-3 rounded hover:bg-red-600 w-full">
          Delete Account
        </button>
      </form>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div class="bg-white rounded p-6 w-full max-w-md shadow-lg space-y-4">
        <h3 class="text-lg font-semibold">Change Password</h3>
        <input v-model="passwordForm.password" type="password" placeholder="New Password"
          class="border p-2 rounded w-full" />
        <input v-model="passwordForm.password_confirmation" type="password" placeholder="Confirm Password"
          class="border p-2 rounded w-full" />
        <div class="flex justify-end gap-2">
          <button @click="showPasswordModal = false" class="px-4 py-2 rounded border hover:bg-gray-100">Cancel</button>
          <button @click="updatePassword"
            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">Update</button>
        </div>
      </div>
    </div>
  </div>
</template>
