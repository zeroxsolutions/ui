import type { IEditor } from '../../document/core/index.js';

/**
 * A trigger token is the composer's unit of extensibility: registering one
 * teaches the composer a new inline trigger (`@mention`, `#channel`, `/command`,
 * `:emoji:`) without a new suggestion menu, a hand-written node, or a payload
 * mapping edit. Every token is a plain data descriptor read by three consumers
 * off one source: the generic suggestion menu (interaction), the inline-node
 * factory (render), and the payload mapping (the typed submit shape).
 *
 * The descriptor is **open** - each behavioural field is overridable - but the
 * three archetype presets (`referenceToken` / `invocationToken` /
 * `insertionToken`) fill an archetype's defaults so a caller declares data, not
 * behaviour. `resolveTriggerToken` validates the resolved token and rejects an
 * incoherent combination, so "dynamic" never means "silently broken".
 */

/** Where in the line a trigger may open. */
export type TriggerGate = 'anywhere' | 'line-start';

/** How many committed tokens of this kind a message may hold. */
export type TriggerMultiplicity = 'many' | 'one-leading';

/** The option field the typed query completes and commit-on-space matches - the
 *  label for a reference (`@Alice`), the slug for an invocation (`/image-gen`). */
export type TriggerQueryField = 'label' | 'slug';

/**
 * The three interaction archetypes. `reference` and `invocation` commit an
 * inline pill node; `insertion` commits a terminal glyph (a native/image emoji)
 * and is scaffolded here but shipped by a follow-up change.
 */
export type TriggerArchetype = 'reference' | 'invocation' | 'insertion';

/**
 * One option offered in a token's suggestion menu, and the source of the attrs
 * committed into the document. `label` is the menu title and the default match
 * target; `slug` is the invocation token typed after the char and shown in the
 * pill (defaults to `id`); `description` / `icon` are optional menu chrome.
 */
export interface TriggerOption {
  /** Stable identity carried into the committed node and the payload ref. */
  id: string;
  /** Menu-row title and default case-insensitive match target. */
  label: string;
  /** The invocation slug (typed after the char, shown in the pill); defaults to
   *  `id`. Only meaningful for pill archetypes. */
  slug?: string;
  /** Optional secondary line in the menu row. */
  description?: string;
  /** Optional leading glyph in the menu row (not the inline pill). */
  icon?: unknown;
}

/**
 * The behavioural + wiring fields a preset resolves. `Ref` is the per-token
 * payload shape a host reads back (`ChatMention`, `ChatCommandRef`, ...); the
 * registry derives the typed payload from each token's `Ref`.
 */
export interface TriggerToken<Kind extends string = string, Ref = unknown> {
  /** Stable kind identifier - the payload bucket key. */
  kind: Kind;
  /** The trigger character (`@` `#` `/` `:`). */
  char: string;
  archetype: TriggerArchetype;
  gate: TriggerGate;
  multiplicity: TriggerMultiplicity;
  /** Commit when the typed query exactly equals an option's slug/label + space. */
  commitOnSpace: boolean;
  /** Restore a committed pill to editable `char slug` text on backspace. */
  backspaceRestore: boolean;
  /** The document node type this token commits (a pill archetype). Empty for
   *  `insertion`, which inserts a terminal glyph rather than a named pill node. */
  nodeName: string;
  /** The menu data source, queried as the user types (sync or async). */
  source(query: string): TriggerOption[] | Promise<TriggerOption[]>;
  /** Commit a chosen option into the document. The menu has already removed the
   *  typed `char query`; this only inserts the token. */
  insert(editor: IEditor, option: TriggerOption): void;
  /** Read this token's payload ref from a committed node's attributes. */
  readRef(attrs: Record<string, unknown>): Ref;
  /** Optional filter override; default is a case-insensitive label/slug match. */
  filter?(options: TriggerOption[], query: string): TriggerOption[];
  /** The option field the typed query completes and commit-on-space matches. */
  queryField: TriggerQueryField;
  /** Optional class for the menu row's icon media (an avatar box vs a light
   *  glyph); the two menus differed here. */
  menuMediaClassName?: string;
  /** Optional scoped accent class for the pill (defaults to the shared accent). */
  accentClass?: string;
  /** Empty-state text when nothing matches. */
  emptyText?: string;
}

/** The wiring a preset caller supplies - the data half of a token, minus the
 *  behaviour the archetype fixes (which stays overridable via `overrides`). */
export interface TriggerTokenConfig<Kind extends string, Ref> extends Partial<
  Pick<
    TriggerToken<Kind, Ref>,
    | 'gate'
    | 'multiplicity'
    | 'commitOnSpace'
    | 'backspaceRestore'
    | 'filter'
    | 'queryField'
    | 'menuMediaClassName'
    | 'accentClass'
    | 'emptyText'
  >
> {
  nodeName: string;
  source: TriggerToken<Kind, Ref>['source'];
  insert: TriggerToken<Kind, Ref>['insert'];
  readRef: TriggerToken<Kind, Ref>['readRef'];
}

/** Raised when a resolved token carries a self-contradictory behaviour. A plain
 *  Error subclass so a caller (or a test) can branch on it by type. */
export class IncoherentTriggerError extends Error {
  constructor(
    readonly kind: string,
    readonly reason: string,
  ) {
    super(`Trigger token "${kind}" is incoherent: ${reason}`);
    this.name = 'IncoherentTriggerError';
  }
}

/** Raised when two registered tokens collide on a character or a kind. */
export class DuplicateTriggerError extends Error {
  constructor(
    readonly field: 'char' | 'kind',
    readonly value: string,
  ) {
    super(`Duplicate trigger ${field} "${value}" across registered tokens`);
    this.name = 'DuplicateTriggerError';
  }
}

const ARCHETYPE_DEFAULTS: Record<
  TriggerArchetype,
  Pick<TriggerToken, 'gate' | 'multiplicity' | 'commitOnSpace' | 'backspaceRestore' | 'queryField'>
> = {
  reference: {
    gate: 'anywhere',
    multiplicity: 'many',
    commitOnSpace: false,
    backspaceRestore: false,
    queryField: 'label',
  },
  invocation: {
    gate: 'line-start',
    multiplicity: 'one-leading',
    commitOnSpace: true,
    backspaceRestore: true,
    queryField: 'slug',
  },
  insertion: {
    gate: 'anywhere',
    multiplicity: 'many',
    commitOnSpace: false,
    backspaceRestore: false,
    queryField: 'slug',
  },
};

/**
 * Validate a resolved token. Two coherence rules:
 * 1. `line-start` placement and `one-leading` multiplicity must agree - a
 *    leading-single trigger is line-start, an anywhere trigger is many.
 * 2. `commitOnSpace` / `backspaceRestore` only make sense for a line-start
 *    trigger (the leading invocation), never for an anywhere reference.
 */
export function validateTriggerToken(token: TriggerToken): void {
  const isLineStart = token.gate === 'line-start';
  const isOneLeading = token.multiplicity === 'one-leading';
  if (isLineStart !== isOneLeading) {
    throw new IncoherentTriggerError(
      token.kind,
      "gate 'line-start' and multiplicity 'one-leading' must be set together",
    );
  }
  if ((token.commitOnSpace || token.backspaceRestore) && !isLineStart) {
    throw new IncoherentTriggerError(token.kind, "commit-on-space / backspace-restore require gate 'line-start'");
  }
}

function resolveToken<Kind extends string, Ref>(
  kind: Kind,
  char: string,
  archetype: TriggerArchetype,
  config: TriggerTokenConfig<Kind, Ref>,
): TriggerToken<Kind, Ref> {
  const defaults = ARCHETYPE_DEFAULTS[archetype];
  const token: TriggerToken<Kind, Ref> = {
    kind,
    char,
    archetype,
    gate: config.gate ?? defaults.gate,
    multiplicity: config.multiplicity ?? defaults.multiplicity,
    commitOnSpace: config.commitOnSpace ?? defaults.commitOnSpace,
    backspaceRestore: config.backspaceRestore ?? defaults.backspaceRestore,
    nodeName: config.nodeName,
    source: config.source,
    insert: config.insert,
    readRef: config.readRef,
    filter: config.filter,
    queryField: config.queryField ?? defaults.queryField,
    menuMediaClassName: config.menuMediaClassName,
    accentClass: config.accentClass,
    emptyText: config.emptyText,
  };
  validateTriggerToken(token);
  return token;
}

/**
 * A `reference` token - an inline pill, insertable anywhere, many per message
 * (`@mention`, `#channel`). Fields stay overridable; an incoherent override
 * throws at construction.
 */
export function referenceToken<Kind extends string, Ref>(
  kind: Kind,
  char: string,
  config: TriggerTokenConfig<Kind, Ref>,
): TriggerToken<Kind, Ref> {
  return resolveToken(kind, char, 'reference', config);
}

/**
 * An `invocation` token - an inline pill at the input start, at most one leading
 * the line, commit-on-space, backspace-restore (`/command`).
 */
export function invocationToken<Kind extends string, Ref>(
  kind: Kind,
  char: string,
  config: TriggerTokenConfig<Kind, Ref>,
): TriggerToken<Kind, Ref> {
  return resolveToken(kind, char, 'invocation', config);
}

/**
 * An `insertion` token - commits a terminal glyph (native/image emoji), no
 * deletable-as-one-unit pill (`:emoji:`). Scaffolded; the emoji menu and grammar
 * ship in a follow-up change.
 */
export function insertionToken<Kind extends string, Ref>(
  kind: Kind,
  char: string,
  config: TriggerTokenConfig<Kind, Ref>,
): TriggerToken<Kind, Ref> {
  return resolveToken(kind, char, 'insertion', config);
}

/**
 * Validate a whole registry: every token is individually coherent, and no two
 * collide on a trigger character or a kind (a collision would let one silently
 * shadow the other). Called once where the composer builds its trigger layer.
 */
export function validateTriggerRegistry(tokens: readonly TriggerToken[]): void {
  const chars = new Set<string>();
  const kinds = new Set<string>();
  for (const token of tokens) {
    validateTriggerToken(token);
    if (chars.has(token.char)) {
      throw new DuplicateTriggerError('char', token.char);
    }
    if (kinds.has(token.kind)) {
      throw new DuplicateTriggerError('kind', token.kind);
    }
    chars.add(token.char);
    kinds.add(token.kind);
  }
}

/** The default case-insensitive match: an option matches when the query is a
 *  substring of its label or its slug. The generic menu uses this when a token
 *  declares no `filter` override. */
export function defaultTriggerFilter(options: TriggerOption[], query: string): TriggerOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) || (option.slug ?? option.id).toLowerCase().includes(needle),
  );
}
