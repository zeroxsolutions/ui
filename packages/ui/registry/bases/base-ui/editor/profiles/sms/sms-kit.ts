import { UndoRedo } from '@tiptap/extensions';
import { Extension, Fragment, Plugin, PluginKey, Slice } from '@zeroxsolutions/editor-core/document/advanced';
import { defineFeature, type EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import type { EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { variableFeature, type VariableFeature } from '../variables/variable';

/**
 * Pasted text is one paragraph per line, as `fromSmsText` reads a body: ProseMirror's own parser folds a blank
 * line into the break before it, which would drop it from the body.
 */
function linesPaste(): Extension {
  return Extension.create({
    name: 'smsLinesPaste',
    addProseMirrorPlugins: () => [
      new Plugin({
        key: new PluginKey('smsLinesPaste'),
        props: {
          clipboardTextParser: (text, _context, _plain, view) => {
            const { paragraph } = view.state.schema.nodes;
            const lines = text.replace(/\r\n?/g, '\n').split('\n');
            const blocks = lines.map((line) =>
              paragraph.create(null, line === '' ? null : view.state.schema.text(line)),
            );
            // Open at both ends so a line pasted into a line joins it.
            return new Slice(Fragment.fromArray(blocks), 1, 1);
          },
        },
      }),
    ],
  });
}

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
  return [
    variables.feature,
    defineFeature({ id: 'smsBody', advanced: { engineExtensions: [UndoRedo, linesPaste()] } }),
  ];
}
