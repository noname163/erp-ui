import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'

async function loadInspectorPlugin() {
  try {
    const module = await import('vite-plugin-vue-inspector')
    return module.default
  } catch (error: any) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      console.warn('[vite] vite-plugin-vue-inspector is not installed; starting without the inspector plugin.')
      return null
    }

    throw error
  }
}

export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
  const plugins: PluginOption[] = [vue()]

  if (command === 'serve') {
    const Inspector = await loadInspectorPlugin()

    if (Inspector) {
      plugins.push(
        Inspector({
          toggleButtonVisibility: 'active',
          toggleButtonPos: 'bottom-right',
        }),
      )
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
