import { useState } from 'react';
import { Code } from 'lucide-react';
import { LanguageSwitcher } from '@zeroxsolutions/ui/components/language-switcher';
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

/** Copy-to-clipboard button that flips to a confirmation for ~1.5s. */
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
      onClick={() => {
        void navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlockView({ attrs, updateAttrs, editable }: NodeViewProps<CodeBlockAttrs>) {
  const Pane = resolveCodeMirrorPane();
  return (
    <div
      data-slot="code-block"
      data-language={attrs.language}
      contentEditable={false}
      className="my-4 overflow-hidden rounded-lg border bg-muted/40"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        {editable ? (
          <LanguageSwitcher.Dropdown
            kind="code"
            searchable
            value={attrs.language}
            onValueChange={(language) => updateAttrs({ language })}
            aria-label="Language"
            placeholder="Language…"
            className="h-7 min-w-32 gap-1.5 border-0 bg-transparent text-xs shadow-none hover:bg-accent"
          />
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{attrs.language}</span>
        )}
        <CopyCodeButton code={attrs.code} />
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
      <pre
        data-slot="code-block"
        data-language={language}
        className="my-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-sm"
      >
        <code className={`language-${language} font-mono`}>{code}</code>
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
