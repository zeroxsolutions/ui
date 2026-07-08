#!/usr/bin/env node
// PreToolUse gate — blocks putting secret-looking keys in a wrangler `vars` block.
//
// build-and-deploy rule: "Secrets NEVER in vars." Firebase service-account keys,
// database URLs, app secrets and tokens must be set via `wrangler secret put` or
// Terraform — never committed in wrangler.jsonc `vars`. This walks every `vars`
// object (top-level and under env.<name>.vars) and blocks if any key looks like a
// secret. See .claude/rules/secrets-and-logging.md.

if (process.stdin.isTTY) process.exit(0);

const payload = await readJsonStdin();
if (!payload) process.exit(0);

const toolName = payload.tool_name;
if (toolName !== 'Write' && toolName !== 'Edit') process.exit(0);

const filePath = payload?.tool_input?.file_path;
if (typeof filePath !== 'string' || !/wrangler\.(jsonc?|toml)$/.test(filePath)) process.exit(0);

// Write carries the whole file; Edit carries only the replacement snippet.
const content = toolName === 'Write' ? payload?.tool_input?.content : payload?.tool_input?.new_string;
if (typeof content !== 'string' || content.length === 0) process.exit(0);

// A key is a secret if its name carries one of these markers (PROJECT_ID, APP_ID,
// binding names like HYPERDRIVE deliberately do NOT match — they are not secrets).
const SECRET_KEY = /(PRIVATE_KEY|_SECRET|SECRET_|CLIENT_SECRET|SERVICE_ACCOUNT|DATABASE_URL|CONNECTION_STRING|_TOKEN|PASSWORD|PASSWD|CREDENTIAL|API_KEY|ACCESS_KEY)/i;

const offenders = findSecretVarKeys(content);
if (offenders.length === 0) process.exit(0);

process.stderr.write(
  `BLOCKED by .claude/hooks/block-secrets-in-vars — secret-looking key(s) in a wrangler \`vars\` block:\n` +
    offenders.map((key) => `  - ${key}`).join('\n') +
    `\n\nbuild-and-deploy forbids secrets in \`vars\`. Set them with\n` +
    `  wrangler secret put <NAME> --env <env>\n` +
    `or provision via Terraform, and reference bindings (not inline values). Keep local\n` +
    `dev secrets in a gitignored .dev.vars. See .claude/rules/secrets-and-logging.md.\n`,
);
process.exit(2);

// Returns the names of secret-looking keys found inside any `vars` object.
function findSecretVarKeys(raw) {
  const parsed = tryParseJsonc(raw);
  if (parsed) return [...collectFromVarsObjects(parsed)];
  // Edit snippet / TOML / unparseable: fall back to a line scan for `KEY:`/`KEY =`.
  const found = new Set();
  for (const line of raw.split('\n')) {
    const match = line.match(/['"]?([A-Z0-9_]+)['"]?\s*[:=]/);
    if (match && SECRET_KEY.test(match[1])) found.add(match[1]);
  }
  return [...found];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Walk the whole tree; whenever a `vars` object is hit, flag its secret-looking keys.
function collectFromVarsObjects(node, out = new Set()) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectFromVarsObjects(item, out);
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'vars' && isPlainObject(value)) {
      for (const varKey of Object.keys(value)) {
        if (SECRET_KEY.test(varKey)) out.add(varKey);
      }
    }
    collectFromVarsObjects(value, out);
  }
  return out;
}

function tryParseJsonc(raw) {
  try {
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(stripped);
  } catch {
    return null;
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
