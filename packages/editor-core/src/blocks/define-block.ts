import type { NodeCodec, NodeSpec } from '../document/core/types/index.js';
import {
  assertBlockShape,
  BlockDefinitionInvalid,
  blockEditorOf,
  builtInEmailBlockOf,
  emailBlockOf,
  type AttributeMap,
  type BlockEditor,
  type BlockShape,
  type EmailBlockAttributes,
  type EmailBlockContent,
  type EmailBlockDefinition,
  type EmailBlockOptions,
  type FieldMap,
  type LibraryRules,
} from '../template/email/define-email-block.js';
import { documentAttributes, documentCodecOf, type DocumentBlockHtml } from './document-codec.js';

/** The mark names the Document Editor's own marks and the email editor's take. */
export const DOCUMENT_MARKS: ReadonlySet<string> = new Set([
  'link',
  'emailLink',
  'bold',
  'italic',
  'strike',
  'code',
  'underline',
  'highlight',
  'subscript',
  'superscript',
  'textStyle',
  'textColor',
  'textBackground',
]);

/**
 * The node names the Document Editor's own blocks, the email editor's and the library's take. A defined block's node beside one of
 * them would be a second node of that name in one schema.
 */
const DOCUMENT_NODES: ReadonlySet<string> = new Set([
  'doc',
  'text',
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
  'codeBlock',
  'horizontalRule',
  'hardBreak',
  'image',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
  'callout',
  'toggle',
  'embed',
  'math',
  'mermaid',
  'mention',
  'button',
  'columns',
  'column',
  'section',
  'mathBlock',
  'mathInline',
  'variable',
  'toggleHeading',
  'emailHtml',
  'emailUnknown',
  // The engine keeps the marks' names in the same namespace as the nodes'.
  ...DOCUMENT_MARKS,
]);

/**
 * The node names the library's own document blocks take. A product's block of one of these types would be a second
 * node of that name beside the library's; the library declares its own through `defineLibraryBlock`.
 */
const LIBRARY_NODES: ReadonlySet<string> = new Set(['card', 'bookmark', 'file', 'media', 'tableOfContents']);

/** How a block draws in a document's exports: its HTML, which Markdown also carries. */
export interface DocumentSide<F extends FieldMap, A extends AttributeMap> {
  readonly html: DocumentBlockHtml<EmailBlockContent<F>, EmailBlockAttributes<A>>;
}

export interface BlockOptions<Type extends string, F extends FieldMap, A extends AttributeMap> extends BlockShape<
  Type,
  F,
  A
> {
  /** The slash menu's icon, which an editor draws as it is; the editor's own when absent. */
  readonly icon?: unknown;
  /** The block in an email: its render over primitives and its sample, as `defineEmailBlock` takes them. */
  readonly email?: Pick<EmailBlockOptions<Type, F, A>, 'render' | 'sample'>;
  /** The block in a document: how its exports draw it. */
  readonly document?: DocumentSide<F, A>;
}

/** A block's document node, for an editor to give a view, and its HTML and Markdown codec. */
export interface DocumentBlock {
  readonly node: NodeSpec;
  readonly codec: NodeCodec;
}

/**
 * One block for either editor or both: the description an editor builds its node, slash item and block menu
 * from, its email side for the renderer and the email profile, and its document side for the Document Editor.
 */
export interface Block<
  Type extends string = string,
  F extends FieldMap = FieldMap,
  A extends AttributeMap = AttributeMap,
> {
  readonly type: Type;
  readonly label: string;
  readonly icon: unknown;
  /** Its node is the type where a document holds it, `email_<type>` where only an email does. */
  readonly editor: BlockEditor;
  /** Hand it to `createEmailRenderer`'s `extraBlocks`; null for a block only a document holds. */
  readonly email: EmailBlockDefinition<Type, F, A> | null;
  readonly document: DocumentBlock | null;
}

/**
 * A block declared once for the Document Editor, the email editor or both. Its email side is what
 * `defineEmailBlock` builds; its document side is a node whose attributes are the fields but the body, the items
 * and the attributes, and whose inline content is the body. Pass the block to `emailProfile({ blocks })` and the
 * editors; pass `email` to `createEmailRenderer`.
 *
 * @throws {BlockDefinitionInvalid} for a block with neither side; with a document side, for a lanes field or a
 * type the Document Editor's own nodes or the library's blocks take; and for what `defineEmailBlock` refuses, the default types for an
 * email side only
 */
export function defineBlock<
  const Type extends string,
  const F extends FieldMap,
  const A extends AttributeMap = Record<never, never>,
>(options: BlockOptions<Type, F, A>): Block<Type, F, A> {
  if (options.document !== undefined && LIBRARY_NODES.has(options.type)) {
    throw new BlockDefinitionInvalid(options.type, 'the type names a library block');
  }
  return blockOf(options, emailBlockOf);
}

/**
 * A block of the library itself, whose type the renderer knows by default or the library reserves for its own
 * document block, so it is built without the checks `defineBlock` makes against those types, its email side under
 * the library's `rules`.
 *
 * @throws {BlockDefinitionInvalid} as `defineBlock` does, but for a default or library type
 */
export function defineLibraryBlock<
  const Type extends string,
  const F extends FieldMap,
  const A extends AttributeMap = Record<never, never>,
>(options: BlockOptions<Type, F, A>, rules: LibraryRules = {}): Block<Type, F, A> {
  return blockOf(options, (email, node) => builtInEmailBlockOf(email, node, rules));
}

function blockOf<const Type extends string, const F extends FieldMap, const A extends AttributeMap>(
  options: BlockOptions<Type, F, A>,
  emailOf: (options: EmailBlockOptions<Type, F, A>, node: string) => EmailBlockDefinition<Type, F, A>,
): Block<Type, F, A> {
  const shape = options as unknown as BlockShape<string, FieldMap, AttributeMap>;
  const refuse = (reason: string): never => {
    throw new BlockDefinitionInvalid(options.type, reason);
  };
  if (options.email === undefined && options.document === undefined) {
    refuse('it has neither a document nor an email side');
  }
  assertBlockShape(shape);
  if (options.document !== undefined) {
    if (Object.values(options.fields).some((field) => field.kind === 'lanes')) {
      refuse('a document block holds no lanes field');
    }
    if (DOCUMENT_NODES.has(options.type)) refuse('the type names a Document Editor node');
  }
  const node = options.document === undefined ? `email_${options.type}` : options.type;
  const email =
    options.email === undefined
      ? null
      : emailOf({ ...options, ...options.email } as EmailBlockOptions<Type, F, A>, node);
  const editor = email?.editor ?? blockEditorOf(shape, node);
  return {
    type: options.type,
    label: options.label,
    icon: options.icon,
    editor,
    email,
    document:
      options.document === undefined
        ? null
        : {
            node: {
              name: node,
              group: 'block',
              draggable: true,
              selectable: true,
              attrs: documentAttributes(editor),
              ...(editor.body === null ? { atom: true } : { content: 'inline*' }),
            },
            codec: documentCodecOf(editor, options.document.html as DocumentBlockHtml<never, never>),
          },
  };
}
