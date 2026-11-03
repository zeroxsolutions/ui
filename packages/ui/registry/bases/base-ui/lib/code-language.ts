/** Languages with no real grammar: no header, no highlight (plain `<pre>`). */
const PLAIN_LANGUAGES = new Set(['', 'text', 'plaintext', 'plain', 'txt']);

/** Display name for a language id; falls back to the id itself when unlisted. */
const LANGUAGE_LABEL: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  json: 'JSON',
  jsonc: 'JSON',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  rust: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  kotlin: 'Kotlin',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  php: 'PHP',
  swift: 'Swift',
  lua: 'Lua',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
  shell: 'Shell',
  shellscript: 'Shell',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  md: 'Markdown',
  mdx: 'MDX',
  markdown: 'Markdown',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  graphql: 'GraphQL',
};

/** True when `language` is absent or names plain text, so a code block shows it unhighlighted and without a header. */
function isPlainLanguage(language: string | undefined): boolean {
  return !language || PLAIN_LANGUAGES.has(language.toLowerCase());
}

/** Display name for a code-fence language id, case-insensitive; the id itself when unlisted. */
function languageLabel(language: string): string {
  return LANGUAGE_LABEL[language.toLowerCase()] ?? language;
}

export { isPlainLanguage, languageLabel };
