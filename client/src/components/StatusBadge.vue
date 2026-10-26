<script setup lang="ts">
import { computed } from 'vue'
import Button from './Button.vue';
const props = defineProps<{
  status: string
}>()

const classes = computed(() => {
  switch (props.status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'building': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
    case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20'
    default: return 'bg-gray-500/10 text-gray-400'
  }
})
</script>

<template>
  <Button :class="['px-2.5 py-1 text-xs font-medium rounded-full border', classes]" variant="ghost">
    {{ status.toUpperCase() }}
  </Button>
</template>
