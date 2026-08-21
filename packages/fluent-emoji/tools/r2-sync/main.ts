import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { mapWithConcurrency } from './map-with-concurrency.ts';
import { contentTypeFor, keyForPath, planSync, type LocalAsset } from './sync-plan.ts';

/** Keys are codepoint-addressed and never re-sourced in place - see the design spec. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** `DeleteObjects` takes at most 1000 keys per call. */
const DELETE_BATCH = 1000;

const UPLOAD_CONCURRENCY = 8;

const HASH_CONCURRENCY = 64;

const ASSETS_DIR = resolve(import.meta.dirname, '../../assets');

const ENV_KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'] as const;

function log(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, ...fields }));
}

/**
 * Read the four credentials, or name every one that is missing at once. A 403 from
 * R2 says nothing about which of them was absent.
 */
function readEnv(): Record<(typeof ENV_KEYS)[number], string> {
  const missing = ENV_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    log('r2.config.missing', { variables: missing });
    process.exit(1);
  }
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<
    (typeof ENV_KEYS)[number],
    string
  >;
}

async function md5Of(path: string): Promise<string> {
  const hash = createHash('md5');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/** Every file under `assets/`, hashed as it is read so no run holds 370 MB of buffers. */
async function walkAssets(dir: string): Promise<LocalAsset[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const files = entries.filter((entry) => entry.isFile());

  return mapWithConcurrency(files, HASH_CONCURRENCY, async (entry) => {
    const path = join(entry.parentPath, entry.name);
    return { key: keyForPath(dir, path), path, md5: await md5Of(path) };
  });
}

/** Object key -> ETag for the whole bucket; about ten pages at 9217 objects. */
async function listRemote(client: S3Client, bucket: string): Promise<Map<string, string>> {
  const remote = new Map<string, string>();
  for await (const page of paginateListObjectsV2({ client }, { Bucket: bucket })) {
    for (const object of page.Contents ?? []) {
      if (object.Key && object.ETag) remote.set(object.Key, object.ETag);
    }
  }
  return remote;
}

async function upload(client: S3Client, bucket: string, asset: LocalAsset): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: asset.key,
      Body: await readFile(asset.path),
      ContentType: contentTypeFor(asset.key),
      CacheControl: CACHE_CONTROL,
      // R2 verifies the body against this, and returns the same digest as the ETag -
      // which is what makes the next run's comparison meaningful.
      ContentMD5: Buffer.from(asset.md5, 'hex').toString('base64'),
    }),
  );
}

/** Uploads every asset it can and returns how many it could not, so one bad object
 *  does not abandon the other 9216. */
async function uploadAll(client: S3Client, bucket: string, assets: LocalAsset[]): Promise<number> {
  let done = 0;

  const outcomes = await mapWithConcurrency(assets, UPLOAD_CONCURRENCY, async (asset) => {
    let ok = true;
    try {
      await upload(client, bucket, asset);
    } catch (error) {
      ok = false;
      log('r2.upload.failed', { key: asset.key, reason: (error as Error).message });
    }
    if (++done % 500 === 0) log('r2.upload.progress', { done, total: assets.length });
    return ok;
  });

  return outcomes.filter((ok) => !ok).length;
}

async function prune(client: S3Client, bucket: string, keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += DELETE_BATCH) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.slice(i, i + DELETE_BATCH).map((Key) => ({ Key })) },
      }),
    );
  }
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes('--dry-run');
  const pruning = process.argv.includes('--prune');
  const env = readEnv();

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const local = await walkAssets(ASSETS_DIR);
  const plan = planSync(local, await listRemote(client, env.R2_BUCKET));
  log('r2.plan', {
    upload: plan.upload.length,
    skip: plan.skip.length,
    orphan: plan.orphan.length,
    dryRun,
    prune: pruning,
  });

  // An empty walk and an emptied `assets/` are the same input, and the second is what a
  // wrong ASSETS_DIR produces - so the whole bucket comes back as orphans.
  if (pruning && !local.length) {
    log('r2.prune.refused', { reason: 'no local files; every remote key would be deleted' });
    return 1;
  }

  if (dryRun) return 0;

  const failed = await uploadAll(client, env.R2_BUCKET, plan.upload);
  if (pruning) await prune(client, env.R2_BUCKET, plan.orphan);

  log('r2.done', {
    uploaded: plan.upload.length - failed,
    skipped: plan.skip.length,
    pruned: pruning ? plan.orphan.length : 0,
    failed,
  });

  return failed ? 1 : 0;
}

// An SDK rejection reaching the top level prints a stack trace naming the request it
// came from. Report the message and nothing else - the operator needs the reason, and
// the log sink must not receive a signed request.
process.exit(
  await main().catch((error: unknown) => {
    log('r2.failed', { reason: error instanceof Error ? error.message : String(error) });
    return 1;
  }),
);
