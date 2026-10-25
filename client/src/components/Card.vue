<script lang="ts">
import { defineComponent, h } from 'vue'
import { cn } from '@/utils' // 👈 Import cn ONCE here

export const CardHeader = defineComponent({
  name: 'CardHeader',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: cn('flex flex-col gap-1.5 px-6', attrs.class) }, slots.default?.())
  }
})

export const CardTitle = defineComponent({
  name: 'CardTitle',
  setup(_, { slots, attrs }) {
    return () => h('h3', { class: cn('leading-none font-semibold tracking-tight text-xl text-white', attrs.class) }, slots.default?.())
  }
})

export const CardDescription = defineComponent({
  name: 'CardDescription',
  setup(_, { slots, attrs }) {
    return () => h('p', { class: cn('text-gray-400 text-sm', attrs.class) }, slots.default?.())
  }
})

export const CardContent = defineComponent({
  name: 'CardContent',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: cn('px-6', attrs.class) }, slots.default?.())
  }
})

export const CardFooter = defineComponent({
  name: 'CardFooter',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: cn('flex items-center px-6', attrs.class) }, slots.default?.())
  }
})
</script>

<script setup lang="ts">
// 👈 Removed the import of `cn` here because it's already imported in the script block above!
const props = defineProps<{ class?: any }>()
</script>

<template>
  <div :class="cn('bg-gray-900 text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-800 py-6 shadow-sm', props.class)">
    <slot />
  </div>
</template>