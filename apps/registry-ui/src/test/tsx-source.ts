import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import ts from 'typescript';

/** The app's root; every path this module returns is relative to it. */
export const APP_ROOT = resolve(import.meta.dirname, '../..');

const SCANNED = [
  'src',
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

/** Every authored `.tsx` module the rules bind, generated indexes and specs excluded. */
export function authoredTsx(): string[] {
  return SCANNED.flatMap((dir) => walk(join(APP_ROOT, dir), '.tsx'))
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

/** Every MDX page under `content/docs`. */
export function docsPages(): string[] {
  return walk(join(APP_ROOT, 'content/docs'), '.mdx')
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

export function parseTsx(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(join(APP_ROOT, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
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
