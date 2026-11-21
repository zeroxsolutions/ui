import { EditorError } from '../../document/core/errors.js';
import {
  BLOCK_TEXT_MAX_LENGTH,
  BUTTON_HREF_MAX_LENGTH,
  BUTTON_LABEL_MAX_LENGTH,
  LIST_MAX_ITEMS,
} from '../../template/email/index.js';
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
  lanes: 4,
  variables: 20,
};

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
    extraKinds?: readonly string[];
  } = {},
): EditorProfile {
  const allow = options.allow ?? EMAIL_KINDS;
  for (const kind of allow) {
    if (!EMAIL_KINDS.includes(kind)) {
      throw new EditorError('editor.profile.unknown_kind', `"${kind}" is not an email block kind.`);
    }
  }
  const bounds = { ...DEFAULT_BOUNDS, ...options.bounds };
  const variables = options.variables ?? [];
  assertVariables(variables, bounds.variables);
  return {
    id: 'email',
    kinds: [...allow, ...(options.extraKinds ?? [])],
    variables,
    bounds,
    exports: ['email-blocks', 'email-html', 'email-text'],
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
