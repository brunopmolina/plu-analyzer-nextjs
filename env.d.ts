// Minimal R2 types
interface R2Object {
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
}

interface CloudflareEnv {
  CSV_BUCKET: R2Bucket;
  [key: string]: unknown;
}
