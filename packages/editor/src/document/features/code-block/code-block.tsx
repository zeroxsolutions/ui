import { Code } from 'lucide-react';
import { CodeBlock as CodeBlockSurface } from '@zeroxsolutions/ui/components/ai-elements/code-block';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '../../core/index.js';

/**
 * A fenced code block. A pure custom node (no engine extension — `standardKit`
 * disables StarterKit's `codeBlock` so this feature owns it): the code + language
 * live in attrs. Rendering **reuses the design-system `CodeBlock`** directly — its
 * Shiki-highlighted read-only view, its copy control, and (when `editable`) its
 * CodeMirror editing surface — so the editor adds no bespoke code chrome and no
 * wrapper of its own. Codec is the fenced ```lang block. Engine-free.
 */
const codeBlockAttrs = z.object({
  language: z.string().default('text'),
  code: z.string().default(''),
});
type CodeBlockAttrs = z.infer<typeof codeBlockAttrs>;

/**
 * The node view: the design-system `CodeBlock` inside a `contentEditable={false}`
 * boundary that stops pointer/mouse-down from reaching ProseMirror, so editing the
 * code or picking a language never moves the editor selection or re-selects the
 * node. `editable` flips the surface between the read-only Shiki view and the
 * editable CodeMirror pane; edits and language changes write straight to attrs.
 */
function CodeBlockNodeView({ attrs, updateAttrs, editable }: NodeViewProps<CodeBlockAttrs>) {
  return (
    <div
      data-code-block
      contentEditable={false}
      className="my-4"
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <CodeBlockSurface
        code={attrs.code}
        language={attrs.language}
        editable={editable}
        onCodeChange={(code) => updateAttrs({ code })}
        onLanguageChange={(language) => updateAttrs({ language })}
      />
    </div>
  );
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const codeBlockCodec: NodeCodec<CodeBlockAttrs> = {
  node: 'codeBlock',
  toMarkdown: (node) => {
    const { language = 'text', code = '' } = node.attrs ?? {};
    const fence = language && language !== 'text' ? language : '';
    return `\`\`\`${fence}\n${code}\n\`\`\``;
  },
  toHTML: (node) => {
    const { language = 'text', code = '' } = node.attrs ?? {};
    return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  },
  // The static Viewer reuses the same read-only design-system surface, so exported
  // code carries the Shiki highlight + copy control, not a bare `<pre>`.
  toReact: (node) => {
    const { language = 'text', code = '' } = node.attrs ?? {};
    return <CodeBlockSurface code={code} language={language} className="my-4" />;
  },
  // Generic: claims every fenced code token. Register language-specialized blocks
  // (e.g. `mermaid`) BEFORE this feature so they can claim their own fences first.
  fromMarkdown: (token) =>
    token.type === 'code'
      ? {
          type: 'codeBlock',
          attrs: { language: String(token.lang ?? 'text'), code: String(token.value ?? '') },
        }
      : null,
  fromHTML: (element) => {
    if (element.tagName !== 'PRE') return null;
    const codeEl = element.querySelector('code');
    const className = codeEl?.getAttribute('class') ?? '';
    const language = /language-(\S+)/.exec(className)?.[1] ?? 'text';
    return {
      type: 'codeBlock',
      attrs: { language, code: (codeEl ?? element).textContent ?? '' },
    };
  },
};

export function codeBlock(): EditorFeature {
  return defineFeature({
    id: 'code-block',
    nodes: [
      {
        name: 'codeBlock',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        attrs: codeBlockAttrs,
        render: CodeBlockNodeView,
      },
    ],
    codecs: [codeBlockCodec as NodeCodec],
    commands: {
      insertCodeBlock: {
        args: z
          .object({ language: z.string().optional(), code: z.string().optional() })
          .optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'codeBlock',
              attrs: { language: args?.language ?? 'text', code: args?.code ?? '' },
            },
          }),
      },
    },
    slash: [
      {
        id: 'codeBlock',
        icon: <Code className="size-4" />,
        title: 'Code block',
        description: 'Syntax-highlighted code',
        group: 'Blocks',
        keywords: ['code', 'snippet', 'pre', 'monospace'],
        command: 'insertCodeBlock',
      },
    ],
  });
}
