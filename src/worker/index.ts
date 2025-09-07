// Cloudflare Worker for Alexandria Parcels API
// Serves GeoJSON batch files from R2 with ETag caching and cache-bypass support

/* global Request, URL */

import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, If-None-Match, If-Modified-Since',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Route data requests
    if (path.startsWith('/data/')) {
      return handleDataRequest(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

async function handleDataRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const fileName = url.pathname.split('/').pop();

  if (!fileName) {
    return new Response('Invalid file name', {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Check for cache-bypass parameter
  const cacheBypass = url.searchParams.get('cache-bypass') === 'true';

  try {
    // Get object from R2
    const object = await env.PARCEL_DATA_BUCKET.get(fileName);

    if (!object) {
      return new Response('File not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Generate ETag from object metadata
    const etag = `"${object.etag}"`;
    const lastModified = object.uploaded.toUTCString();

    // Check if client has cached version
    const clientETag = request.headers.get('If-None-Match');

    if (!cacheBypass && clientETag === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: etag,
          'Last-Modified': lastModified,
        },
      });
    }

    // Set appropriate cache headers
    const cacheControl = cacheBypass
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000'; // 1 year for static data

    // Return the file with proper headers
    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/geo+json',
        'Content-Encoding': 'gzip',
        ETag: etag,
        'Last-Modified': lastModified,
        'Cache-Control': cacheControl,
        'Content-Length': object.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
}
