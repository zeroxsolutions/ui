//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: this app documents + previews components and serves the shadcn
  // registry as static JSON under public/r - it has no server runtime, so it ships
  // to Cloudflare Pages (see fe-deploy-by-render-mode). No API routes.
  output: 'export',
  // Compile the workspace UI libs from source through Next's own pipeline so
  // React binds correctly during SSR - without this, the prebuilt dist's
  // `import * as React from 'react'` yields an ESM namespace missing named
  // exports and context-using primitives (sidebar, tooltip, ...) throw
  // `createContext is not a function` at page-data collection.
  transpilePackages: [
    '@zeroxsolutions/ui',
    '@zeroxsolutions/icons',
    '@zeroxsolutions/fluent-emoji',
  ],
};

module.exports = nextConfig;
