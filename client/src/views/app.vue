```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/Button.vue'
import Card from '@/components/Card.vue'

const { isLoggedIn } = useAuth()

const features = [
  {
    title: 'Live build logs',
    text: 'Watch git clone, npm install and your build run in a real-time terminal as it happens.',
  },
  {
    title: 'Your own commands',
    text: 'Set the install command, build command and output folder for each project.',
  },
  {
    title: 'Sandboxed builds',
    text: 'Every build runs inside a Docker container with memory, CPU and time limits.',
  },
  {
    title: 'Instant preview',
    text: 'When the build succeeds, your site is served on its own address. Open it with one click.',
  },
]

const steps = [
  { n: '1', title: 'Create an account', text: 'Generate a test account in one click, or sign up.' },
  { n: '2', title: 'Add a repo', text: 'Paste a public GitHub repo, or use our example.' },
  { n: '3', title: 'Watch it build', text: 'Follow the logs live while your project builds.' },
  { n: '4', title: 'Visit your site', text: 'Open the deployed project and share the link.' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <section class="mx-auto max-w-5xl px-6 py-20 text-center">
      <p class="mb-4 text-sm uppercase tracking-widest text-emerald-400">
        Portfolio deployment platform
      </p>

      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
        Deploy your project.
        <br />
        <span class="text-emerald-400">Watch it build.</span>
      </h1>

      <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
        Connect a GitHub repository, choose your build commands, and see every
        step stream into a live terminal until your site is online.
      </p>

      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <RouterLink :to="isLoggedIn ? '/deployments' : '/generate-account'">
          <Button>
            {{ isLoggedIn ? 'New deployment' : 'Try it now' }}
          </Button>
        </RouterLink>

        <RouterLink
          v-if="!isLoggedIn"
          to="/login"
          class="text-sm text-gray-300 hover:text-white"
        >
          I already have an account →
        </RouterLink>
      </div>

      <!-- Terminal preview -->
      <div
        class="mx-auto mt-14 max-w-2xl overflow-hidden rounded-xl border border-gray-800 bg-black text-left shadow-xl"
      >
        <div class="flex gap-2 border-b border-gray-800 px-4 py-3">
          <span class="h-3 w-3 rounded-full bg-red-500"></span>
          <span class="h-3 w-3 rounded-full bg-yellow-500"></span>
          <span class="h-3 w-3 rounded-full bg-green-500"></span>
        </div>

        <pre
          class="overflow-x-auto p-4 font-mono text-sm leading-6 text-gray-300"
        ><span class="text-gray-500">$</span> git clone --branch main --depth 1 your-repo
<span class="text-gray-500">$</span> npm install
added 23 packages in 3s
<span class="text-gray-500">$</span> npm run build
vite build
<span class="text-emerald-400">✔ Build complete. Deployment is live.</span></pre>
      </div>
    </section>

    <!-- Features -->
    <section class="mx-auto max-w-5xl px-6 py-16">
      <h2 class="mb-10 text-center text-2xl font-semibold">
        What you get
      </h2>

      <div class="grid gap-4 sm:grid-cols-2">
        <Card
          v-for="feature in features"
          :key="feature.title"
          class="rounded-xl border border-gray-800 bg-gray-900 p-6"
        >
          <h3 class="mb-2 font-semibold">{{ feature.title }}</h3>
          <p class="text-sm text-gray-400">{{ feature.text }}</p>
        </Card>
      </div>
    </section>

    <!-- How it works -->
    <section class="mx-auto max-w-5xl px-6 py-16">
      <h2 class="mb-10 text-center text-2xl font-semibold">
        How it works
      </h2>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="step in steps" :key="step.n" class="text-center">
          <div
            class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500 font-semibold text-emerald-400"
          >
            {{ step.n }}
          </div>

          <h3 class="mb-1 font-semibold">{{ step.title }}</h3>
          <p class="text-sm text-gray-400">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- Final call to action -->
    <section class="mx-auto max-w-5xl px-6 py-16 text-center">
      <h2 class="text-2xl font-semibold">
        No repository? No problem.
      </h2>

      <p class="mx-auto mt-3 max-w-xl text-gray-400">
        Use the built-in example project and see a full deployment without
        touching your own GitHub.
      </p>

      <RouterLink
        :to="isLoggedIn ? '/deployments' : '/generate-account'"
        class="mt-6 inline-block"
      >
        <Button>Deploy the example</Button>
      </RouterLink>
    </section>

    <footer
      class="border-t border-gray-800 py-6 text-center text-sm text-gray-500"
    >
      Deploy Craft · A portfolio project
    </footer>
  </div>
</template>
```