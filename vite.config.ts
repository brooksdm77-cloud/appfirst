import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { searchSupermarkets } from './src/server/supermarketSearchLogic'

const liveSearchPlugin = (): Plugin => ({
  name: 'live-search-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      if (url.pathname === '/api/search') {
        const query = url.searchParams.get('q') || ''
        res.setHeader('Content-Type', 'application/json')
        if (!query.trim()) {
          res.end(JSON.stringify({ results: [] }))
          return
        }
        try {
          const results = await searchSupermarkets(query)
          res.end(JSON.stringify({ query, results }))
        } catch (err: any) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message, results: [] }))
        }
        return
      }
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), liveSearchPlugin()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-tesseract': ['tesseract.js'],
        },
      },
    },
  },
})
