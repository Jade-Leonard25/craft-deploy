```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Github,
  Rocket,
  FolderGit2,
  ArrowUpRight,
  LoaderCircle,
  Plus,
  AlertCircle,
  Clock3,
  Code2,
} from 'lucide-vue-next'

import { API_URL } from '@/config'
import { useAuth } from '@/composables/useAuth'

import StatusBadge from '@/components/StatusBadge.vue'
import Button from '@/components/Button.vue'
import Input from '@/components/Input.vue'

import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/Card.vue'

interface Deployment {
  id: string
  projectName: string
  status: string
  createdAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    message?: string
  }
}

const deployments = ref<Deployment[]>([])
const loading = ref(true)
const isCreating = ref(false)

const projectName = ref('')
const repoUrl = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const { token } = useAuth()
const router = useRouter()

const exampleRepo =
  'https://github.com/Jade-Leonard25/testing-deployments.git'

const fetchDeployments = async () => {
  loading.value = true

  try {
    const res = await fetch(`${API_URL}/deployments`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    const data: ApiResponse<Deployment[]> = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(
        data.error?.message || 'Failed to load deployments.',
      )
    }

    deployments.value = data.data
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'Unable to load deployments.'
  } finally {
    loading.value = false
  }
}

const handleRepo = () => {
  if (!projectName.value.trim()) {
    projectName.value = 'example-app'
  }

  repoUrl.value = exampleRepo
  errorMessage.value = ''
  successMessage.value = 'Example repository added.'
}

const createDeployment = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const name = projectName.value.trim()
  const repository = repoUrl.value.trim()

  if (!name || !repository) {
    errorMessage.value =
      'Please provide both a project name and repository URL.'
    return
  }

  try {
    const parsedUrl = new URL(repository)

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'github.com'
    ) {
      errorMessage.value =
        'Please enter a valid HTTPS GitHub repository URL.'
      return
    }

    if (parsedUrl.pathname.split('/').filter(Boolean).length < 2) {
      errorMessage.value =
        'The URL must include a GitHub username and repository name.'
      return
    }
  } catch {
    errorMessage.value = 'Please enter a valid repository URL.'
    return
  }

  isCreating.value = true

  try {
    const res = await fetch(`${API_URL}/deployments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        projectName: name,
        sourceType: 'github',
        repoUrl: repository,
      }),
    })

    const data: ApiResponse<Deployment> = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(
        data.error?.message || 'Failed to create deployment.',
      )
    }

    projectName.value = ''
    repoUrl.value = ''

    await router.push(`/deployments/${data.data.id}`)
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'Something went wrong while creating the deployment.'
  } finally {
    isCreating.value = false
  }
}

const openDeployment = (id: string) => {
  router.push(`/deployments/${id}`)
}

const formatDate = (date: string) => {
  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

onMounted(fetchDeployments)
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <div class="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">

      <!-- Page heading -->
      <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <Code2 class="size-4" />
            <span>Developer workspace</span>
          </div>

          <h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Deployments
          </h1>

          <p class="max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
            Build, deploy, and manage your projects from one place.
          </p>
        </div>

        <div class="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3">
          <div class="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Rocket class="size-5 text-emerald-400" />
          </div>

          <div>
            <p class="text-sm font-semibold text-white">
              Your workspace
            </p>
            <p class="text-xs text-gray-400">
              {{ deployments.length }} project{{ deployments.length === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
      </header>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
      >
        <AlertCircle class="mt-0.5 size-5 shrink-0" />

        <div class="flex-1">
          {{ errorMessage }}
        </div>

        <button
          type="button"
          class="text-red-300 transition hover:text-white"
          aria-label="Dismiss error"
          @click="errorMessage = ''"
        >
          &times;
        </button>
      </div>

      <!-- Success message -->
      <div
        v-if="successMessage"
        role="status"
        class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
      >
        {{ successMessage }}
      </div>

      <!-- Create deployment -->
      <Card class="overflow-hidden border border-gray-800 bg-gray-900 text-gray-100 shadow-xl shadow-black/10">
        <CardHeader class="border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-900/50 px-6 py-6 sm:px-8">
          <div class="flex items-start gap-4">
            <div class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
              <Rocket class="size-6 text-violet-300" />
            </div>

            <div class="min-w-0">
              <CardTitle class="text-xl font-semibold text-white">
                Create a new deployment
              </CardTitle>

              <CardDescription class="mt-2 leading-6 text-gray-400">
                Connect a GitHub repository and start deploying your project.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent class="p-6 sm:p-8">
          <form class="space-y-6" @submit.prevent="createDeployment">

            <!-- Project name -->
            <div class="space-y-2">
              <label
                for="project-name"
                class="text-sm font-medium text-gray-200"
              >
                Project name
              </label>

              <Input
                id="project-name"
                v-model="projectName"
                placeholder="my-awesome-project"
                class="w-full border-gray-700 bg-gray-950 text-white placeholder:text-gray-600 focus-visible:ring-violet-500"
                :disabled="isCreating"
                required
              />

              <p class="text-xs leading-5 text-gray-500">
                Choose a name that helps you identify your application.
              </p>
            </div>

            <!-- GitHub repository -->
            <div class="space-y-2">
              <label
                for="repository-url"
                class="text-sm font-medium text-gray-200"
              >
                GitHub repository URL
              </label>

              <div class="flex flex-col gap-3 sm:flex-row">
                <div class="relative min-w-0 flex-1">
                  <Github
                    class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-500"
                  />

                  <Input
                    id="repository-url"
                    v-model="repoUrl"
                    placeholder="https://github.com/username/repository"
                    class="w-full border-gray-700 bg-gray-950 pl-10 text-white placeholder:text-gray-600 focus-visible:ring-violet-500"
                    :disabled="isCreating"
                    type="url"
                    required
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  class="shrink-0 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  :disabled="isCreating"
                  @click="handleRepo"
                >
                  <Github class="mr-2 size-4" />
                  Use example repo
                </Button>
              </div>

              <p class="text-xs leading-5 text-gray-500">
                Enter a repository URL that your deployment service can access.
                Private repositories may require additional authorization.
              </p>
            </div>

            <!-- Form actions -->
            <div class="flex flex-col gap-4 border-t border-gray-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span class="size-2 rounded-full bg-emerald-400"></span>
                GitHub repository deployment
              </div>

              <Button
                type="submit"
                variant="default"
                class="w-full bg-violet-600 text-white hover:bg-violet-500 sm:w-auto"
                :disabled="isCreating || !projectName.trim() || !repoUrl.trim()"
              >
                <LoaderCircle
                  v-if="isCreating"
                  class="mr-2 size-4 animate-spin"
                />

                <Rocket v-else class="mr-2 size-4" />

                {{ isCreating ? 'Creating deployment...' : 'Deploy project' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Deployment list heading -->
      <section class="space-y-5">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 class="text-xl font-semibold tracking-tight text-white">
              Your projects
            </h2>

            <p class="mt-1 text-sm text-gray-400">
              View the status and activity of your deployments.
            </p>
          </div>

          <Button
            variant="ghost"
            class="self-start text-gray-300 hover:bg-gray-800 hover:text-white sm:self-auto"
            :disabled="loading"
            @click="fetchDeployments"
          >
            <LoaderCircle
              v-if="loading"
              class="mr-2 size-4 animate-spin"
            />
            <Clock3 v-else class="mr-2 size-4" />

            {{ loading ? 'Refreshing...' : 'Refresh projects' }}
          </Button>
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          class="grid gap-4 sm:grid-cols-2"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="animate-pulse rounded-xl border border-gray-800 bg-gray-900 p-5"
          >
            <div class="mb-5 flex items-center gap-3">
              <div class="size-10 rounded-lg bg-gray-800"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-32 rounded bg-gray-800"></div>
                <div class="h-3 w-24 rounded bg-gray-800"></div>
              </div>
            </div>
            <div class="h-5 w-20 rounded bg-gray-800"></div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="deployments.length === 0"
          class="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-14 text-center"
        >
          <div class="mx-auto flex size-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <FolderGit2 class="size-7 text-gray-400" />
          </div>

          <h3 class="mt-5 text-lg font-semibold text-white">
            No deployments yet
          </h3>

          <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-400">
            Your projects will appear here after you create your first deployment.
            Start by connecting a GitHub repository above.
          </p>

          <Button
            variant="outline"
            class="mt-6 border-gray-700 text-gray-200 hover:bg-gray-800"
            @click="handleRepo"
          >
            <Plus class="mr-2 size-4" />
            Try the example repository
          </Button>
        </div>

        <!-- Project cards -->
        <div
          v-else
          class="grid gap-4 sm:grid-cols-2"
        >
          <button
            v-for="dep in deployments"
            :key="dep.id"
            type="button"
            class="group w-full rounded-xl border border-gray-800 bg-gray-900 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-violet-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            @click="openDeployment(dep.id)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 transition group-hover:border-violet-500/30 group-hover:bg-violet-500/10">
                  <FolderGit2 class="size-5 text-gray-400 transition group-hover:text-violet-300" />
                </div>

                <div class="min-w-0">
                  <h3 class="truncate font-semibold text-white">
                    {{ dep.projectName }}
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    Project deployment
                  </p>
                </div>
              </div>

              <ArrowUpRight class="size-5 shrink-0 text-gray-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-300" />
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <Clock3 class="size-3.5" />
                <span>{{ formatDate(dep.createdAt) }}</span>
              </div>

              <StatusBadge :status="dep.status" />
            </div>

            <div class="mt-4 flex items-center gap-1.5 text-xs font-medium text-gray-500 transition group-hover:text-violet-300">
              View deployment details
              <ArrowUpRight class="size-3.5" />
            </div>
          </button>
        </div>
      </section>

      <!-- Footer note -->
      <footer class="border-t border-gray-800 pt-5">
        <p class="text-center text-xs leading-5 text-gray-500">
          Deployment status is provided by your backend service.
          Build and runtime availability depend on your deployment infrastructure.
        </p>
      </footer>

    </div>
  </div>
</template>
```