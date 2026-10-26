```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppLayout from '@/layouts/AppLayout.vue'
import GuestLayout from '@/components/guestnavbar.vue'

const route = useRoute()

const layout = computed(
  () => (route.meta.layout as string | undefined) ?? 'guest',
)
</script>

<template>
  <RouterView v-if="layout === 'bare'" />

  <component
    :is="layout === 'app' ? AppLayout : GuestLayout"
    v-else
  >
    <RouterView />
  </component>
</template>
```