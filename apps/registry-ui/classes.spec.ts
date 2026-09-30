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
const VARIABLE_DECLARATION = /^\[--([\w-]+):([^\]]*)\]$/;
/** Skeleton draws no size of its own; upstream's examples size and round it by className, so these are its API. */
const SKELETON_SHAPE = /^(?:h|w|size|min-h|max-h|min-w|max-w|rounded(?:-[a-z]+)?)(?:-|$)/;
/** The terms a size is written with: the spacing unit, numbers and length units, `calc` and arithmetic. */
const SIZE_TERM =
  /var\(--spacing\)|--spacing\(\d+(?:\.\d+)?\)|calc|\d+(?:\.\d+)?(?:px|rem|em|svh|dvh|lvh|vh|%)?|[-+*/()_ ]/g;
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
  /** Which primitive it sits on, so Skeleton's shape classes pass. */
  primitive?: string;
  /** The class reaches a primitive through a descendant variant; only the docs site is held to this. */
  reachesChildren?: boolean;
  /** The variables the site's layouts declare, which a layout size may use. */
  layoutVariables?: ReadonlySet<string>;
  /** Whether a custom property may be declared here: anywhere in the registry, only a layout in the site. */
  mayDeclare?: boolean;
  /** Whether a declared custom property must hold a size, as the site's layout variables do. */
  sizesOnly?: boolean;
}

/** Whether a custom property's value is a size built on the spacing unit, such as `calc(var(--spacing)*14)`. */
export function isSizeValue(value: string): boolean {
  return value.trim() !== '' && (value.match(SIZE_TERM) ?? []).join('') === value;
}

/** Which rule a class breaks, or null. */
export function classViolation(
  className: string,
  {
    onPrimitive = false,
    primitive = '',
    reachesChildren = false,
    layoutVariables = new Set(),
    mayDeclare = true,
    sizesOnly = false,
  }: ClassContext = {},
): string | null {
  const utility = utilityOf(className);
  if (PALETTE.test(utility)) return 'palette colour';
  if (primitive === 'Skeleton' && SKELETON_SHAPE.test(utility)) return null;
  if (isLayoutSize(utility, layoutVariables)) return null;
  const declaration = VARIABLE_DECLARATION.exec(utility);
  const declaresVariable = declaration !== null;
  if (declaration && (!mayDeclare || (sizesOnly && !isSizeValue(declaration[2])))) return 'arbitrary value';
  if (utility.includes('[') && (!declaresVariable || COLOR_LITERAL.test(utility))) return 'arbitrary value';
  const restyles = onPrimitive || (reachesChildren && DESCENDANT_VARIANT.test(className));
  if (restyles && PRIMITIVE_LOOK.test(utility) && !LAYOUT_KEPT.test(utility)) return 'restyles a primitive';
  return null;
}

/** The custom properties a module declares, as a class (`[--x:...]`) or a style key (`'--x': '...'`), with their values. */
function declaredVariables(text: string): { name: string; value: string }[] {
  return [...text.matchAll(/\[--([\w-]+):([^\]\s]*)\]|['"]--([\w-]+)['"]\s*:\s*['"]([^'"]*)['"]/g)].map((match) => ({
    name: match[1] ?? match[3],
    value: match[2] ?? match[4],
  }));
}

/** Each size variable a site layout declares, with the layouts that declare it; a colour or any other value is no layout size. */
function layoutDeclarations(): Map<string, string[]> {
  const declarations = new Map<string, string[]>();
  siteLayouts().forEach((file) =>
    new Set(
      declaredVariables(readSource(file))
        .filter(({ value }) => isSizeValue(value))
        .map(({ name }) => name),
    ).forEach((name) => declarations.set(name, [...(declarations.get(name) ?? []), file])),
  );
  return declarations;
}

/** The module path a site file is imported by, `@/<path>` without its extension. */
function importPathOf(file: string): string {
  return `@/${file.replace(/^src\//, '').replace(/\.tsx?$/, '')}`;
}

/**
 * The primitives a site module passes on (`export { X } from '<ui module>'`), keyed by the path it is
 * imported by, so an import of `X` from it is held to the primitive rule as an import from `ui/` is.
 */
function primitiveReexports(files: string[]): Map<string, Set<string>> {
  const reexports = new Map<string, Set<string>>();
  files
    .filter((file) => file.startsWith('src/'))
    .forEach((file) => {
      const source = parseTsxSource(file, readSource(file));
      source.statements.forEach((statement) => {
        if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) return;
        if (!ts.isStringLiteral(statement.moduleSpecifier) || !PRIMITIVE_MODULE.test(statement.moduleSpecifier.text))
          return;
        const clause = statement.exportClause;
        if (!clause || !ts.isNamedExports(clause)) return;
        const names = reexports.get(importPathOf(file)) ?? new Set<string>();
        clause.elements.forEach((element) => names.add(element.name.text));
        reexports.set(importPathOf(file), names);
      });
    });
  return reexports;
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

function violationsIn(
  file: string,
  text: string,
  layoutVariables: ReadonlySet<string> = new Set(),
  reexports: ReadonlyMap<string, ReadonlySet<string>> = new Map(),
): Violation[] {
  const source = parseTsxSource(file, text);
  const primitives = new Set<string>();
  source.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
    const from = statement.moduleSpecifier.text;
    const passedOn = reexports.get(from);
    if (!PRIMITIVE_MODULE.test(from) && !passedOn) return;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return;
    bindings.elements
      .filter((element) => !passedOn || passedOn.has((element.propertyName ?? element.name).text))
      .forEach((element) => primitives.add(element.name.text));
  });
  const site = isSite(file);
  const mayDeclare = !site || file.endsWith('/layout.tsx');

  const found: Violation[] = [];
  const check = (node: ts.Node, onPrimitive: boolean, primitive = ''): void => {
    literalTexts(node)
      .flatMap((text) => text.split(/\s+/).filter(Boolean))
      .forEach((className) => {
        const rule = classViolation(className, {
          onPrimitive,
          primitive,
          reachesChildren: site,
          layoutVariables,
          mayDeclare,
          sizesOnly: site,
        });
        if (rule) found.push({ file, line: lineOf(source, node), className, rule });
      });
  };
  // A primitive's own recipe (`buttonVariants(...)`) merged with more classes restyles that primitive too.
  const callsPrimitiveRecipe = (node: ts.CallExpression): boolean =>
    node.arguments.some(
      (argument) => ts.isCallExpression(argument) && primitives.has(argument.expression.getText(source)),
    );
  // A custom property set in a `style` object is held to the rule a `[--x:..]` class is.
  const checkStyle = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && node.name.text.startsWith('--')) {
      const value = ts.isStringLiteralLike(node.initializer) ? node.initializer.text : '';
      if (!mayDeclare || !isSizeValue(value)) {
        found.push({
          file,
          line: lineOf(source, node),
          className: `${node.name.text}: ${value}`,
          rule: 'arbitrary value',
        });
      }
    }
    ts.forEachChild(node, checkStyle);
  };
  const visit = (node: ts.Node): void => {
    if (site && ts.isJsxAttribute(node) && node.name.getText(source) === 'style' && node.initializer) {
      checkStyle(node.initializer);
      return;
    }
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
      const primitive = primitives.has(tag.split('.')[0]) ? tag.split('.')[0] : '';
      check(node.initializer, primitive !== '' || (site && mergesRecipe), primitive);
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
  it('lets Skeleton take its size and radius by className, and still flags a palette colour on it', () => {
    expect(classViolation('h-4', { onPrimitive: true, primitive: 'Skeleton' })).toBeNull();
    expect(classViolation('rounded-full', { onPrimitive: true, primitive: 'Skeleton' })).toBeNull();
    expect(classViolation('bg-red-500', { onPrimitive: true, primitive: 'Skeleton' })).toBe('palette colour');
    expect(classViolation('h-4', { onPrimitive: true, primitive: 'Button' })).toBe('restyles a primitive');
  });

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

  it('lets a site layout declare a size, and nothing else', () => {
    expect(classViolation('[--header-height:calc(var(--spacing)*14)]', { sizesOnly: true })).toBeNull();
    expect(classViolation('[--sidebar:var(--background)]', { sizesOnly: true })).toBe('arbitrary value');
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

describe('violationsIn on style objects and re-exports', () => {
  const colourStyle = "const a = <div style={{ '--sidebar': 'var(--background)' }} />;";
  const sizeStyle = "const a = <div style={{ '--sidebar-width': 'calc(var(--spacing) * 72)' } as CSSProperties} />;";

  it('refuses a custom property in a style object outside a layout', () => {
    expect(violationsIn('src/components/nav.tsx', sizeStyle).map(({ className }) => className)).toEqual([
      '--sidebar-width: calc(var(--spacing) * 72)',
    ]);
  });

  it('lets a layout set a size in a style object, and refuses a colour there', () => {
    expect(violationsIn('src/app/docs/layout.tsx', sizeStyle)).toEqual([]);
    expect(violationsIn('src/app/docs/layout.tsx', colourStyle).map(({ className }) => className)).toEqual([
      '--sidebar: var(--background)',
    ]);
  });

  it('holds a primitive to the rule when a site module passes it on', () => {
    const source = [
      "import { SidebarProvider } from '@/components/navigation/docs-sidebar';",
      'const a = <SidebarProvider className="px-0" />;',
    ].join('\n');
    const reexports = new Map([['@/components/navigation/docs-sidebar', new Set(['SidebarProvider'])]]);

    expect(violationsIn('src/app/docs/layout.tsx', source, new Set(), reexports).map(({ rule }) => rule)).toEqual([
      'restyles a primitive',
    ]);
  });

  it('finds the re-export of a primitive in the site', () => {
    expect(
      primitiveReexports(['src/components/navigation/docs-sidebar.tsx']).get('@/components/navigation/docs-sidebar'),
    ).toEqual(new Set(['SidebarProvider']));
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
  const reexports = primitiveReexports(files);

  it('keep every rebuilt module to the class rules', () => {
    expect(
      files
        .filter((file) => !PENDING.includes(file))
        .flatMap((file) => violationsIn(file, readSource(file), layoutVariables, reexports)),
    ).toEqual([]);
  });

  it('list as pending only modules that still break a rule', () => {
    expect(
      PENDING.filter(
        (file) =>
          !files.includes(file) || violationsIn(file, readSource(file), layoutVariables, reexports).length === 0,
      ),
    ).toEqual([]);
  });

  it('take no colour as a layout variable', () => {
    expect([...layoutVariables].sort()).toEqual(['footer-height', 'header-height', 'sidebar-width']);
  });
});
