<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_URL } from '@/config'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()

const handleSignup = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_URL}/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email.value, 
        password: password.value,
        confirmPassword: confirmPassword.value
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Signup failed')
    
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto mt-20 p-8 bg-gray-900 rounded-xl border border-gray-800">
    <h2 class="text-2xl font-bold mb-6 text-center">Create Account</h2>
    <form @submit.prevent="handleSignup" class="space-y-4">
      <div v-if="error" class="text-red-400 text-sm bg-red-900/20 p-2 rounded">{{ error }}</div>
      <div>
        <label class="block text-sm text-gray-400 mb-1">Email</label>
        <input v-model="email" type="email" required class="w-full bg-gray-950 border border-gray-800 rounded p-2 focus:border-blue-500 outline-none text-gray-200" />
      </div>
      <div>
        <label class="block text-sm text-gray-400 mb-1">Password</label>
        <input v-model="password" type="password" required class="w-full bg-gray-950 border border-gray-800 rounded p-2 focus:border-blue-500 outline-none  text-gray-200" />
      </div>
      <div>
        <label class="block text-sm text-gray-400 mb-1">Confirm Password</label>
        <input v-model="confirmPassword" type="password" required class="w-full bg-gray-950 border border-gray-800 rounded p-2 focus:border-blue-500 outline-none  text-gray-200" />
      </div>
      <button :disabled="loading" type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2 rounded transition disabled:opacity-50">
        {{ loading ? 'Creating...' : 'Sign Up' }}
      </button>
    </form>
    <p class="text-center text-sm text-gray-500 mt-4">
      Already have an account? <RouterLink to="/login" class="text-blue-400 hover:underline">Sign in</RouterLink>
    </p>
    <p class="text-center text-sm text-gray-500 mt-4"> 

      <RouterLink to="/generate-account" class="text-blue-400 hover:underline">
        You dont want to create, generate one account now!
      </RouterLink>
    </p>
  </div>
</template>
