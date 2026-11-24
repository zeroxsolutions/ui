import type { EmailBlockJSON, Format } from '../../document/core/types/codec.js';
import type { EmailBlockEditor } from '../../template/email/define-email-block.js';
import type { VariableType } from '../../template/index.js';

export type EmailBlockKind = 'paragraph' | 'button' | 'code' | 'list' | 'callout' | 'divider' | 'columns' | 'html';

export type ProblemKind =
  | 'variable-undeclared'
  | 'href-invalid'
  | 'link-invalid'
  | 'required-variable-not-printed'
  | 'markup-malformed'
  | 'block-not-allowed'
  | 'unknown-block-type'
  | 'block-nested-too-deep'
  | 'lanes-mismatch'
  | 'lanes-count'
  | 'content-invalid'
  | 'text-empty'
  | 'text-too-long'
  | 'list-too-long'
  | 'too-many-blocks'
  | 'sms-segment-exceeded'
  | 'sms-placeholder-malformed'
  | 'block-not-carried';

export interface VariableDeclaration {
  name: string;
  type: VariableType;
  label?: string;
  sampleValue?: string;
  required?: boolean;
}

/** The wire shape of one email block. `lanes` is set on columns only. */
export type EditorEmailBlock = EmailBlockJSON;

/** `block` is the block's id, or its key when the id is null. */
export interface ProfileProblem {
  kind: ProblemKind;
  block: string | null;
  field?: string;
  item?: number;
  offset?: number;
  name?: string;
}

export interface EmailBounds {
  text: number;
  label: number;
  href: number;
  listItems: number;
  blocks: number;
  lanes: number;
  variables: number;
}

export interface EditorProfile {
  id: 'email' | 'sms' | (string & {});
  kinds: readonly string[];
  variables: readonly VariableDeclaration[];
  bounds: EmailBounds;
  maxSegments?: number;
  exports: readonly Format[];
  /** The product's own blocks from `defineEmailBlock`, whose fields `validate` checks as the renderer reads them. */
  blocks?: readonly EmailBlockEditor[];
}
