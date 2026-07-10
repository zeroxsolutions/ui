#!/usr/bin/env node
// PreToolUse gate — every app must ship with its paired *-e2e project.
//
// project-structure rule: "Every app has a paired *-e2e project for end-to-end
// tests." A generator creates the sibling automatically; a hand-rolled app (the
// jobs-cron / grading-queue mistake) silently skips it. This blocks a `git commit`
// while any apps/<x> lacks apps/<x>-e2e — a backstop behind block-manual-project.
// See .claude/rules/e2e-pairs-each-app.md.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload || payload.tool_name !== 'Bash') process.exit(0);

const command = payload?.tool_input?.command;
if (typeof command !== 'string' || !/\bgit\s+commit\b/.test(command)) process.exit(0);

const projectDir = payload.cwd || process.cwd();
const appsDir = join(projectDir, 'apps');
if (!existsSync(appsDir)) process.exit(0);

const orphans = readdirSync(appsDir).filter((name) => {
  if (name.endsWith('-e2e')) return false;
  const appPath = join(appsDir, name);
  if (!isDir(appPath) || !existsSync(join(appPath, 'package.json'))) return false;
  // A Storybook host (owns a `.storybook/` config) is tested by its own
  // `test-storybook` target via @storybook/test-runner — the modern-Nx idiom
  // (v21+ removed the sibling `storybook-e2e` Cypress generator), so it needs no
  // `*-e2e` sibling. See .agents/rules/e2e-pairs-each-app.md.
  if (isDir(join(appPath, '.storybook'))) return false;
  return !isDir(join(appsDir, `${name}-e2e`));
});
if (orphans.length === 0) process.exit(0);

process.stderr.write(
  `BLOCKED by .claude/hooks/block-app-without-e2e — app(s) missing the required *-e2e sibling:\n` +
    orphans.map((name) => `  - apps/${name}  (expected apps/${name}-e2e)`).join('\n') +
    `\n\nproject-structure requires every app to have a paired *-e2e project. Scaffold the\n` +
    `app with its nx generator (which creates the e2e sibling) rather than by hand —\n` +
    `e.g. \`nx g @nx/node:application <name> --e2eTestRunner=jest\`. See\n` +
    `.claude/rules/e2e-pairs-each-app.md.\n`,
);
process.exit(2);

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

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
