// @ts-check

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { createMDX } from 'fumadocs-mdx/next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

import { COMPONENT_BASES } from './src/constants/component-bases.config.mjs';
import { DEFAULT_NATIVE_ENGINE } from './src/constants/native-engines.config.mjs';

// A base's own index, and its Markdown at `<base>.md`, are already under the base.
const UNDER_A_BASE = `(?:${COMPONENT_BASES.join('|')})(?:\\.md)?$`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The adapter bundles from this output; without it the adapter fails on a missing
  // pages-manifest.json rather than naming the setting that produces it.
  output: 'standalone',
  // Unset, `next dev` run by a coding agent writes an AGENTS.md and a CLAUDE.md into this app,
  // beside the repo's own CLAUDE.md, and re-creates them whenever they are deleted.
  agentRules: false,
  // A docs page's Markdown is a route handler under /llms.mdx; a path cannot end a catch-all segment in
  // `.md`, so the address readers use is rewritten to it.
  rewrites: async () => [
    { source: '/docs.md', destination: '/llms.mdx/docs/content.md' },
    { source: '/docs/:path*.md', destination: '/llms.mdx/docs/:path*/content.md' },
    { source: '/native/docs.md', destination: '/llms.mdx/native/docs/content.md' },
    { source: '/native/docs/:path*.md', destination: '/llms.mdx/native/docs/:path*/content.md' },
    { source: '/native/components/:engine.md', destination: '/llms.mdx/native/components/:engine/content.md' },
    {
      source: '/native/components/:engine/:path*.md',
      destination: '/llms.mdx/native/components/:engine/:path*/content.md',
    },
  ],
  // base-nova is the style the items' own classes are drawn in; the shadcn-build target builds it first.
  // The web components' and blocks' addresses from before the base segment answer 301; `permanent`
  // would answer 308.
  redirects: async () => [
    { source: '/r/:name([^/]+\\.json)', destination: '/r/styles/base-nova/:name', permanent: true },
    { source: '/docs/components', destination: '/docs/components/base', statusCode: 301 },
    {
      source: `/docs/components/:name((?!${UNDER_A_BASE})[^/]+)`,
      destination: '/docs/components/base/:name',
      statusCode: 301,
    },
    { source: '/blocks', destination: '/blocks/base', statusCode: 301 },
    // The native pages' addresses from before /native, a fixed set: its introduction, its installation, and
    // one page per item, which now answers under an engine.
    { source: '/docs/native', destination: '/native/docs', statusCode: 301 },
    { source: '/docs/native/installation', destination: '/native/docs/installation', statusCode: 301 },
    { source: '/docs/native.md', destination: '/native/docs.md', statusCode: 301 },
    { source: '/docs/native/installation.md', destination: '/native/docs/installation.md', statusCode: 301 },
    {
      source: '/docs/native/:name',
      destination: `/native/components/${DEFAULT_NATIVE_ENGINE}/:name`,
      statusCode: 301,
    },
  ],
};

const withMDX = createMDX();

/**
 * Wires the Workers bindings into `next dev` only. Called unconditionally, `next build` starts a
 * miniflare per config load and exits leaving a `workerd` process behind, and the next build then
 * fails on its persisted state with `SQLITE_BUSY`.
 *
 * @param {string} phase
 */
export default async function config(phase) {
  if (phase === PHASE_DEVELOPMENT_SERVER) await initOpenNextCloudflareForDev();
  return withMDX(nextConfig);
}
