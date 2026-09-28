// @ts-check

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The adapter bundles from this output; without it the adapter fails on a missing
  // pages-manifest.json rather than naming the setting that produces it.
  output: 'standalone',
};

/**
 * Wires the Workers bindings into `next dev` only. Called unconditionally, `next build` starts a
 * miniflare per config load and exits leaving a `workerd` process behind, and the next build then
 * fails on its persisted state with `SQLITE_BUSY` (@opennextjs/cloudflare 1.20.6, next 16.1.7).
 *
 * @param {string} phase
 */
export default async function config(phase) {
  if (phase === PHASE_DEVELOPMENT_SERVER) await initOpenNextCloudflareForDev();
  return nextConfig;
}
