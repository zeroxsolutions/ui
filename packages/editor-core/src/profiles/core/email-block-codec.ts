import type { EmailBlockJSON, NodeCodec, NodeJSON } from '../../document/core/types/index.js';
import type { BlockEditor, BlockEditorItems } from '../../template/email/define-email-block.js';
import { inlineOf, markupOf } from './email-blocks.js';

/** `value` as an items field's items: an array of objects of exactly `items`' fields, each text, `''` where not. */
function itemsOf(items: BlockEditorItems, value: unknown): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry: unknown) => {
    const stored = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
    return Object.fromEntries(
      items.fields.map(({ name }) => [name, typeof stored[name] === 'string' ? (stored[name] as string) : '']),
    );
  });
}

function present(entries: readonly (readonly [string, unknown])[]): Record<string, unknown> {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== null));
}

/**
 * The email codec of a product block's node: its rich text field is the node's inline content, its other fields
 * and its attributes are the node's attributes. A field the author left empty exports empty; an attribute
 * left unset exports nothing, so it reads as its default. Its lanes travel as a columns block's do.
 */
export function emailBlockCodec(editor: BlockEditor): NodeCodec {
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
          ...Object.fromEntries(editor.items.map((items) => [items.name, itemsOf(items, attrs[items.name])])),
        },
      };
    },
    fromEmailBlock(block: EmailBlockJSON): NodeJSON | null {
      if (block.type !== editor.type) return null;
      const body = editor.body === null ? undefined : block.content[editor.body.name];
      const source = typeof body === 'string' ? body : '';
      // A lanes block's lanes, which the import fills with their blocks; a block of no lanes holds its body.
      const content: NodeJSON[] =
        editor.lanes !== null
          ? (block.lanes ?? []).map(() => ({ type: 'emailLane' }))
          : editor.body === null
            ? []
            : inlineOf(source);
      return {
        type: editor.node,
        attrs: {
          id: block.id,
          key: block.key,
          ...present(editor.attributes.map(({ name }) => [name, block.attributes[name]])),
          ...Object.fromEntries(
            editor.fields.map(({ name }) => [name, typeof block.content[name] === 'string' ? block.content[name] : '']),
          ),
          ...Object.fromEntries(editor.items.map((items) => [items.name, itemsOf(items, block.content[items.name])])),
          ...(editor.body === null ? {} : { source }),
        },
        ...(content.length === 0 ? {} : { content }),
      };
    },
  };
}
