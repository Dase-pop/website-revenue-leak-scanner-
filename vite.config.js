import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { scanPublicSite } from './src/scanner.js'

function localScanApi() {
  return { name: 'local-scan-api', configureServer(server) {
    server.middlewares.use('/api/scan', async (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
      try {
        let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 2_000) throw new Error('Request is too large.') }
        const body = JSON.parse(raw)
        if (typeof body.url !== 'string' || body.url.length > 500) throw new Error('Enter one public website address under 500 characters.')
        const result = await scanPublicSite(body.url)
        res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(result))
      } catch (error) { res.statusCode = 422; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify({ error: error?.message || 'The site could not be scanned.' })) }
    })
  } }
}

export default defineConfig({ plugins: [react(), localScanApi()] })
