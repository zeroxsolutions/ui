import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '../../core/index.js';
import { resolveCodeMirrorPane } from './code-mirror-pane.js';

/**
 * A fenced code block. A pure custom node (no engine extension — `standardKit`
 * disables StarterKit's `codeBlock` so this feature owns it): the code + language
 * live in attrs and are edited through the {@link resolveCodeMirrorPane} seam, so
 * the heavy syntax editor stays out of the core and out of the engine. Codec is
 * the fenced ```lang block. Engine-free.
 */
const codeBlockAttrs = z.object({
  language: z.string().default('text'),
  code: z.string().default(''),
});
type CodeBlockAttrs = z.infer<typeof codeBlockAttrs>;

function CodeBlockView({ attrs, updateAttrs, editable }: NodeViewProps<CodeBlockAttrs>) {
  const Pane = resolveCodeMirrorPane();
  return (
    <div className="zerox-code-block" data-language={attrs.language} contentEditable={false}>
      <div className="zerox-code-block-toolbar">
        {editable ? (
          <input
            className="zerox-code-block-lang"
            value={attrs.language}
            spellCheck={false}
            aria-label="Language"
            onChange={(event) => updateAttrs({ language: event.target.value })}
          />
        ) : (
          <span className="zerox-code-block-lang">{attrs.language}</span>
        )}
      </div>
      <Pane
        value={attrs.code}
        language={attrs.language}
        readOnly={!editable}
        onChange={(code) => updateAttrs({ code })}
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
  toReact: (node) => {
    const { language = 'text', code = '' } = node.attrs ?? {};
    return (
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    );
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
        render: CodeBlockView,
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
        title: 'Code block',
        description: 'Syntax-highlighted code',
        group: 'Blocks',
        keywords: ['code', 'snippet', 'pre', 'monospace'],
        command: 'insertCodeBlock',
      },
    ],
  });
}
