<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_URL } from '@/config'
import { useAuth } from '@/composables/useAuth'
import StatusBadge from '@/components/StatusBadge.vue'
import DeployTerminal from '@/components/DeployTerminal.vue'




import Button from '@/components/Button.vue'
import Card, { 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/Card.vue'

const route = useRoute()
const router = useRouter()
const { token } = useAuth()
const deploymentId = route.params.id as string

const deployment = ref<any>(null)
const loading = ref(true)
let pollInterval: ReturnType<typeof setInterval>

const fetchDeployment = async () => {
  try {
    const res = await fetch(`${API_URL}/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    if (!res.ok) {
      clearInterval(pollInterval)
      return
    }
    const data = await res.json()
    if (data.success) {
      deployment.value = data.data
      if (data.data.status === 'active' || data.data.status === 'failed') {
        clearInterval(pollInterval)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  await fetchDeployment()
  loading.value = false
  pollInterval = setInterval(fetchDeployment, 3000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Area -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button @click="router.push('/deployments')" variant="ghost" size="sm">
          &larr; Back
        </Button>
        <h2 class="text-sm font-bold truncate max-w-lg">
          {{ deployment?.projectName || 'Loading...' }}
        </h2>
        <StatusBadge v-if="deployment" :status="deployment.status" />
      </div>

      <!-- Visit Link (Only shows if active) -->
      <a 
        v-if="deployment?.status === 'active'" 
        :href="`http://${deployment.id}.localhost:4002`" 
        target="_blank"
      >
        <Button variant="default">
          Visit Deployment ↗
        </Button>
      </a>
    </div>

    <!-- Terminal Card -->
    <Card v-if="!loading && deployment" class="p-0 overflow-hidden bg-[#0f172a] border-gray-800">
      <CardHeader class="border-b border-gray-800 bg-gray-900/50 p-4">
        <CardTitle class="text-sm font-mono text-gray-300">Build Logs</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <DeployTerminal :deployment-id="deploymentId" />
      </CardContent>
    </Card>
  </div>
</template>