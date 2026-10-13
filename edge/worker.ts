import { createAgentGateway } from './agent-gateway'

const gateway = createAgentGateway((request) => fetch(request))

/** Cloudflare Worker entry point; routed in front of the GitHub Pages origin. */
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      return await gateway(request)
    } catch (error) {
      // Never let negotiation take the site down: fall back to the origin as-is.
      console.error('agent gateway failed', request.url, error)
      return fetch(request)
    }
  },
}
