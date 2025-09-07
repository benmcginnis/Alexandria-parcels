// Basic Cloudflare Worker for Alexandria Parcels API
// This will be fully implemented in Phase 3.2

/* global Request, URL */

export default {
  async fetch(request: Request, _env: unknown): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Basic routing
    if (path.startsWith('/data/')) {
      return new Response('Data endpoint - to be implemented', {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
