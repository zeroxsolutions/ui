#!/usr/bin/env node
// PreToolUse gate - blocks destructive ops against curated iac/modules + state.
//
// Why this exists: the iac-modules-extend-not-rewrite rule makes iac/modules/*
// curated scaffold assets - extend them, never delete/rewrite to reshape. A loaded
// rule still depends on the agent re-reading it at the decision point, which is
// unreliable. This hook fails the action regardless, the same shape as
// block-manual-project.mjs / block-git-no-verify.mjs.
//
// What it blocks (unambiguous destructive ops only; edits/extends stay free):
//   - deleting a file/dir under iac/modules: `rm`, `rmdir`, `git rm`, `find ... -delete`
//   - nuking state/infra: `terraform destroy`, `terraform state rm|mv|delete`
// Write/Edit and `terraform init|plan|apply|validate|fmt|workspace` are never blocked.
// A human-directed op overrides with `IAC_ALLOW_DESTRUCT=1`.
//
// Protocol: read the PreToolUse payload from stdin; exit 2 + stderr to block,
// exit 0 to allow. See .claude/rules/iac-modules-extend-not-rewrite.md.

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload || payload.tool_name !== 'Bash') process.exit(0);

const command = payload?.tool_input?.command;
if (typeof command !== 'string' || command.length === 0) process.exit(0);

const projectDir = payload.cwd || process.cwd();
const cwdUnderIac = /(^|\/)iac\/?$/.test(projectDir) || /\/iac\//.test(projectDir);

// Strip quoted strings so a commit message or echo that merely mentions a path or
// "destroy" can't trip the gate; a real target is never quoted.
const unquoted = command.replace(/"(?:\\.|[^"\\])*"/g, '').replace(/'[^']*'/g, '');

// Human-directed override: the env var set in the session, OR the inline
// `IAC_ALLOW_DESTRUCT=1` prefix on the command itself (the prefix only sets env for
// the child process at bash-run time, which this PreToolUse process never sees, so
// detect it in the string).
const override =
  process.env.IAC_ALLOW_DESTRUCT === '1' ||
  /\bIAC_ALLOW_DESTRUCT\s*=\s*1\b/.test(unquoted);
if (override) process.exit(0);

// A path token that means "under iac/modules": `iac/modules` (with or without a
// trailing path), OR a bare `modules` when the command runs from inside the iac/ root.
// `\b` / `(^|\s|\/)` boundaries keep this from matching `node_modules` or `moniac`.
const modulesToken = cwdUnderIac ? /(^|\s|\/)modules\b/ : /\biac\/modules\b/;

const rmModules =
  /\b(rm|rmdir|unlink)\b/.test(unquoted) && modulesToken.test(unquoted);
const gitRmModules = /\bgit\s+rm\b/.test(unquoted) && modulesToken.test(unquoted);
const findDeleteModules =
  /\bfind\b/.test(unquoted) &&
  modulesToken.test(unquoted) &&
  /(-delete|-exec\s+rm\b)/.test(unquoted);

// terraform state/infra destruction; any cwd (state replace-provider / list / show
// / pull / push are intentionally NOT matched).
const tfDestructive = /\bterraform\s+(destroy|state\s+(rm|mv|delete))\b/.test(unquoted);

if (!(rmModules || gitRmModules || findDeleteModules || tfDestructive)) process.exit(0);

process.stderr.write(
  `BLOCKED by .claude/hooks/block-iac-destruct - destructive op against curated iac assets:\n` +
    `  ${command}\n\n` +
    `iac-modules-extend-not-rewrite: iac/modules/* and iac state/infra are curated\n` +
    `scaffold assets - extend them, never delete to reshape, and never terraform destroy /\n` +
    `state rm on a whim. To run a human-directed destructive op:\n` +
    `  IAC_ALLOW_DESTRUCT=1 <command>\n` +
    `See .claude/rules/iac-modules-extend-not-rewrite.md.\n`,
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
