```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        default: 'size-10',
        sm: 'size-8',
        lg: 'size-12',
        xl: 'size-16',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

type AvatarVariants = VariantProps<typeof avatarVariants>

const props = defineProps<{
  src?: string
  alt?: string
  fallback?: string
  size?: AvatarVariants['size']
  class?: string
}>()

const imageError = ref(false)

watch(
  () => props.src,
  () => {
    imageError.value = false
  },
)

const classes = computed(() =>
  cn(avatarVariants({ size: props.size }), props.class),
)

const initials = computed(() => {
  const name = props.fallback?.trim()

  if (!name) return '?'

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
})
</script>

<template>
  <span :class="classes" role="img" :aria-label="alt || fallback || 'Avatar'">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt || fallback || 'Avatar'"
      class="aspect-square size-full object-cover"
      @error="imageError = true"
    />

    <span
      v-else
      class="flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      aria-hidden="true"
    >
      {{ initials }}
    </span>
  </span>
</template>
```