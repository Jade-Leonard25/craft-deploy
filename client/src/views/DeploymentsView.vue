<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_URL } from '@/config'
import { useAuth } from '@/composables/useAuth'
import StatusBadge from '@/components/StatusBadge.vue'
import Button from '@/components/Button.vue'
import Input from '@/components/Input.vue'
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/Card.vue'

const deployments = ref<any[]>([])
const loading = ref(true)
const isCreating = ref(false)
const projectName = ref('')
const repoUrl = ref('')
const { token } = useAuth()
const router = useRouter()

const fetchDeployments = async () => {
  try {
    const res = await fetch(`${API_URL}/deployments`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    const data = await res.json()
    if (data.success) deployments.value = data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const createDeployment = async () => {
  if (!projectName.value) return
  isCreating.value = true
  try {
    const res = await fetch(`${API_URL}/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      },
      body: JSON.stringify({ projectName: projectName.value, sourceType: 'github', repoUrl: repoUrl.value })
    })
    const data = await res.json()
    if (data.success) {
      projectName.value = ''
      await fetchDeployments()
      router.push(`/deployments/${data.data.id}`)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isCreating.value = false
  }
}

onMounted(fetchDeployments)
</script>

<template>
  <div class="space-y-6">
    <!-- Create Form Card -->
    <Card>
      <CardHeader>
        <CardTitle>New Project</CardTitle>
        <CardDescription>Enter a name for your new deployment.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <Input v-model="projectName" placeholder="my-awesome-app" />
            <Input v-model="repoUrl" placeholder="https://github.com/user/repo.git" />
          </div>
          <Button @click="createDeployment" :disabled="isCreating || !projectName || !repoUrl" variant="default">
            {{ isCreating ? 'Deploying...' : 'Deploy' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- List of Deployments -->
    <div v-if="loading" class="text-center py-10 text-gray-500">
      Loading deployments...
    </div>

    <div v-else-if="deployments.length === 0" class="text-center py-10 text-gray-500">
      No deployments yet. Create one above!
    </div>

    <div v-else class="grid gap-3">
      <div v-for="dep in deployments" :key="dep.id" @click="router.push(`/deployments/${dep.id}`)"
        class="bg-gray-900 p-4 rounded-lg border border-gray-800 hover:border-gray-600 cursor-pointer transition flex justify-between items-center">
        <div>
          <h3 class="font-bold">{{ dep.projectName }}</h3>
          <p class="text-xs text-gray-500">{{ new Date(dep.createdAt).toLocaleString() }}</p>
        </div>
        <StatusBadge :status="dep.status" />
      </div>
    </div>
  </div>
</template>