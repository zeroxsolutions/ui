#!/usr/bin/env bash
# Prints every pair of production route patterns, in two different apps/*-zone/wrangler.jsonc, where one
# claims a path the other also claims, and exits 1 when it printed any. Cloudflare gives a request to
# the most specific matching route and reports no overlap, so a narrower path in a second zone silently
# takes those requests from the first. registry-ui, the default zone, is no *-zone app: it answers every
# path the zones leave, so it overlaps all of them by design.
#
# Also prints every path registry-ui serves that a zone's wildcard pattern claims, and exits 1 for one. A
# pattern such as `/docs/editor*` claims `/docs/editor-x` too, so a registry-ui page at that path would be
# answered by the zone. registry-ui's paths are its app's static segments and its docs pages' slugs, under
# `/docs`, `/og/docs` and `/llms.mdx/docs`.
set -euo pipefail

cd "$(dirname "$0")/.."

node --input-type=commonjs - <<'EOF'
const fs = require('node:fs');
const path = require('node:path');
// typescript's JSON parser reads comments and trailing commas, which wrangler.jsonc carries.
const ts = require('typescript');

const claims = [];
for (const app of fs.readdirSync('apps').filter((name) => name.endsWith('-zone')).sort()) {
  const file = path.join('apps', app, 'wrangler.jsonc');
  if (!fs.existsSync(file)) continue;
  const { config, error } = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8'));
  if (error) {
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
    process.exit(2);
  }
  for (const route of config.env?.production?.routes ?? []) {
    claims.push({ file, pattern: typeof route === 'string' ? route : route.pattern });
  }
}

// A pattern ending in `*` claims every path its stem starts; any other pattern claims itself alone.
let overlaps = 0;
for (const a of claims) {
  for (const b of claims) {
    if (a.file === b.file) continue;
    const covers = a.pattern.endsWith('*')
      ? b.pattern.startsWith(a.pattern.slice(0, -1))
      : a.pattern === b.pattern;
    if (covers) {
      console.log(`${a.file} ${a.pattern} overlaps ${b.file} ${b.pattern}`);
      overlaps++;
    }
  }
}

// A route group `(name)` adds no segment; a dynamic segment `[name]` ends what a path can name statically.
const served = [];
function walk(dir, at) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('[')) continue;
    const next = entry.name.startsWith('(') ? at : `${at}/${entry.name}`;
    if (next !== at) served.push(next);
    if (entry.isDirectory()) walk(path.join(dir, entry.name), next);
  }
}
walk('apps/registry-ui/src/app', '');
const content = 'packages/ui-docs-web/content/docs';
for (const file of fs.readdirSync(content, { recursive: true, encoding: 'utf8' })) {
  if (!file.endsWith('.mdx')) continue;
  const slug = file.slice(0, -'.mdx'.length).replace(/(^|\/)index$/, '');
  if (slug === '') continue;
  for (const prefix of ['/docs', '/og/docs', '/llms.mdx/docs']) served.push(`${prefix}/${slug}`);
}

let captured = 0;
for (const { file, pattern } of claims) {
  if (!pattern.endsWith('*')) continue;
  const stem = pattern.slice(pattern.indexOf('/'), -1);
  for (const url of served) {
    if (url.startsWith(stem)) {
      console.log(`${file} ${pattern} claims registry-ui's ${url}`);
      captured++;
    }
  }
}
process.exit(overlaps > 0 || captured > 0 ? 1 : 0);
EOF
