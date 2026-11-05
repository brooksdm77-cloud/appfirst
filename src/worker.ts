import { searchSupermarkets } from './server/supermarketSearchLogic'

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle Live Supermarket Search API
    if (url.pathname === '/api/search') {
      const query = url.searchParams.get('q') || ''
      if (!query.trim()) {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      try {
        const results = await searchSupermarkets(query)
        return new Response(JSON.stringify({ query, results }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message, results: [] }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    }

    // Serve static assets
    return env.ASSETS.fetch(request)
  },
}
