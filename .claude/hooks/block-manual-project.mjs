#!/usr/bin/env node
// PreToolUse gate — blocks hand-creating a new nx project manifest.
//
// Why this exists: the `nx-generators` rule requires every app/library to be
// scaffolded with an nx generator, never written by hand. A loaded rule still
// depends on the agent re-reading it at the decision point, which is unreliable.
// This hook fails the action regardless, so a missed rule can't slip through.
//
// What it blocks: a `Write` that CREATES `apps/<x>/{package,project}.json` or
// `packages/<x>/{package,project}.json` — the unambiguous signal of a new nx
// project being hand-rolled. Editing an existing manifest is always allowed.
//
// Protocol: read the PreToolUse payload from stdin; exit 2 + stderr to block,
// exit 0 to allow. See .claude/rules/gen-via-generator.md.

import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

// No piped payload (e.g. run in a terminal) → nothing to gate.
if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload) process.exit(0);

// Edit can't create files, so only Write can hand-create a manifest.
if (payload.tool_name !== 'Write') process.exit(0);

const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath.length === 0) process.exit(0);

const projectDir = payload.cwd || process.cwd();
const abs = (isAbsolute(filePath) ? filePath : resolve(projectDir, filePath)).replace(/\\/g, '/');

// A NEW project manifest under apps/* or packages/*.
const isManifest = /(?:^|\/)(apps|packages)\/[^/]+\/(package|project)\.json$/.test(abs);
if (!isManifest) process.exit(0);

// Only CREATION is a violation — editing an existing project is fine.
if (existsSync(abs)) process.exit(0);

const rel = abs.startsWith(`${projectDir}/`) ? abs.slice(projectDir.length + 1) : abs;
process.stderr.write(
  `BLOCKED by .claude/hooks/block-manual-project — hand-creating a new nx project manifest:\n` +
    `  ${rel}\n\n` +
    `The nx-generators rule forbids this: scaffold new projects with an nx generator,\n` +
    `never by hand. Run a generator and preview it first, e.g.:\n` +
    `  nx g @nx/next:application <name> --dry-run     # Next.js app (SSR)\n` +
    `  nx g @nx/react:application <name> --dry-run    # React (Vite) SPA\n` +
    `  nx g @nx/node:application <name> --dry-run     # Node / Worker app\n` +
    `  nx g @nx/js:library <name> --dry-run           # plain TS library\n` +
    `  nx g @nx/react:library <name> --dry-run        # React library\n\n` +
    `Read the --dry-run file list, then adapt the generated files (wrangler,\n` +
    `OpenNext, targets). See .claude/rules/gen-via-generator.md.\n`,
);
process.exit(2);

function readJsonStdin() {
  return new Promise((res) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      try {
        res(JSON.parse(data));
      } catch {
        res(null);
      }
    });
    process.stdin.on('error', () => res(null));
  });
}
