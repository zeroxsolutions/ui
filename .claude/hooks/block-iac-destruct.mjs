#!/usr/bin/env node
// PreToolUse gate - blocks destructive ops against curated iac/modules + state.
//
// Why this exists: the iac-modules-extend-not-rewrite rule makes iac/modules/*
// curated scaffold assets. A loaded rule still depends on the agent re-reading it;
// this hook fails the action regardless, the same shape as block-manual-project.mjs.
//
// What it blocks (unambiguous destructive ops only - edits/extends stay free):
//   - deleting a file/dir under iac/modules: rm/rmdir/unlink, git rm, find ... -delete
//   - nuking state/infra: terraform destroy, terraform state rm|mv|delete
// Write/Edit and terraform init|plan|apply|validate|fmt|workspace are never blocked.
// A human-directed op overrides with IAC_ALLOW_DESTRUCT=1.
//
// Target resolution (v2): the command is split on separators (&& || ; | newline),
// cwd is tracked through `cd`, and each rm/git-rm/find target is resolved against
// that cwd. Only a target actually under iac/modules blocks - so an unrelated
// `rm /tmp/x` in the same command as a `cd iac/modules && grep` no longer trips it
// (the v1 "rm + iac/modules anywhere" check had that false positive).
//
// Protocol: read the PreToolUse payload from stdin; exit 2 + stderr to block,
// exit 0 to allow. See .claude/rules/iac-modules-extend-not-rewrite.md.

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload || payload.tool_name !== 'Bash') process.exit(0);

const command = payload?.tool_input?.command;
if (typeof command !== 'string' || command.length === 0) process.exit(0);

const projectDir = payload.cwd || process.cwd();

// Human-directed override: env var set in the session, OR inline prefix on the
// command string (the prefix sets env for the child at run time, which this
// PreToolUse process never sees, so detect it in the string).
const unquoted = command.replace(/"(?:\\.|[^"\\])*"/g, '').replace(/'[^']*'/g, '');
if (
  process.env.IAC_ALLOW_DESTRUCT === '1' ||
  /\bIAC_ALLOW_DESTRUCT\s*=\s*1\b/.test(unquoted)
)
  process.exit(0);

const MODULES_RE = /(^|\/)iac\/modules(\/|$)/;
const norm = (p) => p.replace(/\/+/g, '/').replace(/\/\.(?=\/)/g, '').replace(/\/$/, '') || '/';
const resolve = (p, cwd) => norm(p.startsWith('/') ? p : `${cwd}/${p}`);
const stripQ = (p) => p.replace(/^["']|["']$/g, '');
const isFlag = (t) => /^(-[A-Za-z]+|--[A-Za-z-]+)$/.test(t);

let trackedCwd = norm(projectDir);
const hits = [];

for (const raw of command.split(/\s*(?:&&|\|\||;|\||\n)\s*/)) {
  const seg = raw.trim();
  if (!seg) continue;

  // Track cwd through `cd` (and `pushd`) so a later rm resolves relative to it.
  const cd = seg.match(/^(?:sudo\s+)?(?:cd|pushd)\s+(.+)$/);
  if (cd) {
    trackedCwd = resolve(stripQ(cd[1].trim()), trackedCwd);
    continue;
  }

  const cmd = seg.replace(/^(sudo\s+)?/, '');
  const underIac = MODULES_RE.test(trackedCwd);

  // rm / rmdir / unlink - resolve each non-flag arg; block if it lands under iac/modules.
  if (/^(rm|rmdir|unlink)\b/.test(cmd)) {
    for (const p of cmd.split(/\s+/).slice(1)) {
      if (!p || isFlag(p)) continue;
      if (MODULES_RE.test(resolve(stripQ(p), trackedCwd))) hits.push(seg);
    }
    continue;
  }

  // git rm <paths> - same resolution.
  const grm = cmd.match(/^git\s+rm\b(.*)$/);
  if (grm) {
    for (const p of grm[1].trim().split(/\s+/)) {
      if (!p || isFlag(p)) continue;
      if (MODULES_RE.test(resolve(stripQ(p), trackedCwd))) hits.push(seg);
    }
    continue;
  }

  // find <path> ... -delete / -exec rm - block only if the search root is under iac/modules
  // (or cwd is, when find has no explicit path).
  if (/^find\b/.test(cmd) && /(-delete|-exec\s+rm\b)/.test(cmd)) {
    const args = cmd.split(/\s+/).slice(1).filter((t) => !isFlag(t) && t !== '-delete');
    const root = args[0] ? resolve(stripQ(args[0]), trackedCwd) : trackedCwd;
    if (MODULES_RE.test(root)) hits.push(seg);
    continue;
  }

  // terraform destroy / state rm|mv|delete - destructive regardless of path.
  if (/\bterraform\s+(destroy|state\s+(rm|mv|delete))\b/.test(seg)) hits.push(seg);
}

if (hits.length === 0) process.exit(0);

process.stderr.write(
  `BLOCKED by .claude/hooks/block-iac-destruct - destructive op against curated iac assets:\n` +
    hits.map((s) => `  ${s}`).join('\n') +
    `\n\niac-modules-extend-not-rewrite: iac/modules/* and iac state/infra are curated\n` +
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
