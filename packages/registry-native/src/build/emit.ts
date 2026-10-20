import { posix } from 'node:path';
import type { SlotMap } from './slot-map';
import { translateClasses, type Engine, type Part } from './translate.ts';

/** A single-line quoted string; the sources write every class list as one. */
const QUOTED_STRING = /(['"])([^'"\n]*)\1/g;
const SLOT_TOKEN = /(?<![\w-])(cn-[\w-]+)(?:\/(text|icon))?(?![\w/-])/g;
const LEFTOVER_TOKEN = /(?<![\w-])cn-[\w-]+/;
const LINE_COMMENT = /^\s*\/\//;
const RELATIVE_IMPORT = /(from\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;

/** The consumer's alias for each folder of `src/registry`, as shadcn rewrites it on `add`. */
const FOLDER_ALIASES: ReadonlyMap<string, string> = new Map([
  ['ui', '@/components/ui'],
  ['lib', '@/lib'],
]);

/** Removes each run of `//` lines that mentions a slot token, since the emitted file has none left. */
function dropTokenComments(source: string): string {
  const kept: string[] = [];
  let run: string[] = [];
  const closeRun = (): void => {
    if (!run.some((line) => line.includes('cn-'))) kept.push(...run);
    run = [];
  };
  for (const line of source.split('\n')) {
    if (LINE_COMMENT.test(line)) {
      run.push(line);
      continue;
    }
    closeRun();
    kept.push(line);
  }
  closeRun();
  return kept.join('\n');
}

function slotClasses(slot: string, part: Part, slots: SlotMap, engine: Engine, file: string): string {
  const classes = slots.get(slot);
  if (!classes) {
    throw new Error(`Unknown slot ${slot} in ${file}`);
  }
  const translation = translateClasses(classes, engine, part);
  if (translation.unknown.length > 0) {
    throw new Error(`Untranslated ${translation.unknown[0]} in ${slot}`);
  }
  return translation.classes.join(' ');
}

/**
 * Writes one registry source for `engine`: every `cn-<slot>` token inside a quoted string becomes
 * that Vega slot's view classes, every `cn-<slot>/text` token its text classes and every
 * `cn-<slot>/icon` token the classes it gives an icon with no size of its own, a token whose
 * translation is empty is removed, and the `//` comments that describe the tokens are dropped.
 * A string holding a token has its whitespace collapsed; every other string is left as written.
 * @param file - the source's name, used only in error messages
 * @throws {Error} `Unknown slot <slot> in <file>` for a slot Vega does not declare,
 * `Untranslated <class> in <slot>` for a slot class with no rule, and
 * `Unreplaced <token> in <file>` for a token left outside a quoted string.
 */
export function emitSource(source: string, slots: SlotMap, engine: Engine, file: string): string {
  const emitted = dropTokenComments(source).replace(QUOTED_STRING, (literal, quote: string, content: string) => {
    if (!content.includes('cn-')) return literal;
    const classes = content.replace(SLOT_TOKEN, (_token, slot: string, part: 'text' | 'icon' | undefined) =>
      slotClasses(slot, part ?? 'view', slots, engine, file),
    );
    return `${quote}${classes.split(/\s+/).filter(Boolean).join(' ')}${quote}`;
  });

  const leftover = LEFTOVER_TOKEN.exec(emitted);
  if (leftover) {
    throw new Error(`Unreplaced ${leftover[0]} in ${file}`);
  }
  return emitted;
}

/**
 * Rewrites the relative imports of a registry source to the aliases shadcn maps onto the
 * consumer's `components.json`, such as `../lib/utils` to `@/lib/utils`.
 * @param file - the source's path under `src/registry`, such as `ui/button.tsx`
 * @throws {Error} `No alias for <specifier> in <file>` for an import outside `ui` and `lib`
 */
export function aliasImports(source: string, file: string): string {
  return source.replace(RELATIVE_IMPORT, (_import, from: string, quote: string, specifier: string) => {
    const [folder, ...rest] = posix.join(posix.dirname(file), specifier).split('/');
    const alias = FOLDER_ALIASES.get(folder);
    if (!alias || rest.length === 0) {
      throw new Error(`No alias for ${specifier} in ${file}`);
    }
    return `${from}${quote}${[alias, ...rest].join('/')}${quote}`;
  });
}
