import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { cn } from '../registry/lib/utils';
import { parseSlotMap } from './slot-map';
import { styleSheetIds } from './style-sheet';

const PROJECT = join(__dirname, '../..');
const SRC = join(PROJECT, 'src');
const REGISTRY = join(SRC, 'registry');
const UI = join(REGISTRY, 'ui');

const STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'] as const;

/**
 * The folders whose sources compose the design system's components, and the preview app that draws them.
 * `ui/` itself is left out: its files are the components, and a class one of them hands another is that
 * component's own recipe.
 */
const COMPOSERS = [join(REGISTRY, 'components'), join(SRC, 'examples'), join(PROJECT, '../../apps/native-preview/src')];

/** The `registry:ui` names upstream's registry lists, as the snapshot last saved them. */
const UPSTREAM_ITEMS = new Set(
  JSON.parse(
    readFileSync(require.resolve('@zeroxsolutions/shadcn-upstream/snapshot/registry-ui-items.json'), 'utf8'),
  ) as string[],
);

/**
 * Whether a source is the demo of one of upstream's own items. Each ports upstream's published demo as upstream
 * writes it, classes and all, so the native docs draw what the web docs, which render upstream's demo, draw.
 */
function portsUpstreamDemo(path: string): boolean {
  const match = /^examples\/(.+)-demo\.tsx$/.exec(relative(SRC, path));
  return match !== null && UPSTREAM_ITEMS.has(match[1]);
}

/**
 * The primitives a caller sets text and icons with. Neither draws a slot of its own, so the size and colour
 * a caller gives one are the caller's, except inside a component whose style sets them, which the check
 * below reads from the element around it.
 */
const PRIMITIVES = new Set(['Text', 'Icon']);

/**
 * The classes kept on purpose, each `<path under src/>: <element> <class>`, with why the style does not decide
 * what it sets there.
 */
const KEPT: Record<string, string> = {
  // The emoji list is virtualised: each row's height is set by the list's item layout, so the group label
  // centres itself in that height in place of the style's vertical padding, keeping its inset, size and case.
  'registry/components/data-entry/emoji-picker.tsx: <View cn-combobox-label> py-0':
    "a virtualised row's height, fixed by the list's item layout",
  // Nine category tabs share a phone's width; a toggle's own padding and minimum width would push them past it.
  'registry/components/data-entry/emoji-picker.tsx: <ToggleGroupItem> px-0': "nine tabs sharing a phone's width",
};

/** Each `.tsx` source under `directory`; a spec is none. */
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.spec.tsx') ? [path] : [];
  });
}

/** The utility a class draws, with its variants, its important mark and its negative sign dropped. */
function utility(name: string): string {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < name.length; index++) {
    if (name[index] === '[') depth++;
    else if (name[index] === ']') depth--;
    else if (name[index] === ':' && depth === 0) start = index + 1;
  }
  return name.slice(start).replace(/^!|!$/g, '').replace(/^-/, '');
}

const SIZES = '(?:xs|sm|base|lg|[2-9]?xl|\\[(?:length:[^\\]]+|[0-9.]+(?:px|rem|em))\\])';
const WEIGHTS = '(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)';
/** Text utilities that align, wrap or clip, which place the text rather than set it. */
const TEXT_LAYOUT = '(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)';

/** Each property a style decides for its components, and the utilities that set it. */
const STYLE_DECIDED: [property: string, utility: RegExp][] = [
  ['padding', /^p[xytrblse]?-/],
  ['gap', /^gap(-[xy])?-/],
  ['radius', /^rounded(-|$)/],
  ['text size', new RegExp(`^text-${SIZES}(/|$)`)],
  ['font weight', new RegExp(`^font-(${WEIGHTS}|sans-(medium|semibold|bold))$`)],
  ['tracking', /^tracking-/],
  ['height', /^(h|size)-([0-9.]+|px|\[[^\]]+\])$/],
  ['border', /^border(-|$)/],
  ['ring', /^ring(-|$)/],
  ['shadow', /^shadow(-|$)/],
  ['background', /^bg-/],
  ['text colour', new RegExp(`^text-(?!${SIZES}(/|$)|${TEXT_LAYOUT}$)`)],
];

/** The property a style decides that `name` sets, if any. */
function decided(name: string): string | undefined {
  const drawn = utility(name);
  return STYLE_DECIDED.find(([, pattern]) => pattern.test(drawn))?.[0];
}

/** The type a caller sets on text or an icon: its size, weight, tracking and colour. */
const TYPE = new Set(['text size', 'font weight', 'tracking', 'text colour', 'height']);

/**
 * The properties the style decides only for a component whose slot, or one of its variants or sizes, draws them
 * in some style. A height on a component no style sizes is the area the caller gives it, and a gap on one no
 * style spaces is the caller's arrangement of what it put inside.
 */
const WHERE_DRAWN = new Set(['height', 'gap']);

function isClassMerge(node: ts.Node): node is ts.CallExpression {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^(cn|clsx|cx)$/.test(node.expression.text);
}

/** The class strings an expression can produce: literals, templates, and the arguments of a class merge. */
function classStrings(node: ts.Node): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isTemplateExpression(node))
    return [
      node.head.text,
      ...node.templateSpans.flatMap((span) => [span.literal.text, ...classStrings(span.expression)]),
    ];
  if (ts.isJsxExpression(node)) return node.expression ? classStrings(node.expression) : [];
  if (ts.isParenthesizedExpression(node)) return classStrings(node.expression);
  if (ts.isConditionalExpression(node)) return [...classStrings(node.whenTrue), ...classStrings(node.whenFalse)];
  if (ts.isBinaryExpression(node))
    return node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
      ? classStrings(node.right)
      : [...classStrings(node.left), ...classStrings(node.right)];
  if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(classStrings);
  if (isClassMerge(node)) return node.arguments.flatMap(classStrings);
  return [];
}

/** The slot a component draws with, as `ItemMedia` draws `cn-item-media`. */
function slotOf(component: string): string {
  const words = component
    .replace(/Variants$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2');
  return `cn-${words.toLowerCase()}`;
}

/** The slot a token in a native class names, as `cn-card/text@size=sm` names `cn-card`. */
function slotOfToken(token: string): string {
  return token.replace(/[/@].*$/, '');
}

/** The classes each slot draws in each of the eight styles. */
const SLOT_CLASSES: Map<string, string[]> = (() => {
  const classes = new Map<string, string[]>();
  for (const style of STYLES) {
    const sheet = styleSheetIds(style)
      .map((id) => readFileSync(require.resolve(id), 'utf8'))
      .join('\n');
    for (const [slot, drawn] of parseSlotMap(sheet)) classes.set(slot, [...(classes.get(slot) ?? []), ...drawn]);
  }
  return classes;
})();

/** `slot` with the variants and sizes a recipe draws beside it, as `cn-button` with `cn-button-size-sm`. */
function family(slot: string): string[] {
  return [...SLOT_CLASSES.keys()].filter(
    (candidate) =>
      candidate === slot || candidate.startsWith(`${slot}-variant-`) || candidate.startsWith(`${slot}-size-`),
  );
}

/**
 * Whether some style draws `component` at all. One no style draws, such as an aspect ratio or a scroll area's
 * root, is a frame the caller draws, as upstream's own examples draw it.
 */
function styled(component: string): boolean {
  return family(slotOf(component)).length > 0;
}

/** Whether some style draws `property` on `component`'s slot, or on one of its variants or sizes. */
function draws(component: string, property: string): boolean {
  return family(slotOf(component)).some((slot) =>
    (SLOT_CLASSES.get(slot) ?? []).some((name) => decided(name) === property),
  );
}

/** Whether a class draws on the element's children, as `[&_svg]:size-4` or `*:gap-1` does, not on the element. */
function targetsChildren(name: string): boolean {
  return /(^|:)(\*{1,2}|\[&[ _>+~])/.test(name.slice(0, name.length - utility(name).length));
}

/**
 * Whether `name` sets what `slot` draws in some style, as the class merge reads two utilities: the one written
 * last removes the other. Variants are dropped from both, since a class under a state still overrides the slot
 * in that state.
 */
function overridesSlot(slot: string, name: string): boolean {
  const ours = utility(name);
  return (SLOT_CLASSES.get(slot) ?? []).some((drawn) => {
    const theirs = utility(drawn);
    return (
      theirs !== ours &&
      targetsChildren(drawn) === targetsChildren(name) &&
      !cn(theirs, ours).split(' ').includes(theirs)
    );
  });
}

/** The source file `specifier` names from `path`, if it is one of the registry's. */
function moduleFile(specifier: string, path: string): string | undefined {
  const target = specifier.startsWith('@/components/')
    ? join(REGISTRY, specifier.slice('@/'.length).replace(/^components\/ui\//, 'ui/'))
    : specifier.startsWith('.')
      ? resolve(dirname(path), specifier)
      : undefined;
  if (target === undefined) return undefined;
  return [
    target,
    `${target}.tsx`,
    `${target}.nativewind.tsx`,
    `${target}.ts`,
    join(target, 'index.tsx'),
    join(target, 'index.ts'),
  ].find((candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate));
}

const parsed = new Map<string, ts.SourceFile>();

function parse(path: string): ts.SourceFile {
  let file = parsed.get(path);
  if (!file) {
    file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    parsed.set(path, file);
  }
  return file;
}

/** What a name `file` imports is: a design-system component, or a registry module's export, by its file. */
type Imported = { kind: 'ui'; name: string } | { kind: 'module'; path: string; name: string };

function imports(file: ts.SourceFile): Map<string, Imported> {
  const names = new Map<string, Imported>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const target = moduleFile(specifier, file.fileName);
    const bindings = statement.importClause?.namedBindings;
    if (!target || !bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      const name = (element.propertyName ?? element.name).text;
      names.set(
        element.name.text,
        dirname(target) === UI ? { kind: 'ui', name } : { kind: 'module', path: target, name },
      );
    }
  }
  return names;
}

/** The function `name` declares in `path`, following a re-export to the module that declares it. */
function declaration(path: string, name: string, seen = new Set<string>()): [ts.SourceFile, ts.Node] | undefined {
  if (seen.has(`${path}#${name}`)) return undefined;
  seen.add(`${path}#${name}`);
  const file = parse(path);
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return [file, statement];
    if (ts.isVariableStatement(statement))
      for (const variable of statement.declarationList.declarations)
        if (ts.isIdentifier(variable.name) && variable.name.text === name && variable.initializer)
          return [file, variable.initializer];
  }
  for (const statement of file.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const exported =
      statement.exportClause && ts.isNamedExports(statement.exportClause)
        ? statement.exportClause.elements.find((element) => element.name.text === name)
        : undefined;
    if (statement.exportClause && !exported) continue;
    const target = moduleFile(statement.moduleSpecifier.text, path);
    const found = target && declaration(target, (exported?.propertyName ?? exported?.name)?.text ?? name, seen);
    if (found) return found;
  }
  return undefined;
}

/** Whether `node` hands on the caller's `className`, as `className` itself or merged by `cn()`. */
function handsOnClassName(node: ts.Expression): boolean {
  if (ts.isIdentifier(node)) return node.text === 'className';
  return (
    isClassMerge(node) && node.arguments.some((argument) => ts.isIdentifier(argument) && argument.text === 'className')
  );
}

const forwarded = new Map<string, string[]>();

/**
 * The slots a composed component draws the caller's `className` beside: the `cn-` slots merged with it, and the
 * slot of each design-system component, or of each composed one, it hands the class on to.
 */
function slotsOf(path: string, name: string, depth = 0): string[] {
  const key = `${path}#${name}`;
  const known = forwarded.get(key);
  if (known) return known;
  forwarded.set(key, []);
  const found = declaration(path, name);
  if (!found || depth > 4) return [];
  const [file, node] = found;
  const imported = imports(file);
  const slots = new Set<string>();
  const visit = (child: ts.Node): void => {
    if (isClassMerge(child) && handsOnClassName(child))
      for (const text of child.arguments.flatMap(classStrings))
        for (const token of text.split(/\s+/)) if (token.startsWith('cn-')) slots.add(slotOfToken(token));
    if ((ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) && ts.isIdentifier(child.tagName)) {
      const attribute = child.attributes.properties.find(
        (property): property is ts.JsxAttribute =>
          ts.isJsxAttribute(property) && property.name.getText() === 'className',
      );
      const value = attribute?.initializer;
      if (value && ts.isJsxExpression(value) && value.expression && handsOnClassName(value.expression)) {
        const target = imported.get(child.tagName.text);
        if (target?.kind === 'ui' && !PRIMITIVES.has(target.name))
          for (const slot of family(slotOf(target.name))) slots.add(slot);
        if (target?.kind === 'module') for (const slot of slotsOf(target.path, target.name, depth + 1)) slots.add(slot);
        if (!target) for (const slot of slotsOf(file.fileName, child.tagName.text, depth + 1)) slots.add(slot);
      }
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  forwarded.set(key, [...slots]);
  return [...slots];
}

/** The design-system component the nearest element around `node` is, if it is one, as Text inside a Button. */
function enclosingComponent(node: ts.Node, imported: Map<string, Imported>): string | undefined {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isJsxElement(parent) && parent.openingElement !== node) {
      const target = imported.get(parent.openingElement.tagName.getText());
      return target?.kind === 'ui' && !PRIMITIVES.has(target.name) ? target.name : undefined;
    }
  }
  return undefined;
}

/**
 * Each class a source writes that sets what the style decides: any such class on a design-system component, the
 * type of a Text or an Icon set directly inside one, and a class that overrides what a `cn-` slot draws in some
 * style, written beside the slot or passed to a composed component that draws the slot.
 */
function overrides(path: string): string[] {
  const file = parse(path);
  const imported = imports(file);
  const found: string[] = [];
  const report = (element: string, name: string, property: string) =>
    found.push(`${relative(SRC, path)}: <${element}> ${name} (${property})`);
  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const element = node.tagName.getText();
      const target = imported.get(element);
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || attribute.name.getText() !== 'className' || !attribute.initializer)
          continue;
        const names = classStrings(attribute.initializer).flatMap((text) => text.split(/\s+/).filter(Boolean));
        const primitive = target?.kind === 'ui' && PRIMITIVES.has(target.name);
        const around = primitive ? enclosingComponent(node, imported) : undefined;
        const component = target?.kind === 'ui' && !primitive ? target.name : undefined;
        const slots = [
          ...names.filter((name) => name.startsWith('cn-')).map(slotOfToken),
          ...(target?.kind === 'module' ? slotsOf(target.path, target.name) : []),
          ...(!target && /^[A-Z]/.test(element) ? slotsOf(path, element) : []),
        ];
        for (const name of names) {
          const property = decided(name);
          if (!property) continue;
          if (component) {
            if (styled(component) && (!WHERE_DRAWN.has(property) || draws(component, property)))
              report(component, name, property);
          } else if (around) {
            if (TYPE.has(property) && draws(around, property)) report(`${element} in ${around}`, name, property);
          } else {
            const slot = slots.find((candidate) => overridesSlot(candidate, name));
            if (slot) report(`${element} ${slot}`, name, property);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

describe("a design-system component's classes", () => {
  const found = COMPOSERS.flatMap(sources)
    .filter((path) => !portsUpstreamDemo(path))
    .flatMap(overrides);

  it('set nothing its style decides where a composed item renders it', () => {
    expect(found.filter((entry) => !(entry.replace(/ \([^)]+\)$/, '') in KEPT))).toEqual([]);
  });

  it('keep only classes a composed item still writes', () => {
    const written = new Set(found.map((entry) => entry.replace(/ \([^)]+\)$/, '')));
    expect(Object.keys(KEPT).filter((entry) => !written.has(entry))).toEqual([]);
  });
});
