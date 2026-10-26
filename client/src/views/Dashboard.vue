```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  LayoutDashboard,
  Rocket,
  FolderGit2,
  Activity,
  CircleCheck,
  Hammer,
  AlertCircle,
  Search,
  Plus,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  RefreshCw,
  Layers3,
} from 'lucide-vue-next'

import { useAuth } from '@/composables/useAuth'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
import Input from '@/components/Input.vue'
import StatusBadge from '@/components/StatusBadge.vue'

interface Deployment {
  id: string
  projectName: string
  status: string
  createdAt: string
}

const router = useRouter()
const { authFetch, logout, user } = useAuth()

const deployments = ref<Deployment[]>([])
const loading = ref(true)
const search = ref('')
const sidebarOpen = ref(true)
const mobileMenuOpen = ref(false)
const errorMessage = ref('')

const nav = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Deployments',
    to: '/deployments',
    icon: Rocket,
  },
]

const stats = computed(() => {
  const count = (status: string) =>
    deployments.value.filter(
      (deployment) => deployment.status === status,
    ).length

  return [
    {
      label: 'Total Projects',
      value: deployments.value.length,
      note: 'All your deployments',
      icon: Layers3,
      color: 'text-violet-400',
      background: 'bg-violet-500/10',
    },
    {
      label: 'Live',
      value: count('active'),
      note: 'Successfully deployed',
      icon: CircleCheck,
      color: 'text-emerald-400',
      background: 'bg-emerald-500/10',
    },
    {
      label: 'Building',
      value: count('pending') + count('building'),
      note: 'Queued or in progress',
      icon: Hammer,
      color: 'text-amber-400',
      background: 'bg-amber-500/10',
    },
    {
      label: 'Failed',
      value: count('failed'),
      note: 'Require your attention',
      icon: AlertCircle,
      color: 'text-red-400',
      background: 'bg-red-500/10',
    },
  ]
})

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return deployments.value

  return deployments.value.filter((deployment) =>
    deployment.projectName.toLowerCase().includes(query),
  )
})

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

async function load() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await authFetch('/deployments')

    if (!response.ok) {
      throw new Error(
        `Unable to load deployments (HTTP ${response.status}).`,
      )
    }

    const data = await response.json()

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(
        data.error?.message || 'Invalid deployments response.',
      )
    }

    deployments.value = data.data
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Something went wrong while loading deployments.'
  } finally {
    loading.value = false
  }
}

async function onLogout() {
  try {
    await logout()
  } finally {
    await router.push('/login')
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-black/60 md:hidden"
      @click="closeMobileMenu"
    />

    <div class="flex min-h-screen">

      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-200 md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0"
        :class="[
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarOpen ? 'md:flex' : 'md:hidden',
        ]"
      >
        <!-- Brand -->
        <div class="flex h-16 items-center justify-between border-b border-gray-800 px-5">
          <RouterLink
            to="/dashboard"
            class="flex items-center gap-3"
            @click="closeMobileMenu"
          >
            <div class="flex size-9 items-center justify-center rounded-xl bg-violet-600">
              <Rocket class="size-5 text-white" />
            </div>

            <span class="text-lg font-bold tracking-tight text-white">
              DeployCraft
            </span>
          </RouterLink>

          <button
            type="button"
            class="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
            aria-label="Close navigation"
            @click="closeMobileMenu"
          >
            <X class="size-5" />
          </button>
        </div>

        <!-- New project -->
        <div class="p-4">
          <Button
            class="w-full justify-center bg-violet-600 text-white hover:bg-violet-500"
            @click="router.push('/deployments')"
          >
            <Plus class="mr-2 size-4" />
            New project
          </Button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 px-3 py-2">
          <p class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Workspace
          </p>

          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-900 hover:text-white"
            active-class="!bg-violet-500/10 !text-violet-300"
            @click="closeMobileMenu"
          >
            <component :is="item.icon" class="size-5 shrink-0" />
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- User section -->
        <div class="border-t border-gray-800 p-4">
          <div class="mb-4 flex items-center gap-3 rounded-xl bg-gray-900 p-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-semibold text-violet-300">
              {{ user?.email?.charAt(0).toUpperCase() || 'U' }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">
                {{ user?.email || 'Signed in' }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                Account
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            class="w-full justify-start text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            @click="onLogout"
          >
            <LogOut class="mr-2 size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex min-w-0 flex-1 flex-col">

        <!-- Header -->
        <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-800 p-2 text-gray-400 transition hover:bg-gray-900 hover:text-white md:hidden"
              aria-label="Open navigation"
              @click="mobileMenuOpen = true"
            >
              <Menu class="size-5" />
            </button>

            <button
              type="button"
              class="hidden rounded-lg border border-gray-800 p-2 text-gray-400 transition hover:bg-gray-900 hover:text-white md:block"
              :aria-label="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
              @click="sidebarOpen = !sidebarOpen"
            >
              <Menu class="size-5" />
            </button>

            <div>
              <h1 class="text-sm font-semibold text-white sm:text-base">
                Dashboard
              </h1>
              <p class="hidden text-xs text-gray-500 sm:block">
                Manage your projects and deployments
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            class="border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white"
            :disabled="loading"
            @click="load"
          >
            <RefreshCw
              class="mr-2 size-4"
              :class="{ 'animate-spin': loading }"
            />
            <span class="hidden sm:inline">Refresh</span>
          </Button>
        </header>

        <!-- Dashboard -->
        <main class="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 sm:p-6 lg:p-8">

          <!-- Welcome -->
          <section class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div class="mb-2 flex items-center gap-2 text-sm text-violet-400">
                <Activity class="size-4" />
                Project overview
              </div>

              <h2 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back
              </h2>

              <p class="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                Here's an overview of your projects and deployment activity.
              </p>
            </div>

            <Button
              class="bg-violet-600 text-white hover:bg-violet-500"
              @click="router.push('/deployments')"
            >
              <Plus class="mr-2 size-4" />
              New deployment
            </Button>
          </section>

          <!-- Error -->
          <div
            v-if="errorMessage"
            role="alert"
            class="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle class="mt-0.5 size-5 shrink-0" />

            <p class="flex-1">
              {{ errorMessage }}
            </p>

            <button
              type="button"
              class="text-red-300 hover:text-white"
              aria-label="Dismiss error"
              @click="errorMessage = ''"
            >
              <X class="size-4" />
            </button>
          </div>

          <!-- Statistics -->
          <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              v-for="stat in stats"
              :key="stat.label"
              class="border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-700"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-gray-400">
                    {{ stat.label }}
                  </p>

                  <p class="mt-3 text-3xl font-bold tracking-tight text-white">
                    {{ stat.value }}
                  </p>
                </div>

                <div
                  class="flex size-11 items-center justify-center rounded-xl"
                  :class="stat.background"
                >
                  <component
                    :is="stat.icon"
                    class="size-5"
                    :class="stat.color"
                  />
                </div>
              </div>

              <p class="mt-4 text-xs text-gray-500">
                {{ stat.note }}
              </p>
            </Card>
          </section>

          <!-- Projects -->
          <section>
            <Card class="overflow-hidden border border-gray-800 bg-gray-900">
              <div class="flex flex-col justify-between gap-4 border-b border-gray-800 p-5 sm:flex-row sm:items-center sm:px-6">
                <div>
                  <h3 class="text-base font-semibold text-white">
                    Your projects
                  </h3>

                  <p class="mt-1 text-sm text-gray-500">
                    {{ filtered.length }} project{{ filtered.length === 1 ? '' : 's' }}
                    found
                  </p>
                </div>

                <div class="relative w-full sm:max-w-xs">
                  <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />

                  <Input
                    v-model="search"
                    placeholder="Search projects..."
                    aria-label="Search projects"
                    class="w-full border-gray-800 bg-gray-950 pl-9 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              <!-- Loading -->
              <div v-if="loading" class="space-y-4 p-6">
                <div
                  v-for="n in 4"
                  :key="n"
                  class="flex animate-pulse items-center gap-4"
                >
                  <div class="size-10 rounded-lg bg-gray-800" />
                  <div class="flex-1 space-y-2">
                    <div class="h-4 w-36 rounded bg-gray-800" />
                    <div class="h-3 w-24 rounded bg-gray-800" />
                  </div>
                  <div class="h-6 w-20 rounded-full bg-gray-800" />
                </div>
              </div>

              <!-- Empty state -->
              <div
                v-else-if="!filtered.length"
                class="px-6 py-14 text-center"
              >
                <div class="mx-auto flex size-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950">
                  <FolderGit2 class="size-7 text-gray-500" />
                </div>

                <h4 class="mt-5 font-semibold text-white">
                  {{ search ? 'No matching projects' : 'No deployments yet' }}
                </h4>

                <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {{
                    search
                      ? 'Try another project name or clear your search.'
                      : 'Create your first deployment to see your projects here.'
                  }}
                </p>

                <Button
                  v-if="!search"
                  class="mt-5 bg-violet-600 text-white hover:bg-violet-500"
                  @click="router.push('/deployments')"
                >
                  <Plus class="mr-2 size-4" />
                  Create your first project
                </Button>

                <Button
                  v-else
                  variant="outline"
                  class="mt-5 border-gray-800 text-gray-300"
                  @click="search = ''"
                >
                  Clear search
                </Button>
              </div>

              <!-- Desktop table -->
              <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[600px] text-left text-sm">
                  <thead class="bg-gray-950/50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th class="px-6 py-4 font-medium">
                        Project
                      </th>
                      <th class="px-6 py-4 font-medium">
                        Status
                      </th>
                      <th class="px-6 py-4 font-medium">
                        Created
                      </th>
                      <th class="px-6 py-4 text-right font-medium">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-gray-800/70">
                    <tr
                      v-for="deployment in filtered"
                      :key="deployment.id"
                      class="transition hover:bg-gray-800/30"
                    >
                      <td class="px-6 py-4">
                        <RouterLink
                          :to="`/deployments/${deployment.id}`"
                          class="group inline-flex items-center gap-3"
                        >
                          <div class="flex size-10 items-center justify-center rounded-lg border border-gray-800 bg-gray-950">
                            <FolderGit2 class="size-5 text-gray-400" />
                          </div>

                          <div>
                            <p class="font-medium text-gray-100 transition group-hover:text-violet-300">
                              {{ deployment.projectName }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500">
                              ID: {{ deployment.id }}
                            </p>
                          </div>
                        </RouterLink>
                      </td>

                      <td class="px-6 py-4">
                        <StatusBadge :status="deployment.status" />
                      </td>

                      <td class="whitespace-nowrap px-6 py-4 text-gray-400">
                        {{ formatDate(deployment.createdAt) }}
                      </td>

                      <td class="px-6 py-4 text-right">
                        <RouterLink
                          :to="`/deployments/${deployment.id}`"
                          class="inline-flex items-center gap-1 text-gray-400 transition hover:text-violet-300"
                        >
                          View
                          <ArrowUpRight class="size-4" />
                        </RouterLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Table footer -->
              <div
                v-if="!loading && filtered.length"
                class="flex flex-col justify-between gap-2 border-t border-gray-800 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:px-6"
              >
                <span>
                  Showing {{ filtered.length }} of {{ deployments.length }} projects
                </span>

                <span class="inline-flex items-center gap-2">
                  <span class="size-2 rounded-full bg-emerald-400" />
                  Deployment service
                </span>
              </div>
            </Card>
          </section>

          <!-- Footer -->
          <footer class="flex flex-col justify-between gap-2 border-t border-gray-800 pt-5 text-xs text-gray-500 sm:flex-row">
            <p>DeployCraft · Deployment workspace</p>

            <p>
              Manage your projects in one place.
            </p>
          </footer>

        </main>
      </div>
    </div>
  </div>
</template>
```