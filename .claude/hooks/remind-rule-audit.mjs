#!/usr/bin/env node
// PreToolUse reminder (non-blocking) — surfaces the pre-commit rule-audit at the
// decision point.
//
// The root cause of missed rules is acting from momentum instead of re-reading the
// governing rule when it matters. This fires on `git commit` and injects the live
// list of `.claude/rules/*` so the audit happens at commit time, not from memory at
// session start. It NEVER blocks (the hard gates do that); it only reminds. See
// .claude/rules/green-before-commit.md.

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload || payload.tool_name !== 'Bash') process.exit(0);

const command = payload?.tool_input?.command;
// Only real commits — skip status/log/diff and dry-runs.
if (typeof command !== 'string' || !/\bgit\s+commit\b/.test(command) || /--dry-run\b/.test(command)) {
  process.exit(0);
}

const projectDir = payload.cwd || process.cwd();
const rulesDir = join(projectDir, '.claude/rules');
const rules = existsSync(rulesDir)
  ? readdirSync(rulesDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''))
      .sort()
  : [];
if (rules.length === 0) process.exit(0);

const byPrefix = new Map();
for (const slug of rules) {
  const prefix = slug.split('-')[0];
  if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
  byPrefix.get(prefix).push(slug);
}
const grouped = [...byPrefix.entries()]
  .map(([prefix, list]) => `  ${prefix}: ${list.join(', ')}`)
  .join('\n');

const context =
  `Pre-commit rule-audit (green-before-commit). Before finalizing this ` +
  `commit, map the staged diff against each project rule and state the result — especially the ` +
  `semantic ones no hook can gate, e.g. structure-lib-layers (thin handlers), ` +
  `contract-derive-schema (DTO derived from the row schema, not re-declared or app-type-shared), ` +
  `naming-backend-layers, gen-via-generator.\n` +
  `Rules to audit (grouped by prefix):\n${grouped}`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: context },
  }),
);
process.exit(0);

function readJsonStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
    process.stdin.on('error', () => resolve(null));
  });
}
