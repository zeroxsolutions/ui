import { EditorError } from '../../document/core/errors.js';
import {
  BLOCK_TEXT_MAX_LENGTH,
  BUTTON_HREF_MAX_LENGTH,
  BUTTON_LABEL_MAX_LENGTH,
  LIST_MAX_ITEMS,
  MAX_LANES,
} from '../../template/email/index.js';
import type { BlockEditor } from '../../template/email/define-email-block.js';
import type { EditorProfile, EmailBlockKind, EmailBounds, VariableDeclaration } from './types.js';

export const EMAIL_KINDS: readonly EmailBlockKind[] = [
  'paragraph',
  'button',
  'code',
  'list',
  'callout',
  'divider',
  'columns',
  'html',
];

/** What a mail-layout region (header, footer) may hold. */
export const MAIL_LAYOUT_KINDS: readonly EmailBlockKind[] = ['paragraph', 'list', 'callout', 'divider', 'columns'];

const DEFAULT_BOUNDS: EmailBounds = {
  text: BLOCK_TEXT_MAX_LENGTH,
  label: BUTTON_LABEL_MAX_LENGTH,
  href: BUTTON_HREF_MAX_LENGTH,
  listItems: LIST_MAX_ITEMS,
  blocks: 50,
  lanes: MAX_LANES,
  variables: 20,
};

/** The bounds the renderer itself enforces on write: a profile may tighten them, never loosen them. */
const RENDERER_BOUNDS = {
  text: BLOCK_TEXT_MAX_LENGTH,
  label: BUTTON_LABEL_MAX_LENGTH,
  href: BUTTON_HREF_MAX_LENGTH,
  listItems: LIST_MAX_ITEMS,
  lanes: MAX_LANES,
} as const satisfies Partial<EmailBounds>;

function boundsOf(overrides: Partial<EmailBounds> = {}): EmailBounds {
  // An entry given as undefined would otherwise replace the default and switch its check off.
  const given = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined));
  const bounds: EmailBounds = { ...DEFAULT_BOUNDS, ...given };
  for (const [name, limit] of Object.entries(RENDERER_BOUNDS)) {
    const value = bounds[name as keyof typeof RENDERER_BOUNDS];
    if (value > limit) {
      throw new EditorError(
        'editor.profile.bound_above_renderer',
        `Bound "${name}" is ${value}, above the renderer's ${limit}.`,
      );
    }
  }
  return bounds;
}

const VARIABLE_NAME = /^\w{1,64}$/;

function assertVariables(variables: readonly VariableDeclaration[], max: number): void {
  if (variables.length > max) {
    throw new EditorError(
      'editor.profile.too_many_variables',
      `A profile declares at most ${max} variables, got ${variables.length}.`,
    );
  }
  const seen = new Set<string>();
  for (const { name } of variables) {
    if (!VARIABLE_NAME.test(name)) {
      throw new EditorError(
        'editor.profile.variable_name_invalid',
        `Variable name "${name}" must be 1 to 64 word characters.`,
      );
    }
    if (seen.has(name)) {
      throw new EditorError('editor.profile.variable_duplicate', `Variable "${name}" is declared twice.`);
    }
    seen.add(name);
  }
}

export function emailProfile(
  options: {
    allow?: readonly EmailBlockKind[];
    variables?: readonly VariableDeclaration[];
    bounds?: Partial<EmailBounds>;
    /** The kinds of blocks a host's own editor features add; a block from `defineEmailBlock` goes in `blocks`. */
    extraKinds?: readonly string[];
    /**
     * The product's own blocks, from `defineEmailBlock` or `defineBlock` with an email side: their kinds join the
     * profile and `validate` checks them.
     */
    blocks?: readonly { readonly editor: BlockEditor; readonly email?: unknown }[];
  } = {},
): EditorProfile {
  const allow = options.allow ?? EMAIL_KINDS;
  for (const kind of allow) {
    if (!EMAIL_KINDS.includes(kind)) {
      throw new EditorError('editor.profile.unknown_kind', `"${kind}" is not an email block kind.`);
    }
  }
  const bounds = boundsOf(options.bounds);
  const variables = options.variables ?? [];
  assertVariables(variables, bounds.variables);
  for (const definition of options.blocks ?? []) {
    // A block only a document holds has no render, so an email that offered it could not be sent.
    if (definition.email === null) {
      throw new EditorError('editor.profile.block_not_email', `Block "${definition.editor.type}" has no email side.`);
    }
  }
  const blocks = (options.blocks ?? []).map((definition) => definition.editor);
  const types = new Set<string>();
  for (const { type } of blocks) {
    if (types.has(type)) {
      throw new EditorError('editor.profile.block_duplicate', `Block type "${type}" is declared twice.`);
    }
    types.add(type);
  }
  const extraKinds = (options.extraKinds ?? []).filter((kind) => !types.has(kind));
  return {
    id: 'email',
    kinds: [...allow, ...extraKinds, ...types],
    variables,
    bounds,
    exports: ['email-blocks', 'email-html', 'email-text'],
    ...(blocks.length === 0 ? {} : { blocks }),
  };
}

export function smsProfile(
  options: { variables?: readonly VariableDeclaration[]; maxSegments?: number } = {},
): EditorProfile {
  const variables = options.variables ?? [];
  assertVariables(variables, DEFAULT_BOUNDS.variables);
  return {
    id: 'sms',
    kinds: [],
    variables,
    bounds: { ...DEFAULT_BOUNDS },
    maxSegments: options.maxSegments ?? 1,
    exports: ['sms-text'],
  };
}
