```vue
<script setup lang="ts">
import Navbar from '@/components/navbar.vue'
import { useAuth } from '@/composables/useAuth'

const { isLoggedIn } = useAuth()

const guestLinks = [
  { name: 'Generate account', to: '/generate-account' },
  { name: 'Sign Up', to: '/signup' },
  { name: 'Login', to: '/login' },
]

const authenticatedLinks = [
  { name: 'Dashboard', to: '/dashboard' },
  { name: 'Deployments', to: '/deployments' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <header class="border-b border-gray-800 bg-gray-900 px-2 py-2 text-sm">
      <Navbar
        :links="isLoggedIn ? authenticatedLinks : guestLinks"
        :show-logout="false"
      />
    </header>

    <main class="w-full">
      <slot />
    </main>
  </div>
</template>
```