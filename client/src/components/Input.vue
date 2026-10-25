<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/utils'

// Inherit attributes to pass them directly to the <input> tag (e.g., placeholder, type, @keydown)
defineOptions({
  inheritAttrs: false
})

const props = defineProps<{
  modelValue?: string | number
  class?: any
  type?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const attrs = useAttrs()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const classes = computed(() =>
  cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    props.class
  )
)
</script>

<template>
  <input
    :type="type || 'text'"
    :class="classes"
    :value="modelValue"
    @input="handleInput"
    v-bind="attrs"
  />
</template>