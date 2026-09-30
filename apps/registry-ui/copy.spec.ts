// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { APP_ROOT, authoredTsx, docsPages, lineOf, parseTsxSource, readSource } from './src/test/tsx-source';

/** Files whose copy is not sentence case yet; each task that rebuilds one removes it. */
const PENDING: readonly string[] = [
  'content/docs/blocks/ai-provider-picker.mdx',
  'content/docs/components/status-indicator.mdx',
  'registry/bases/base-ui/examples/collapsible-card-demo.tsx',
];

/** Names that keep their capitals wherever they sit in a sentence, beside the registry's item titles. */
const NAMES: readonly string[] = [
  'ZeroXSolutions UI',
  'ZeroXSolutions',
  'Base UI',
  'Next.js',
  'React',
  'Tailwind CSS',
  'Tailwind',
  'GitHub',
  'Markdown',
  'Lucide',
  'Geist',
  'Cloudflare',
  'Motion',
  'Fluent',
  'TypeScript',
];

const ITEM_TITLES: readonly string[] = (
  JSON.parse(readFileSync(join(APP_ROOT, 'registry.json'), 'utf8')) as { items: { title?: string }[] }
).items.flatMap((item) => (item.title ? [item.title] : []));

const COPY_ATTRIBUTES = new Set(['title', 'aria-label', 'placeholder', 'label', 'description', 'alt']);
const ACRONYM = /^[A-Z0-9]{2,}s?$/;

/** The first word that is capitalised mid-sentence without being a name or an acronym, or null. */
export function casingViolation(text: string, names: readonly string[]): string | null {
  const stripped = [...names]
    .sort((a, b) => b.length - a.length)
    .reduce((rest, name) => rest.split(name).join('name'), text.replace(/`[^`]*`/g, 'code'));
  for (const sentence of stripped.split(/(?<=[.!?:])\s+/)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    for (const raw of words.slice(1)) {
      const word = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      if (/^[A-Z][a-z]/.test(word) && !ACRONYM.test(word)) return word;
    }
  }
  return null;
}

interface CopyUse {
  file: string;
  line: number;
  text: string;
}

function tsxCopy(file: string, text: string): CopyUse[] {
  const source = parseTsxSource(file, text);
  const found: CopyUse[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, ' ').trim();
      if (/[A-Za-z]/.test(text)) found.push({ file, line: lineOf(source, node), text });
    } else if (ts.isJsxAttribute(node) && COPY_ATTRIBUTES.has(node.name.getText(source)) && node.initializer) {
      const init = node.initializer;
      const literal = ts.isStringLiteral(init)
        ? init
        : ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)
          ? init.expression
          : null;
      if (literal) found.push({ file, line: lineOf(source, node), text: literal.text });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function mdxCopy(file: string, text: string): CopyUse[] {
  let fenced = false;
  return text.split('\n').flatMap((line, index) => {
    if (line.startsWith('```')) fenced = !fenced;
    const heading = fenced ? null : /^#{1,6}\s+(.+)$/.exec(line);
    const description = /^description:\s*(.+)$/.exec(line);
    const text = heading?.[1] ?? description?.[1];
    return text ? [{ file, line: index + 1, text }] : [];
  });
}

function violationsIn(file: string, text: string): (CopyUse & { word: string })[] {
  const names = [...NAMES, ...ITEM_TITLES];
  return (file.endsWith('.mdx') ? mdxCopy(file, text) : tsxCopy(file, text)).flatMap((use) => {
    const word = casingViolation(use.text, names);
    return word ? [{ ...use, word }] : [];
  });
}

describe('casingViolation', () => {
  it.each([
    ['Copy Page', 'Page'],
    ['On This Page', 'This'],
    ['Context Length', 'Length'],
  ])('%s breaks sentence case at "%s"', (text, word) => {
    expect(casingViolation(text, NAMES)).toBe(word);
  });

  it.each([
    'Copy page',
    'Open in Base UI docs',
    'Built on Next.js and React.',
    'Run `npx shadcn add Button` first',
    'Use the AI provider',
    'Saved. Next one',
  ])('%s is sentence case', (text) => {
    expect(casingViolation(text, NAMES)).toBeNull();
  });
});

describe('tsxCopy and mdxCopy', () => {
  it('flags a JSX text and an aria-label through the copy extractor', () => {
    const source = ['function Demo() {', '  return <button aria-label="On This Page">Copy Page</button>;', '}'].join(
      '\n',
    );

    expect(violationsIn('fixture.tsx', source).map(({ text, word }) => ({ text, word }))).toEqual([
      { text: 'On This Page', word: 'This' },
      { text: 'Copy Page', word: 'Page' },
    ]);
  });

  it('ignores an mdx heading inside a fence', () => {
    const source = ['# Real Heading', '```', '## Inside A Fence', '```', 'description: Some Description'].join('\n');

    expect(mdxCopy('fixture.mdx', source).map((use) => use.text)).toEqual(['Real Heading', 'Some Description']);
  });
});

describe('the copy', () => {
  const files = [...authoredTsx(), ...docsPages()];

  it('is sentence case in every rebuilt file', () => {
    expect(
      files.filter((file) => !PENDING.includes(file)).flatMap((file) => violationsIn(file, readSource(file))),
    ).toEqual([]);
  });

  it('lists as pending only files that still break it', () => {
    expect(
      PENDING.filter((file) => !files.includes(file) || violationsIn(file, readSource(file)).length === 0),
    ).toEqual([]);
  });
});
