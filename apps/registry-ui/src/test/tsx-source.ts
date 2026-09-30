import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import ts from 'typescript';

/** The app's root; every path this module returns is relative to it. */
export const APP_ROOT = resolve(import.meta.dirname, '../..');

/** What the registry publishes: its composed items, its block and their examples. */
const REGISTRY_ITEMS = [
  'registry/bases/base-ui/components',
  'registry/bases/base-ui/blocks',
  'registry/bases/base-ui/examples',
];

function walk(dir: string, ext: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, ext);
    return entry.name.endsWith(ext) && !entry.name.includes('.spec.') && !entry.name.startsWith('__') ? [path] : [];
  });
}

function tsxUnder(dirs: string[]): string[] {
  return dirs
    .flatMap((dir) => walk(join(APP_ROOT, dir), '.tsx'))
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

/** Every `.tsx` module the registry publishes, generated indexes and specs excluded. The class rules bind these. */
export function registryItemTsx(): string[] {
  return tsxUnder(REGISTRY_ITEMS);
}

/** Every authored `.tsx` module: the registry's items and the docs site in `src/`. The class and copy rules bind these. */
export function authoredTsx(): string[] {
  return tsxUnder(['src', ...REGISTRY_ITEMS]);
}

/** Every layout under `src/app`, the only modules that may declare a layout variable. */
export function siteLayouts(): string[] {
  return tsxUnder(['src/app']).filter((file) => file.endsWith('/layout.tsx'));
}

/** Every MDX page under `content/docs`. */
export function docsPages(): string[] {
  return walk(join(APP_ROOT, 'content/docs'), '.mdx')
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

/** Every `meta.json` under `content/docs`. */
export function docsMetas(): string[] {
  return walk(join(APP_ROOT, 'content/docs'), 'meta.json')
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

/** A repo-relative file's own text, read fresh each call. */
export function readSource(file: string): string {
  return readFileSync(join(APP_ROOT, file), 'utf8');
}

/** Parses `text` as a `.tsx` module named `file`; `text` never comes off disk here, so a fixture can stand in for it. */
export function parseTsxSource(file: string, text: string): ts.SourceFile {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

export function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

/** The literal text pieces inside an expression: strings, and a template's static parts. */
export function literalTexts(node: ts.Node): string[] {
  const texts: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) texts.push(child.text);
    else if (ts.isTemplateExpression(child)) {
      texts.push(child.head.text, ...child.templateSpans.map((span) => span.literal.text));
      child.templateSpans.forEach((span) => visit(span.expression));
    } else ts.forEachChild(child, visit);
  };
  visit(node);
  return texts;
}
