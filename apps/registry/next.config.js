//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: this app documents + previews components and serves the shadcn
  // registry as static JSON under public/r - it has no server runtime, so it ships
  // to Cloudflare Pages (see fe-deploy-by-render-mode). No API routes.
  output: 'export',
};

module.exports = nextConfig;
