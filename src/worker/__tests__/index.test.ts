// Automated tests for Cloudflare Worker
/* global Request, ReadableStream, ReadableStreamDefaultController, require */

import { Env } from '../types';

// Mock environment for testing
const createMockEnv = (): Env => ({
  PARCEL_DATA_BUCKET: {
    get: jest.fn(),
  },
  PARCEL_METADATA: {
    get: jest.fn(),
    put: jest.fn(),
  },
});

// Mock R2 object
const createMockR2Object = (etag: string, body: string, size: number) => ({
  etag,
  body: new ReadableStream({
    start(controller: ReadableStreamDefaultController<Uint8Array>) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  }),
  size,
  uploaded: new Date('2024-01-01T00:00:00Z'),
});

describe('Alexandria Parcels Worker', () => {
  let mockEnv: Env;
  let worker: { fetch: (request: Request, env: Env) => Promise<Response> };

  beforeEach(() => {
    mockEnv = createMockEnv();
    // Import the worker dynamically to get fresh instance
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    worker = require('../index').default;
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://example.com/data/test.geojson.gz', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET, OPTIONS'
      );
    });

    it('should include CORS headers in all responses', async () => {
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        createMockR2Object(
          'test-etag',
          '{"type":"FeatureCollection","features":[]}',
          100
        )
      );

      const request = new Request('https://example.com/data/test.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Data serving', () => {
    it('should serve files from R2 with correct headers', async () => {
      const mockObject = createMockR2Object(
        'test-etag-123',
        '{"type":"FeatureCollection","features":[]}',
        100
      );
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        mockObject
      );

      const request = new Request('https://example.com/data/test.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/gzip');
      expect(response.headers.get('Content-Encoding')).toBe('gzip');
      expect(response.headers.get('ETag')).toBe('"test-etag-123"');
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000'
      );
    });

    it('should return 404 for non-existent files', async () => {
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(null);

      const request = new Request(
        'https://example.com/data/nonexistent.geojson.gz'
      );
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid file names', async () => {
      const request = new Request('https://example.com/data/');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(400);
    });
  });

  describe('ETag validation', () => {
    it('should return 304 when client has matching ETag', async () => {
      const mockObject = createMockR2Object(
        'test-etag-123',
        '{"type":"FeatureCollection","features":[]}',
        100
      );
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        mockObject
      );

      const request = new Request('https://example.com/data/test.geojson.gz', {
        headers: {
          'If-None-Match': '"test-etag-123"',
        },
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(304);
      expect(response.headers.get('ETag')).toBe('"test-etag-123"');
    });

    it('should return full response when ETag does not match', async () => {
      const mockObject = createMockR2Object(
        'test-etag-456',
        '{"type":"FeatureCollection","features":[]}',
        100
      );
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        mockObject
      );

      const request = new Request('https://example.com/data/test.geojson.gz', {
        headers: {
          'If-None-Match': '"test-etag-123"',
        },
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('ETag')).toBe('"test-etag-456"');
    });
  });

  describe('Cache-bypass functionality', () => {
    it('should bypass cache when cache-bypass=true', async () => {
      const mockObject = createMockR2Object(
        'test-etag-123',
        '{"type":"FeatureCollection","features":[]}',
        100
      );
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        mockObject
      );

      const request = new Request(
        'https://example.com/data/test.geojson.gz?cache-bypass=true',
        {
          headers: {
            'If-None-Match': '"test-etag-123"',
          },
        }
      );

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
    });

    it('should use normal caching when cache-bypass=false', async () => {
      const mockObject = createMockR2Object(
        'test-etag-123',
        '{"type":"FeatureCollection","features":[]}',
        100
      );
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockResolvedValue(
        mockObject
      );

      const request = new Request(
        'https://example.com/data/test.geojson.gz?cache-bypass=false'
      );
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=31536000'
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when R2 throws an error', async () => {
      (mockEnv.PARCEL_DATA_BUCKET.get as jest.Mock).mockRejectedValue(
        new Error('R2 error')
      );

      const request = new Request('https://example.com/data/test.geojson.gz');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(500);
    });

    it('should return 405 for non-GET requests', async () => {
      const request = new Request('https://example.com/data/test.geojson.gz', {
        method: 'POST',
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(405);
    });

    it('should return 404 for non-data paths', async () => {
      const request = new Request('https://example.com/api/something');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
    });
  });
});
