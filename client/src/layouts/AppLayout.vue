```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/navbar.vue'

const { logout } = useAuth()
const router = useRouter()

const links = [
  { name: 'Dashboard', to: '/dashboard' },
  { name: 'Deployments', to: '/deployments' },
]

async function handleLogout() {
  try {
    await logout()
  } finally {
    await router.push('/login')
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-950 text-gray-100">
    <header class="border-b border-gray-800 bg-gray-900 px-2 py-2 text-sm">
      <Navbar
        :links="links"
        :show-logout="true"
        @logout="handleLogout"
      />
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 p-6">
      <slot />
    </main>
  </div>
</template>
```