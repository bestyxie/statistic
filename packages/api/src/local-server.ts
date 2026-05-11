import { serve } from '@hono/node-server'
import app from './index'
import { LocalD1 } from './local-db'

const PORT = 3001

async function main() {
  const d1 = new LocalD1()
  await d1.init()

  serve({
    fetch: (req) => {
      return app.fetch(req, {
        DB: d1 as any,
        JWT_SECRET: 'local-dev-secret',
      })
    },
    port: PORT,
  })

  console.log(`\n  API server running at http://localhost:${PORT}`)
  console.log(`  Frontend should proxy /api/* to this server\n`)
}

main().catch(console.error)
