// Cloudflare Worker environment types
export interface Env {
  PARCEL_DATA_BUCKET: unknown; // R2Bucket will be available at runtime
  PARCEL_METADATA: unknown; // KVNamespace will be available at runtime
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
