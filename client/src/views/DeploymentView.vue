<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { API_URL } from "@/config";
import { useAuth } from "@/composables/useAuth";
import StatusBadge from "@/components/StatusBadge.vue";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;
const { token, authFetch } = useAuth();

const projectName = ref("");
const status = ref("pending");
const logs = ref("");
const error = ref("");
const box = ref<HTMLElement | null>(null);

const liveUrl = computed(() => `http://${id}.localhost:4002`);

let ctrl: AbortController | null = null;

// npm and vite print color codes; a plain <pre> would show them as junk
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

function handleEvent(event: string, data: string) {
  if (event === "log") {
    let text = data;
    try {
      text = JSON.parse(data); // log events carry a JSON string
    } catch {}
    logs.value += stripAnsi(text);
    nextTick(() => {
      if (box.value) box.value.scrollTop = box.value.scrollHeight;
    });
  } else if (event === "status") {
    status.value = data; // plain text: pending | building | active | failed
  } else if (event === "error") {
    error.value = data;
  }
}

async function streamLogs() {
  ctrl = new AbortController();
  try {
    const res = await fetch(`${API_URL}/deployments/${id}/logs`, {
      headers: { Authorization: `Bearer ${token.value}` },
      signal: ctrl.signal,
    });

    if (res.status === 401) {
      error.value = "Session expired. Log out and log in again.";
      return;
    }
    if (!res.ok || !res.body) {
      error.value = `Could not open the log stream (HTTP ${res.status}).`;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        let event = "message";
        const dataLines: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
        }
        handleEvent(event, dataLines.join("\n"));

        if (event === "done") {
          ctrl.abort();
          return;
        }
      }
    }
  } catch (e: any) {
    if (e?.name !== "AbortError") error.value = e?.message || "Stream failed";
  }
}

onMounted(async () => {
  const res = await authFetch(`/deployments/${id}`);
  const data = await res.json();
  if (data.success) {
    projectName.value = data.data.projectName;
    status.value = data.data.status;
  }
  streamLogs();
});

onBeforeUnmount(() => ctrl?.abort());

const deleting = ref(false);
async function deleteProject() {
  if (!window.confirm("Delete this project? This removes its logs and the deployed site. This cannot be undone.")) return;
  deleting.value = true;
  const res = await authFetch(`/deployments/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  deleting.value = false;
  if (!res.ok) {
    error.value = data.message || "Could not delete this project";
    return;
  }
  router.push("/deployments");
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-6 text-gray-200">
    <header class="mb-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/deployments" class="text-sm text-gray-400 hover:underline">
          ← Back
        </RouterLink>
        <h1 class="font-semibold">{{ projectName }}</h1>
        <StatusBadge :status="status" />
      </div>
      <a
        v-if="status === 'active'"
        :href="liveUrl"
        target="_blank"
        rel="noopener"
        class="text-sm hover:underline"
      >
        Visit Deployment ↗
      </a>
    </header>
    <div class="mb-4 flex justify-end">
      <button
        class="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="status === 'building' || deleting"
        @click="deleteProject"
      >
        {{ deleting ? "Deleting..." : "Delete this project" }}
      </button>
    </div>

    <div class="rounded-xl border border-[#21262d] bg-[#161b22]">
      <h2 class="border-b border-[#21262d] px-4 py-3 font-mono text-sm font-semibold">
        Build Logs
      </h2>
      <pre
        ref="box"
        class="h-[400px] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-gray-200"
      >{{ logs || (error ? "" : "Waiting for output...") }}</pre>
      <p v-if="error" class="px-4 pb-4 font-mono text-sm text-red-400">{{ error }}</p>
    </div>
  </div>
</template>
