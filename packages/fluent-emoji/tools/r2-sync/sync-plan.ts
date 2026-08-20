import { relative } from 'node:path';

/** One artwork file on disk, keyed the way the bucket stores it. */
export interface LocalAsset {
  /** Object key at the bucket root, `<style>/<codepoint>.<ext>`. */
  key: string;
  /** Where to read the bytes from. */
  path: string;
  /** Hex MD5 of the bytes. */
  md5: string;
}

/** The bucket is served from its root, so a file's key is its path below `assets/`. */
export function keyForPath(assetsDir: string, filePath: string): string {
  return relative(assetsDir, filePath);
}

export interface SyncPlan {
  upload: LocalAsset[];
  skip: string[];
  orphan: string[];
}

/**
 * Decide what the bucket is missing, comparing each file's MD5 against the object's
 * ETag. R2 returns the MD5 as the ETag only for objects written by a single
 * `PutObject`, so the caller must not upload through a multipart `Upload`.
 */
export function planSync(local: readonly LocalAsset[], remote: ReadonlyMap<string, string>): SyncPlan {
  const upload: LocalAsset[] = [];
  const skip: string[] = [];

  for (const asset of local) {
    // S3 wraps the ETag in literal double quotes, and ListObjectsV2 hands them through.
    if (remote.get(asset.key)?.replace(/^"|"$/g, '') === asset.md5) skip.push(asset.key);
    else upload.push(asset);
  }

  const localKeys = new Set(local.map((asset) => asset.key));
  const orphan = [...remote.keys()].filter((key) => !localKeys.has(key));

  return { upload, skip, orphan };
}

// A Map rather than an object literal: `key.slice(...)` is a filename, and an object
// would answer `constructor` and `toString` out of its prototype.
const CONTENT_TYPE = new Map([
  ['webp', 'image/webp'],
  ['svg', 'image/svg+xml'],
]);

export function contentTypeFor(key: string): string {
  const contentType = CONTENT_TYPE.get(key.slice(key.lastIndexOf('.') + 1));
  if (!contentType) throw new Error(`no content type for ${key}`);
  return contentType;
}
