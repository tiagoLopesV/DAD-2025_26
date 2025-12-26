<template>
  <div class="max-w-md m-auto p-5 border rounded-md mt-5">
    <h2 class="text-xl mb-4">Edit Profile</h2>

    <form @submit.prevent="updateProfile" class="flex flex-col gap-3">

      <input v-model="form.name" placeholder="Name" class="border p-2 rounded" />
      <input v-model="form.nickname" placeholder="Nickname" class="border p-2 rounded" />
      <input v-model="form.email" type="email" placeholder="Email" class="border p-2 rounded" />

      <input v-model="form.password" type="password" placeholder="New Password" class="border p-2 rounded" />
      <input v-model="form.password_confirmation" type="password" placeholder="Confirm Password" class="border p-2 rounded" />

      <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        Save Changes
      </button>
    </form>

    <hr class="my-4" />

    <h3 class="text-lg mb-2">Delete Account</h3>
    <form @submit.prevent="deleteAccount" class="flex flex-col gap-3">
      <input v-model="deletePassword" type="password" placeholder="Confirm with your password" class="border p-2 rounded" />
      <button type="submit" class="bg-red-500 text-white p-2 rounded hover:bg-red-600">
        Delete Account
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';

const authStore = useAuthStore();

const form = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const deletePassword = ref('');

onMounted(() => {
  if (authStore.currentUser) {
    form.value.name = authStore.currentUser.name;
    form.value.nickname = authStore.currentUser.nickname;
    form.value.email = authStore.currentUser.email;
  }
});

const updateProfile = async () => {
  try {
    await authStore.updateProfile(form.value);
    toast.success('Profile updated successfully!');
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error updating profile');
  }
};

const deleteAccount = async () => {
  if (!deletePassword.value) return toast.error('Password is required');

  try {
    await authStore.deleteAccount(deletePassword.value);
    toast.success('Account deleted. Logging out...');
    await authStore.logout();
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error deleting account');
  }
};
</script>
