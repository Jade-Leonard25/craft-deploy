<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Button from './components/Button.vue'

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
    <header class="border-b border-gray-800 bg-gray-900 p-4">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold text-white tracking-tight">DeployCraft</h1>
        <Button 
          v-if="token" 
          @click="handleLogout"
          
          class="hover:bg-border-2 hover:bg-border-gray-900 rounded "
        >
          Logout
      </Button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto p-4">
      <RouterView />
    </main>
  </div>
</template>