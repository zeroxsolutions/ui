import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Reads prerendered pages back through the ASSETS binding and writes nothing, which is all a site
// with no `revalidate` needs. The queue and tag cache stay "dummy": the queue's dummy throws
// "Dummy queue is not implemented" the first time a stored render goes stale, so the first route
// that sets `revalidate` has to bring a writable cache and a real queue with it.
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
