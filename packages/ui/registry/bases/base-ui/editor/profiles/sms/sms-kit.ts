import {
  CONTENT_LOAD_META,
  Extension,
  Fragment,
  isHistoryTransaction,
  Plugin,
  PluginKey,
  Slice,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import { defineFeature, type EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import type { EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { standardKit } from '../../document/features/standard/index';
import { heldMarks } from '../held-marks';
import { variableFeature, type VariableFeature } from '../variables/variable';

/**
 * The body's paste: text is one paragraph per line, as `fromSmsText` reads a body, since ProseMirror's own
 * parser folds a blank line into the break before it, which would drop it from the body. Pasted blocks are
 * their lines, so a heading or a list item lands as its text.
 */
function bodyPaste(): Plugin {
  return new Plugin({
    key: new PluginKey('smsBodyPaste'),
    props: {
      clipboardTextParser: (text, _context, _plain, view) => {
        const { paragraph } = view.state.schema.nodes;
        const lines = text.replace(/\r\n?/g, '\n').split('\n');
        const blocks = lines.map((line) => paragraph.create(null, line === '' ? null : view.state.schema.text(line)));
        // Open at both ends so a line pasted into a line joins it.
        return new Slice(Fragment.fromArray(blocks), 1, 1);
      },
      transformPasted: (slice, view) => {
        const { paragraph } = view.state.schema.nodes;
        let plain = true;
        slice.content.forEach((node) => {
          if (!node.isInline && node.type !== paragraph) plain = false;
        });
        if (plain) return slice;
        const lines: ProseMirrorNode[] = [];
        slice.content.descendants((node) => {
          if (!node.isTextblock) return true;
          lines.push(paragraph.create(null, node.content));
          return false;
        });
        return lines.length === 0 ? Slice.empty : new Slice(Fragment.fromArray(lines), 1, 1);
      },
    },
  });
}

/**
 * Refuses a change that leaves a block other than a paragraph, such as a heading or a list a shortcut makes:
 * the body is lines of text. A host's load and an undo pass.
 */
function bodyLines(): Plugin {
  return new Plugin({
    key: new PluginKey('smsBodyLines'),
    filterTransaction(tr) {
      if (!tr.docChanged || tr.getMeta(CONTENT_LOAD_META) || isHistoryTransaction(tr)) return true;
      let lines = true;
      tr.doc.forEach((block) => {
        if (block.type.name !== 'paragraph') lines = false;
      });
      return lines;
    },
  });
}

function smsBody(): Extension {
  return Extension.create({
    name: 'smsBody',
    onBeforeCreate() {
      // The document's rules would turn `# ` into a heading or `**x**` into bold, neither of which a body holds;
      // the engine reads the options when it builds its plugins, after this.
      this.editor.options.enableInputRules = ['variableEngine'];
      this.editor.options.enablePasteRules = false;
    },
    addProseMirrorPlugins: () => [bodyPaste(), bodyLines(), heldMarks(new Set())],
  });
}

export interface SmsKitOptions {
  /** The declarations the chips read; a host whose profile changes passes a getter. */
  declarations?: () => EditorProfile['variables'];
  /** The variable feature, when the host also needs its trigger token. */
  variables?: VariableFeature;
  /** The hint an empty body shows; none when absent. */
  placeholder?: string;
}

/**
 * The features of the SMS profile: the Document Editor's text with no grip, no "+" and no slash, toolbar,
 * bubble or block menu item, and the variable chip. It keeps no block but the paragraph and no mark, so no
 * shortcut or paste can write what the body cannot hold.
 */
export function smsKit(profile: EditorProfile, options: SmsKitOptions = {}): EditorFeature[] {
  const variables = options.variables ?? variableFeature(options.declarations ?? (() => profile.variables));
  const standard = standardKit({ placeholder: options.placeholder ?? '', dragHandle: false });
  return [
    { ...standard, slash: [], toolbar: [], bubble: [], blockMenu: [] },
    variables.feature,
    defineFeature({ id: 'smsBody', advanced: { engineExtensions: [smsBody()] } }),
  ];
}
