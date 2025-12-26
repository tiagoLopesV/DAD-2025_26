<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const authStore = useAuthStore();
const router = useRouter();

const form = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const readonlyFields = ref({
  type: '',
  blocked: false,
  photo_avatar_filename: '',
  coins_balance: 0,
  deleted_at: null,
  custom: ''
});

const deletePassword = ref('');
const photoFile = ref(null); // selected photo

onMounted(() => {
  const user = authStore.currentUser;
  if (user) {
    form.value.name = user.name;
    form.value.nickname = user.nickname;
    form.value.email = user.email;

    readonlyFields.value.type = user.type;
    readonlyFields.value.blocked = user.blocked;
    readonlyFields.value.photo_avatar_filename = user.photo_avatar_filename;
    readonlyFields.value.coins_balance = user.coins_balance;
    readonlyFields.value.deleted_at = user.deleted_at;
    readonlyFields.value.custom = user.custom;
  }
});

const updateProfile = async () => {
  try {
    const payload = new FormData()
    payload.append('name', form.value.name)
    payload.append('nickname', form.value.nickname)
    payload.append('email', form.value.email)
    if (form.value.password) {
      payload.append('password', form.value.password)
      payload.append('password_confirmation', form.value.password_confirmation)
    }
    if (photoFile.value) {
      payload.append('photo_avatar', photoFile.value)
    }

    const response = await authStore.updateProfile(payload)
    readonlyFields.value.photo_avatar_filename = response.photo_avatar_filename
    toast.success('Profile updated successfully!')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error updating profile')
  }
}


const deleteAccount = async () => {
  if (!deletePassword.value) return toast.error('Password is required');

  try {
    await authStore.deleteAccount(deletePassword.value);
    toast.success('Account deleted. Redirecting...');
    await authStore.logout();
    router.push('/');
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error deleting account');
  }
}

const handlePhotoChange = (e) => {
  photoFile.value = e.target.files[0];
}
</script>

<template>
  <div class="max-w-md m-auto p-5 border rounded-md mt-5">
    <h2 class="text-xl mb-4">Edit Profile</h2>

    <!-- Profile Image -->
    <div class="mb-4">
      <img :src="readonlyFields.photo_avatar_filename
        ? `/storage/photos/${readonlyFields.photo_avatar_filename}`
        : `/storage/photos/anonymous.png`" alt="Avatar" class="w-24 h-24 rounded-full object-cover" />
      <input type="file" @change="handlePhotoChange" class="mt-2" />
    </div>

    <!-- Editable fields -->
    <form @submit.prevent="updateProfile" class="flex flex-col gap-3">
      <input v-model="form.name" placeholder="Name" class="border p-2 rounded" />
      <input v-model="form.nickname" placeholder="Nickname" class="border p-2 rounded" />
      <input v-model="form.email" type="email" placeholder="Email" class="border p-2 rounded" />
      <input v-model="form.password" type="password" placeholder="New Password" class="border p-2 rounded" />
      <input v-model="form.password_confirmation" type="password" placeholder="Confirm Password"
        class="border p-2 rounded" />
      <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        Save Changes
      </button>
    </form>

    <hr class="my-4" />

    <!-- Read-only fields -->
    <h3 class="text-lg mb-2">Account Details</h3>
    <div class="flex flex-col gap-2">
      <div><strong>Type:</strong> {{ readonlyFields.type }}</div>
      <div><strong>Blocked:</strong> {{ readonlyFields.blocked ? 'Yes' : 'No' }}</div>
      <div><strong>Coins Balance:</strong> {{ readonlyFields.coins_balance }}</div>
      <div><strong>Deleted At:</strong> {{ readonlyFields.deleted_at || 'Not deleted' }}</div>
      <div><strong>Custom:</strong> {{ readonlyFields.custom }}</div>
    </div>

    <hr class="my-4" />

    <!-- Delete Account Form -->
    <h3 class="text-lg mb-2">Delete Account</h3>
    <form @submit.prevent="deleteAccount" class="flex flex-col gap-3">
      <input v-model="deletePassword" type="password" placeholder="Confirm with your password"
        class="border p-2 rounded" />
      <button type="submit" class="bg-red-500 text-white p-2 rounded hover:bg-red-600">
        Delete Account
      </button>
    </form>
  </div>
</template>
