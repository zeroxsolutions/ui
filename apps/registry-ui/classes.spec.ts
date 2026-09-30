// @vitest-environment node
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { lineOf, literalTexts, parseTsxSource, readSource, registryItemTsx } from './src/test/tsx-source';

/** Files not rebuilt on base-nova yet; each task that rebuilds one removes it. */
const PENDING: readonly string[] = [
  'registry/bases/base-ui/components/data-display/ai-provider-card.tsx',
  'registry/bases/base-ui/components/data-display/chat-message.tsx',
  'registry/bases/base-ui/components/data-display/data-table.tsx',
  'registry/bases/base-ui/components/data-display/image-preview.tsx',
  'registry/bases/base-ui/components/data-display/markdown-view.tsx',
  'registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx',
  'registry/bases/base-ui/components/data-entry/emoji-picker.tsx',
  'registry/bases/base-ui/components/data-entry/tag-input.tsx',
  'registry/bases/base-ui/components/data-entry/tree-item.tsx',
  'registry/bases/base-ui/components/general/panel-field-label.tsx',
  'registry/bases/base-ui/examples/icon-chip-demo.tsx',
  'registry/bases/base-ui/examples/model-info-card-demo.tsx',
];

/** Utilities that paint with a theme colour: `<prefix>-<hue>[-<shade>]`, or the css-var form `<prefix>-(--color-<hue>[-<shade>])`. */
const PALETTE_UTILITY =
  'text|bg|border(?:-[xytrbl])?|ring|ring-offset|inset-ring|fill|stroke|outline|from|via|to|decoration|divide|shadow|accent|caret|placeholder';
/** Every hue Tailwind's installed theme (`tailwindcss/theme.css`) names, `black` and `white` included. */
const PALETTE_HUE =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|black|white';
const PALETTE = new RegExp(
  `^-?(?:${PALETTE_UTILITY})-(?:(?:${PALETTE_HUE})(?:-\\d{2,3})?|\\(--color-(?:${PALETTE_HUE})(?:-\\d{2,3})?\\))(?:/\\d+)?$`,
);
const PRIMITIVE_LOOK =
  /^-?(?:h|min-h|max-h|size|p[xytrblse]?|rounded(?:-[a-z]+)?|text|font|leading|tracking|bg|border(?:-[xytrbl])?|ring|shadow|fill|stroke|outline|decoration)(?:-|$)/;
const LAYOUT_KEPT =
  /^(?:(?:h|min-h|max-h|size)-(?:full|auto|0|fit|min|max|none|svh)|text-(?:left|center|right|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)|font-(?:mono|sans)|outline-(?:none|hidden))$/;
const VARIABLE_DECLARATION = /^\[--[\w-]+:/;
/** A colour literal or function inside a custom property's value: `#hex`, `rgb(`/`rgba(`, `hsl(`/`hsla(`, `oklch(`, `oklab(`, `lab(`, `lch(`, `color(`. */
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/;
const PRIMITIVE_MODULE = /\/registry\/bases\/base-ui\/ui\//;

/** A class with its variants (`md:`, `data-[x]:`, `[&_svg]:`) and importance marks removed. */
function utilityOf(className: string): string {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className[i];
    if (char === '[' || char === '(') depth++;
    else if (char === ']' || char === ')') depth--;
    else if (char === ':' && depth === 0) start = i + 1;
  }
  return className.slice(start).replace(/^!|!$/g, '');
}

/** Which rule a class breaks, or null. `onPrimitive` is whether it sits on a vendored primitive. */
export function classViolation(className: string, onPrimitive: boolean): string | null {
  const utility = utilityOf(className);
  if (PALETTE.test(utility)) return 'palette colour';
  const declaresVariable = VARIABLE_DECLARATION.test(utility);
  if (utility.includes('[') && (!declaresVariable || COLOR_LITERAL.test(utility))) return 'arbitrary value';
  if (onPrimitive && PRIMITIVE_LOOK.test(utility) && !LAYOUT_KEPT.test(utility)) return 'restyles a primitive';
  return null;
}

interface Violation {
  file: string;
  line: number;
  className: string;
  rule: string;
}

function violationsIn(file: string, text: string): Violation[] {
  const source = parseTsxSource(file, text);
  const primitives = new Set<string>();
  source.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
    if (!PRIMITIVE_MODULE.test(statement.moduleSpecifier.text)) return;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((e) => primitives.add(e.name.text));
  });

  const found: Violation[] = [];
  const check = (node: ts.Node, onPrimitive: boolean): void => {
    literalTexts(node)
      .flatMap((text) => text.split(/\s+/).filter(Boolean))
      .forEach((className) => {
        const rule = classViolation(className, onPrimitive);
        if (rule) found.push({ file, line: lineOf(source, node), className, rule });
      });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'className' && node.initializer) {
      const element = node.parent.parent;
      const tag =
        ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName.getText(source) : '';
      check(node.initializer, primitives.has(tag.split('.')[0]));
      return;
    }
    if (ts.isCallExpression(node) && ['cn', 'cva'].includes(node.expression.getText(source))) {
      node.arguments.forEach((argument) => check(argument, false));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('classViolation', () => {
  it.each([
    ['text-emerald-600', false, 'palette colour'],
    ['dark:bg-blue-500/20', false, 'palette colour'],
    ['bg-(--color-emerald-600)', false, 'palette colour'],
    ['text-(--color-blue-500)', true, 'palette colour'],
    ['bg-(--color-emerald-600)/50', false, 'palette colour'],
    ['ring-offset-blue-500', false, 'palette colour'],
    ['inset-ring-emerald-600', false, 'palette colour'],
    ['bg-mauve-500', false, 'palette colour'],
    ['text-[0.85em]', false, 'arbitrary value'],
    ['top-[calc(var(--x)+1px)]', false, 'arbitrary value'],
    ['[--c:#10b981]', false, 'arbitrary value'],
    ['h-8', true, 'restyles a primitive'],
    ['px-6', true, 'restyles a primitive'],
    ['rounded-full', true, 'restyles a primitive'],
    ['text-muted-foreground', true, 'restyles a primitive'],
    ['[&_svg]:size-3', true, 'restyles a primitive'],
    ['fill-current', true, 'restyles a primitive'],
    ['stroke-2', true, 'restyles a primitive'],
    ['decoration-dotted', true, 'restyles a primitive'],
    ['outline-2', true, 'restyles a primitive'],
  ])('%s (on a primitive: %s) breaks "%s"', (className, onPrimitive, rule) => {
    expect(classViolation(className, onPrimitive)).toBe(rule);
  });

  it.each([
    ['w-full', true],
    ['md:flex', true],
    ['h-full', true],
    ['text-left', true],
    ['data-[active=true]:flex', true],
    ['[--sidebar-width:--spacing(72)]', false],
    ['[--radius:8px]', false],
    ['w-(--sidebar-width)', false],
    ['text-muted-foreground', false],
    ['px-6', false],
    ['outline-none', true],
    ['outline-hidden', true],
  ])('%s (on a primitive: %s) is allowed', (className, onPrimitive) => {
    expect(classViolation(className, onPrimitive)).toBeNull();
  });
});

describe('violationsIn', () => {
  it('flags a class on an imported primitive, not the same class on a plain element, and a palette colour inside cn()', () => {
    const source = [
      "import { Button } from '@/registry/bases/base-ui/ui/button';",
      '',
      'function Demo() {',
      '  return (',
      '    <>',
      '      <Button className="h-8" />',
      '      <div className="h-8" />',
      "      <div className={cn('text-emerald-600')} />",
      '    </>',
      '  );',
      '}',
    ].join('\n');

    expect(violationsIn('fixture.tsx', source).map(({ className, rule }) => ({ className, rule }))).toEqual([
      { className: 'h-8', rule: 'restyles a primitive' },
      { className: 'text-emerald-600', rule: 'palette colour' },
    ]);
  });
});

describe('the registry items', () => {
  const files = registryItemTsx();

  it('keep every rebuilt module to the class rules', () => {
    expect(
      files.filter((file) => !PENDING.includes(file)).flatMap((file) => violationsIn(file, readSource(file))),
    ).toEqual([]);
  });

  it('list as pending only modules that still break a rule', () => {
    expect(
      PENDING.filter((file) => !files.includes(file) || violationsIn(file, readSource(file)).length === 0),
    ).toEqual([]);
  });
});
