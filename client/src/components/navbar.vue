```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from './Button.vue'
defineProps<{
  links: { name: string; to: string }[]
  showLogout?: boolean
}>()

defineEmits<{
  (e: 'logout'): void
}>()

const open = ref(false)
</script>

<template>
  <div
    class="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-2 py-2"
  >
    <RouterLink to="/" class="text-xl font-semibold whitespace-nowrap">
      Deploy Craft
    </RouterLink>

    <Button
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-300 hover:bg-gray-800 md:hidden"
      :aria-expanded="open"
      aria-label="Toggle navigation menu"
      @click="open = !open"
    >
      ☰
  </Button>

    <div :class="[open ? 'block' : 'hidden', 'w-full md:block md:w-auto']">
      <ul class="mt-4 flex flex-col gap-1 md:mt-0 md:flex-row md:items-center md:gap-6">
        <li v-for="item in links" :key="item.to">
          <RouterLink
            :to="item.to"
            class="block rounded px-3 py-2 text-gray-300 hover:text-white md:p-0"
            active-class="text-white"
            @click="open = false"
          >
            {{ item.name }}
          </RouterLink>
        </li>

        <li v-if="showLogout">
          <Button
            type="button"
            class="block w-full rounded px-3 py-2 text-left text-red-400 hover:text-red-300 md:w-auto md:p-0"
            @click="$emit('logout')"
          >
            Log out
        </Button>
        </li>
      </ul>
    </div>
  </div>
</template>
```