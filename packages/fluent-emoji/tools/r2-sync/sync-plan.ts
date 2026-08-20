/** One artwork file on disk, keyed the way the bucket stores it. */
export interface LocalAsset {
  /** Object key at the bucket root, `<style>/<codepoint>.<ext>`. */
  key: string;
  /** Where to read the bytes from. */
  path: string;
  /** Hex MD5 of the bytes. */
  md5: string;
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
export function planSync(
  local: readonly LocalAsset[],
  remote: ReadonlyMap<string, string>,
): SyncPlan {
  const upload: LocalAsset[] = [];
  const skip: string[] = [];

  for (const asset of local) {
    if (remote.get(asset.key) === asset.md5) skip.push(asset.key);
    else upload.push(asset);
  }

  const localKeys = new Set(local.map((asset) => asset.key));
  const orphan = [...remote.keys()].filter((key) => !localKeys.has(key));

  return { upload, skip, orphan };
}

const CONTENT_TYPE: Record<string, string> = {
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export function contentTypeFor(key: string): string {
  const contentType = CONTENT_TYPE[key.slice(key.lastIndexOf('.') + 1)];
  if (!contentType) throw new Error(`no content type for ${key}`);
  return contentType;
}
