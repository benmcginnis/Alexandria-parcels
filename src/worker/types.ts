// Cloudflare Worker environment types
/* global ReadableStream */

export interface Env {
  PARCEL_DATA_BUCKET: {
    get: (key: string) => Promise<{
      etag: string;
      body: ReadableStream;
      size: number;
      uploaded: Date;
    } | null>;
  };
  PARCEL_METADATA: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string) => Promise<void>;
  };
}

// Request/Response types for data endpoints
export interface DataRequest {
  fileName: string;
  cacheBypass?: boolean;
}

export interface DataResponse {
  data: ArrayBuffer;
  etag: string;
  lastModified: string;
  cacheControl: string;
}
