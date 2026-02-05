/// <reference types="@cloudflare/workers-types" />
interface CloudflareEnv {
  CSV_BUCKET: R2Bucket;
  [key: string]: unknown;
}
