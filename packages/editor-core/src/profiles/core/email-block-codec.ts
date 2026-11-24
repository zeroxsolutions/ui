import type { EmailBlockJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import type { EmailBlockEditor } from '../../template/email/define-email-block.js';
import { inlineOf, markupOf } from './email-blocks.js';

function present(entries: readonly (readonly [string, unknown])[]): Record<string, unknown> {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== null));
}

/**
 * The email codec of a product block's node: its rich text field is the node's inline content, its other fields
 * and its attributes are the node's attributes. A field the author left empty exports empty; an attribute
 * left unset exports nothing, so it reads as its default. Its lanes travel as a columns block's do.
 */
export function emailBlockCodec(editor: EmailBlockEditor): NodeCodec {
  return {
    node: editor.node,
    toEmailBlock(node: NodeJSON): EmailBlockJSON {
      const attrs = node.attrs ?? {};
      const text = (name: string): string => (typeof attrs[name] === 'string' ? (attrs[name] as string) : '');
      return {
        id: typeof attrs.id === 'string' ? attrs.id : null,
        key: typeof attrs.key === 'string' ? attrs.key : '',
        type: editor.type,
        attributes: present(editor.attributes.map(({ name }) => [name, attrs[name]])),
        content: {
          ...(editor.body === null ? {} : { [editor.body.name]: markupOf(node.content ?? [], attrs.source) }),
          ...Object.fromEntries(editor.fields.map(({ name }) => [name, text(name)])),
        },
      };
    },
    fromEmailBlock(block: EmailBlockJSON): NodeJSON | null {
      if (block.type !== editor.type) return null;
      const body = editor.body === null ? undefined : block.content[editor.body.name];
      const source = typeof body === 'string' ? body : '';
      const content = editor.body === null ? [] : inlineOf(source);
      return {
        type: editor.node,
        attrs: {
          id: block.id,
          key: block.key,
          ...present(editor.attributes.map(({ name }) => [name, block.attributes[name]])),
          ...Object.fromEntries(
            editor.fields.map(({ name }) => [name, typeof block.content[name] === 'string' ? block.content[name] : '']),
          ),
          ...(editor.body === null ? {} : { source }),
        },
        ...(content.length === 0 ? {} : { content }),
      };
    },
  };
}
