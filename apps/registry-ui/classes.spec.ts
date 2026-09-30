// @vitest-environment node
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { authoredTsx, lineOf, literalTexts, parseTsx } from './src/test/tsx-source';

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
  'registry/bases/base-ui/components/layout/avatar-picker.tsx',
  'registry/bases/base-ui/components/layout/collapsible-card.tsx',
  'registry/bases/base-ui/components/layout/model-list.tsx',
  'registry/bases/base-ui/components/layout/panel-field-group.tsx',
  'registry/bases/base-ui/components/layout/panel-row.tsx',
  'registry/bases/base-ui/components/layout/reasoning-collapsible.tsx',
  'registry/bases/base-ui/components/layout/tool-call-card.tsx',
  'registry/bases/base-ui/examples/avatar-picker-demo.tsx',
  'registry/bases/base-ui/examples/icon-chip-demo.tsx',
  'registry/bases/base-ui/examples/model-info-card-demo.tsx',
  'src/app/(app)/docs/[[...slug]]/page.tsx',
  'src/app/(app)/docs/layout.tsx',
  'src/components/data-display/block-frame.tsx',
  'src/components/data-display/component-preview.tsx',
  'src/components/navigation/command-menu.tsx',
  'src/components/navigation/docs-toc.tsx',
  'src/components/navigation/mobile-nav.tsx',
  'src/mdx-components.tsx',
];

const PALETTE =
  /^-?(?:text|bg|border(?:-[xytrbl])?|ring|fill|stroke|outline|from|via|to|decoration|divide|shadow|accent|caret|placeholder)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)(?:-\d{2,3})?(?:\/\d+)?$/;
const PRIMITIVE_LOOK =
  /^-?(?:h|min-h|max-h|size|p[xytrblse]?|rounded(?:-[a-z]+)?|text|font|leading|tracking|bg|border(?:-[xytrbl])?|ring|shadow)(?:-|$)/;
const LAYOUT_KEPT =
  /^(?:(?:h|min-h|max-h|size)-(?:full|auto|0|fit|min|max|none|svh)|text-(?:left|center|right|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)|font-(?:mono|sans))$/;
const VARIABLE_DECLARATION = /^\[--[\w-]+:/;
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
  if (utility.includes('[') && !VARIABLE_DECLARATION.test(utility)) return 'arbitrary value';
  if (onPrimitive && PRIMITIVE_LOOK.test(utility) && !LAYOUT_KEPT.test(utility)) return 'restyles a primitive';
  return null;
}

interface Violation {
  file: string;
  line: number;
  className: string;
  rule: string;
}

function violationsIn(file: string): Violation[] {
  const source = parseTsx(file);
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
    ['text-[0.85em]', false, 'arbitrary value'],
    ['top-[calc(var(--x)+1px)]', false, 'arbitrary value'],
    ['h-8', true, 'restyles a primitive'],
    ['px-6', true, 'restyles a primitive'],
    ['rounded-full', true, 'restyles a primitive'],
    ['text-muted-foreground', true, 'restyles a primitive'],
    ['[&_svg]:size-3', true, 'restyles a primitive'],
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
    ['w-(--sidebar-width)', false],
    ['text-muted-foreground', false],
    ['px-6', false],
  ])('%s (on a primitive: %s) is allowed', (className, onPrimitive) => {
    expect(classViolation(className, onPrimitive)).toBeNull();
  });
});

describe('the authored modules', () => {
  const files = authoredTsx();

  it('keep every rebuilt module to the class rules', () => {
    expect(files.filter((file) => !PENDING.includes(file)).flatMap(violationsIn)).toEqual([]);
  });

  it('list as pending only modules that still break a rule', () => {
    expect(PENDING.filter((file) => !files.includes(file) || violationsIn(file).length === 0)).toEqual([]);
  });
});
