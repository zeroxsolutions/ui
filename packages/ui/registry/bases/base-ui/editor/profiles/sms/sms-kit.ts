import { UndoRedo } from '@tiptap/extensions';
import { defineFeature, type EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import type { EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { variableFeature, type VariableFeature } from '../variables/variable';

export interface SmsKitOptions {
  /** The declarations the chips read; a host whose profile changes passes a getter. */
  declarations?: () => EditorProfile['variables'];
  /** The variable feature, when the host also needs its trigger token. */
  variables?: VariableFeature;
}

/**
 * The features of the SMS profile: the document's paragraphs and text, undo, and the variable chip. It offers
 * no block and no mark, so no shortcut or paste can write what the body cannot hold.
 */
export function smsKit(profile: EditorProfile, options: SmsKitOptions = {}): EditorFeature[] {
  const variables = options.variables ?? variableFeature(options.declarations ?? (() => profile.variables));
  return [variables.feature, defineFeature({ id: 'smsBody', advanced: { engineExtensions: [UndoRedo] } })];
}
