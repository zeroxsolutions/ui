// @vitest-environment node
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { authoredTsx, lineOf, literalTexts, parseTsxSource, readSource, siteLayouts } from './src/test/tsx-source';

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
const VARIABLE_DECLARATION = /^\[--([\w-]+):/;
/** A colour literal or function inside a custom property's value: `#hex`, `rgb(`/`rgba(`, `hsl(`/`hsla(`, `oklch(`, `oklab(`, `lab(`, `lch(`, `color(`. */
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/;
const PRIMITIVE_MODULE = /\/registry\/bases\/base-ui\/ui\//;
/** A bracketed value, whose terms may make it a layout size. */
const BRACKETED = /^-?[a-z-]+-\[([^\]]*)\]$/;
/** The terms a layout size is built from: variables, `calc`, `minmax`, bare numbers and viewport, percent and fraction units. */
const LAYOUT_SIZE_TERM = /var\(--[\w-]+\)|calc|minmax|\d+(?:\.\d+)?(?:svh|dvh|lvh|vh|%|fr)?|[-+*/(),_]/g;
/** A variant that reaches past the element into its children: `*:`, `**:`, `[&_x]:`, `[&>x]:`. */
const DESCENDANT_VARIANT = /(?:^|:)(?:\*{1,2}|\[&[^\]]*[\s_>~+][^\]]*\]):/;
/** The theme's spacing unit, which a layout size may scale. */
const SPACING = 'spacing';

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

/**
 * Whether `utility` sizes a region from the layout's declared variables alone, such as
 * `h-[calc(100svh-var(--header-height))]` or `grid-cols-[var(--sidebar-width)_minmax(0,1fr)]`.
 */
function isLayoutSize(utility: string, layoutVariables: ReadonlySet<string>): boolean {
  const body = BRACKETED.exec(utility)?.[1];
  if (body === undefined) return false;
  const terms = body.match(LAYOUT_SIZE_TERM) ?? [];
  if (terms.join('') !== body) return false;
  const names = terms.flatMap((term) => /^var\(--([\w-]+)\)$/.exec(term)?.[1] ?? []);
  return (
    names.some((name) => layoutVariables.has(name)) &&
    names.every((name) => name === SPACING || layoutVariables.has(name))
  );
}

interface ClassContext {
  /** The class sits on a vendored primitive. */
  onPrimitive?: boolean;
  /** The class reaches a primitive through a descendant variant; only the docs site is held to this. */
  reachesChildren?: boolean;
  /** The variables the site's layouts declare, which a layout size may use. */
  layoutVariables?: ReadonlySet<string>;
  /** Whether a custom property may be declared here: anywhere in the registry, only a layout in the site. */
  mayDeclare?: boolean;
}

/** Which rule a class breaks, or null. */
export function classViolation(
  className: string,
  { onPrimitive = false, reachesChildren = false, layoutVariables = new Set(), mayDeclare = true }: ClassContext = {},
): string | null {
  const utility = utilityOf(className);
  if (PALETTE.test(utility)) return 'palette colour';
  if (isLayoutSize(utility, layoutVariables)) return null;
  const declaresVariable = VARIABLE_DECLARATION.test(utility);
  if (declaresVariable && !mayDeclare) return 'arbitrary value';
  if (utility.includes('[') && (!declaresVariable || COLOR_LITERAL.test(utility))) return 'arbitrary value';
  const restyles = onPrimitive || (reachesChildren && DESCENDANT_VARIANT.test(className));
  if (restyles && PRIMITIVE_LOOK.test(utility) && !LAYOUT_KEPT.test(utility)) return 'restyles a primitive';
  return null;
}

/** The custom properties a module declares, as a class (`[--x:...]`) or a style key (`'--x':`). */
function declaredVariables(text: string): string[] {
  return [...text.matchAll(/\[--([\w-]+):|['"]--([\w-]+)['"]\s*:/g)].map((match) => match[1] ?? match[2]);
}

/** Each variable a site layout declares, with the layouts that declare it. */
function layoutDeclarations(): Map<string, string[]> {
  const declarations = new Map<string, string[]>();
  siteLayouts().forEach((file) =>
    new Set(declaredVariables(readSource(file))).forEach((name) =>
      declarations.set(name, [...(declarations.get(name) ?? []), file]),
    ),
  );
  return declarations;
}

interface Violation {
  file: string;
  line: number;
  className: string;
  rule: string;
}

/** Whether `file` is the docs site's own, which the rules hold more tightly than a registry item's recipe. */
function isSite(file: string): boolean {
  return file.startsWith('src/');
}

function violationsIn(file: string, text: string, layoutVariables: ReadonlySet<string> = new Set()): Violation[] {
  const source = parseTsxSource(file, text);
  const primitives = new Set<string>();
  source.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
    if (!PRIMITIVE_MODULE.test(statement.moduleSpecifier.text)) return;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((e) => primitives.add(e.name.text));
  });
  const site = isSite(file);
  const mayDeclare = !site || file.endsWith('/layout.tsx');

  const found: Violation[] = [];
  const check = (node: ts.Node, onPrimitive: boolean): void => {
    literalTexts(node)
      .flatMap((text) => text.split(/\s+/).filter(Boolean))
      .forEach((className) => {
        const rule = classViolation(className, { onPrimitive, reachesChildren: site, layoutVariables, mayDeclare });
        if (rule) found.push({ file, line: lineOf(source, node), className, rule });
      });
  };
  // A primitive's own recipe (`buttonVariants(...)`) merged with more classes restyles that primitive too.
  const callsPrimitiveRecipe = (node: ts.CallExpression): boolean =>
    node.arguments.some(
      (argument) => ts.isCallExpression(argument) && primitives.has(argument.expression.getText(source)),
    );
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'className' && node.initializer) {
      const element = node.parent.parent;
      const tag =
        ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName.getText(source) : '';
      let mergesRecipe = false;
      const findRecipe = (child: ts.Node): void => {
        if (ts.isCallExpression(child) && callsPrimitiveRecipe(child)) mergesRecipe = true;
        ts.forEachChild(child, findRecipe);
      };
      findRecipe(node.initializer);
      check(node.initializer, primitives.has(tag.split('.')[0]) || (site && mergesRecipe));
      return;
    }
    if (ts.isCallExpression(node) && ['cn', 'cva'].includes(node.expression.getText(source))) {
      const onPrimitive = site && callsPrimitiveRecipe(node);
      node.arguments.forEach((argument) => check(argument, onPrimitive));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('classViolation', () => {
  const layoutVariables = new Set(['header-height', 'sidebar-width']);

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
    expect(classViolation(className, { onPrimitive })).toBe(rule);
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
    expect(classViolation(className, { onPrimitive })).toBeNull();
  });

  it.each([
    'top-[calc(var(--header-height)+1px)]',
    'h-[calc(100svh-10rem)]',
    'h-[calc(100svh-var(--footer-height))]',
    'h-[calc(var(--spacing)*8)]',
    'h-[90svh]',
  ])('%s, a size not built from the layout variables alone, is an arbitrary value', (className) => {
    expect(classViolation(className, { onPrimitive: true, layoutVariables })).toBe('arbitrary value');
  });

  it.each([
    'h-[calc(100svh-var(--header-height))]',
    'lg:h-[calc(100svh-var(--header-height)-var(--spacing)*8)]',
    'w-[calc(var(--sidebar-width)*2)]',
    'lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]',
  ])('%s sizes a region from the layout variables, on a primitive too', (className) => {
    expect(classViolation(className, { onPrimitive: true, layoutVariables })).toBeNull();
  });

  it('refuses a custom property declared outside a layout, where the site allows none', () => {
    expect(classViolation('[--sidebar-menu-width:--spacing(56)]', { mayDeclare: false })).toBe('arbitrary value');
  });

  it.each(['**:data-[slot=command-input]:h-9', '*:data-[slot=button]:rounded-lg', '[&_svg]:size-4.5'])(
    '%s reaches into a child and restyles it',
    (className) => {
      expect(classViolation(className, { reachesChildren: true })).toBe('restyles a primitive');
    },
  );

  it('keeps a descendant variant that only places the child', () => {
    expect(classViolation('**:data-[slot=code-block]:w-full', { reachesChildren: true })).toBeNull();
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

  it("holds classes merged into a primitive's own recipe to the primitive rule, in the site", () => {
    const source = [
      "import { buttonVariants } from '@/registry/bases/base-ui/ui/button';",
      '',
      "const link = <a className={cn(buttonVariants({ size: 'icon' }), 'size-8 ml-auto')} />;",
    ].join('\n');

    expect(violationsIn('src/fixture.tsx', source).map(({ className, rule }) => ({ className, rule }))).toEqual([
      { className: 'size-8', rule: 'restyles a primitive' },
    ]);
  });
});

describe('the layout variables', () => {
  it('are each declared by one layout', () => {
    expect(
      [...layoutDeclarations()]
        .filter(([, files]) => files.length > 1)
        .map(([name, files]) => `${name}: ${files.join(', ')}`),
    ).toEqual([]);
  });
});

describe('the registry items and the docs site', () => {
  const files = authoredTsx();
  const layoutVariables = new Set(layoutDeclarations().keys());

  it('keep every rebuilt module to the class rules', () => {
    expect(
      files
        .filter((file) => !PENDING.includes(file))
        .flatMap((file) => violationsIn(file, readSource(file), layoutVariables)),
    ).toEqual([]);
  });

  it('list as pending only modules that still break a rule', () => {
    expect(
      PENDING.filter(
        (file) => !files.includes(file) || violationsIn(file, readSource(file), layoutVariables).length === 0,
      ),
    ).toEqual([]);
  });
});
