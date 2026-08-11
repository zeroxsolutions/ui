'use client';

import * as React from 'react';
import { Code } from 'lucide-react';
import { CodeBlock as CodeBlockSurface } from '@/registry/bases/base-ui/components/code-block';
import { CopyButton } from '@/registry/bases/base-ui/components/copy-button';
import {
  Disclosure,
  DisclosureActions,
  DisclosureContent,
  DisclosureHeader,
  DisclosureTitle,
  DisclosureTrigger,
} from '@/registry/bases/base-ui/components/disclosure';
import { LanguageSwitcher } from '@/registry/bases/base-ui/components/language-switcher';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { CodeMirrorPane } from '../../../shared/code-mirror/index.js';
import {
  CodeSettingsMenu,
  type CodeMirrorSettings,
} from './code-settings-menu.js';

/**
 * A fenced code block. A pure custom node (no engine extension — `standardKit`
 * disables StarterKit's `codeBlock` so this feature owns it): the code + language
 * live in attrs. The **editable** node view composes the design-system chrome —
 * the shared `Disclosure` (header + collapsible body) framing the in-package
 * `CodeMirrorPane` (CodeMirror + Shiki), with a language picker, a settings menu,
 * and a copy control — so the editor owns its editing surface without a bespoke
 * shell. The **read-only** paths (the live Viewer and the export codec) render the
 * read-only `the ui registry` `CodeBlock` (Shiki `<pre>` + copy). Codec is the
 * fenced ```lang block. Engine-free.
 */
const codeBlockAttrs = z.object({
  language: z.string().default('text'),
  code: z.string().default(''),
});
type CodeBlockAttrs = z.infer<typeof codeBlockAttrs>;

/** Editing preferences a fresh block opens with — local view-state, never persisted. */
const DEFAULT_CODE_SETTINGS: CodeMirrorSettings = {
  tabSize: 2,
  useTabs: false,
  showLineNumbers: true,
  softWrap: false,
};

/** Languages the pane highlights as plain text (no grammar) — no Shiki language. */
const PLAIN_LANGUAGES = new Set(['', 'text', 'plaintext', 'plain', 'txt']);

/**
 * The editable surface: the shared `Disclosure` framing `CodeMirrorPane`. Typing
 * writes the node's `code` attr; the `LanguageSwitcher` writes `language`; the
 * settings menu drives the pane's CodeMirror compartments as local view-state
 * (tab size, tabs/spaces, line numbers, soft wrap) — never written to the document.
 */
function EditableCodeBlock({
  attrs,
  updateAttrs,
}: {
  attrs: CodeBlockAttrs;
  updateAttrs: (patch: Partial<CodeBlockAttrs>) => void;
}) {
  const [settings, setSettings] = React.useState<CodeMirrorSettings>(
    DEFAULT_CODE_SETTINGS,
  );
  const patchSettings = React.useCallback(
    (patch: Partial<CodeMirrorSettings>) =>
      setSettings((prev) => ({ ...prev, ...patch })),
    [],
  );

  const { language, code } = attrs;
  const isPlain = PLAIN_LANGUAGES.has(language.toLowerCase());

  return (
    <Disclosure variant="muted" data-language={language} className="group/code">
      <DisclosureHeader>
        <DisclosureTitle>
          <LanguageSwitcher
            kind="code"
            searchable
            value={language || 'text'}
            onValueChange={(next) => updateAttrs({ language: next })}
            aria-label="Language"
            placeholder="Language…"
          />
        </DisclosureTitle>
        <DisclosureActions>
          <CodeSettingsMenu
            settings={settings}
            onSettingsChange={patchSettings}
          />
          <CopyButton value={code} label="Copy code" size="icon" />
          <DisclosureTrigger />
        </DisclosureActions>
      </DisclosureHeader>
      <DisclosureContent>
        <CodeMirrorPane
          value={code}
          language={isPlain ? undefined : language}
          onValueChange={(next) => updateAttrs({ code: next })}
          tabSize={settings.tabSize}
          useTabs={settings.useTabs}
          showLineNumbers={settings.showLineNumbers}
          wrap={settings.softWrap}
          placeholder="Write code…"
          className="h-64"
        />
      </DisclosureContent>
    </Disclosure>
  );
}

/**
 * The node view inside a `contentEditable={false}` boundary that stops
 * pointer/mouse-down from reaching ProseMirror, so editing the code or picking a
 * language never moves the editor selection. `editable` flips between the live
 * `CodeMirrorPane` surface and the read-only `the ui registry` `CodeBlock`.
 */
export function CodeBlockNodeView({
  attrs,
  updateAttrs,
  editable,
}: NodeViewProps<CodeBlockAttrs>) {
  return (
    <div
      data-code-block
      contentEditable={false}
      className="my-4"
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {editable ? (
        <EditableCodeBlock attrs={attrs} updateAttrs={updateAttrs} />
      ) : (
        <CodeBlockSurface code={attrs.code} language={attrs.language} />
      )}
    </div>
  );
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const codeBlockCodec: NodeCodec<CodeBlockAttrs> = {
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
  // The static Viewer reuses the read-only design-system surface, so exported code
  // carries the Shiki highlight + copy control, not a bare `<pre>`.
  toReact: (node) => {
    const { language = 'text', code = '' } = node.attrs ?? {};
    return (
      <CodeBlockSurface code={code} language={language} className="my-4" />
    );
  },
  // Generic: claims every fenced code token. Register language-specialized blocks
  // (e.g. `mermaid`) BEFORE this feature so they can claim their own fences first.
  fromMarkdown: (token) =>
    token.type === 'code'
      ? {
          type: 'codeBlock',
          attrs: {
            language: String(token.lang ?? 'text'),
            code: String(token.value ?? ''),
          },
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
          .object({
            language: z.string().optional(),
            code: z.string().optional(),
          })
          .optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'codeBlock',
              attrs: {
                language: args?.language ?? 'text',
                code: args?.code ?? '',
              },
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
