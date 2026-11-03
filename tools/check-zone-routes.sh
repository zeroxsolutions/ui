#!/usr/bin/env bash
# Prints every pair of production route patterns, in two different apps/*-zone/wrangler.jsonc, where one
# claims a path the other also claims, and exits 1 when it printed any. Cloudflare gives a request to
# the most specific matching route and reports no overlap, so a narrower path in a second zone silently
# takes those requests from the first. registry-ui, the default zone, is no *-zone app: it answers every
# path the zones leave, so it overlaps all of them by design.
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
process.exit(overlaps > 0 ? 1 : 0);
EOF
