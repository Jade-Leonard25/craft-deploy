<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Button from './components/Button.vue'
import navbar from './components/navbar.vue'
const { logout, token } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<!-- 👇 Make sure there is no 'i' or other character right before this tag -->
<template>
  <div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
    <header class="border-b border-gray-800 bg-gray-900 py-2 px-2 text-sm">
        <navbar /> 
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto p-4">
      <RouterView />
    </main>
  </div>
</template>
