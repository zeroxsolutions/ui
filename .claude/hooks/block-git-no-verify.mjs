#!/usr/bin/env node
// PreToolUse gate — blocks bypassing the husky verification gate.
//
// git-workflow rule: "Get the work green first; don't bypass with --no-verify."
// The pre-commit hook runs `nx run-many -t lint build test`; skipping it lets
// broken work land. This catches --no-verify (commit/push), the short -n on a
// commit, and the HUSKY=0 env bypass — regardless of whether the agent recalls
// the rule. See .claude/rules/green-before-commit.md.

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload || payload.tool_name !== 'Bash') process.exit(0);

const command = payload?.tool_input?.command;
if (typeof command !== 'string' || command.length === 0) process.exit(0);

// Strip quoted strings first so a commit message that merely mentions the flag
// (e.g. -m "...--no-verify...") can't trip the gate — a real bypass flag is never quoted.
const unquoted = command.replace(/"(?:\\.|[^"\\])*"/g, '').replace(/'[^']*'/g, '');

const bypass =
  /--no-verify\b/.test(unquoted) ||
  /\bHUSKY=0\b/.test(unquoted) ||
  /\bgit\s+commit\b[^|;&]*\s-n(?:\s|$)/.test(unquoted);
if (!bypass) process.exit(0);

process.stderr.write(
  `BLOCKED by .claude/hooks/block-git-no-verify — you are bypassing the verification gate:\n` +
    `  ${command}\n\n` +
    `git-workflow forbids this: the husky pre-commit hook runs lint + build + test, and\n` +
    `the commit must fail on a red gate rather than be skipped. Get the work green, then\n` +
    `commit/push WITHOUT --no-verify (and without HUSKY=0). See .claude/rules/green-before-commit.md.\n`,
);
process.exit(2);

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
