import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { handleChatRequest } from './server/geminiService.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env, .env.local, etc.
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    server: {
      proxy: {
        '/api/schemes': 'http://localhost:8080',
        '/api/users': 'http://localhost:8080',
        '/api/verifications': 'http://localhost:8080',
        '/api/reviews': 'http://localhost:8080',
        '/api/admin': 'http://localhost:8080',
      },
    },
    plugins: [
      react(),
      {
        name: 'jansetu-chat-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', (req, res) => {
            handleChatRequest(req, res)
          })
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/chat', (req, res) => {
            handleChatRequest(req, res)
          })
        },
      },
    ],
  }
})
