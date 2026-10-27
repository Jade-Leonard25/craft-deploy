<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import '@xterm/xterm/css/xterm.css'
import { API_URL } from '@/config'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{ deploymentId: string }>()
const terminalRef = ref<HTMLElement | null>(null) // 👈 This MUST be a standard HTML div
const { token } = useAuth()

let term: Terminal
let fitAddon: FitAddon
let abortController: AbortController

onMounted(() => {
  term = new Terminal({
    theme: { background: '#202420', foreground: '#ebf0eb', cursor: '#40eddf' },
    fontFamily: 'monospace',
    fontSize: 28,
    cursorBlink: true,
    convertEol: true,
    disableStdin: true,
  })
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  
  // 👈 Mount xterm directly to the div
  if (terminalRef.value) {
    term.open(terminalRef.value)
    fitAddon.fit()
  }
  
  term.writeln('Connecting to build stream...\r\n')

  abortController = new AbortController()
  startStream()
})

onUnmounted(() => {
  if (abortController) abortController.abort()
  if (term) term.dispose()
})

const startStream = async () => {
  try {
    await fetchEventSource(`${API_URL}/deployments/${props.deploymentId}/logs`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token.value}` },
      signal: abortController.signal,
      onmessage(ev) {
        const data = JSON.parse(ev.data)
        
        if (ev.event === 'update' && data.logs !== undefined) {
          term.reset() 
          term.write(data.logs) 
        }
        
        if (ev.event === 'done') {
          term.writeln('\r\n\r\n✅ Build process finished.')
          abortController.abort()
        }
      },
      onerror(err) {
        console.error("SSE Error:", err)
        throw err 
      }
    })
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      term.writeln(`\r\n\x1b[31mConnection failed. Check console.\x1b[0m`)
    }
  }
}
</script>

<template>
  <!-- 👈 Use a plain HTML div here. 
       The width/height and styling are handled by the parent Card in DeploymentView.vue -->
  <div ref="terminalRef" class="w-full h-96 p-4"></div>

</template>