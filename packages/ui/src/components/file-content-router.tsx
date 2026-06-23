import * as React from 'react';

import { cn } from '@/lib/utils';
import { BinaryFileCard } from './binary-file-card';
import { CodeEditorPane } from './code-editor-pane';
import { FontPreview } from './font-preview';
import { ImagePreview } from './image-preview';
import { MarkdownView } from './markdown-view';

/**
 * A file, already classified into how it should be shown. The discriminant
 * `view` is decided upstream (a registry, or the {@link fileView} helper) — this
 * component routes, it does not guess.
 */
export type RoutedFile =
  | { path: string; view: 'code'; text: string; language?: string }
  | { path: string; view: 'markdown'; text: string }
  | { path: string; view: 'image'; src: string; alt?: string }
  | { path: string; view: 'font'; src: string; format?: string }
  | { path: string; view: 'binary' };

/** The view kind a file is routed to. */
export type FileView = RoutedFile['view'];

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  lua: 'lua',
  sql: 'sql',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  html: 'html',
  xml: 'xml',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  env: 'ini',
  dockerfile: 'dockerfile',
};

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'bmp',
  'ico',
]);
const FONT_EXTENSIONS = new Set(['woff', 'woff2', 'ttf', 'otf', 'eot']);

function extensionOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot + 1).toLowerCase();
}

/** How a file's view kind and (for code) language id are derived. */
export interface FileViewKind {
  view: FileView;
  language?: string;
}

/**
 * A sensible default classification for a path by its extension: images and
 * fonts to their previews, Markdown and known code/data to an editor (Markdown
 * is editable code by default — the preview is opt-in via the `markdown` view),
 * everything else to the binary fallback. Convenience for call-sites that don't
 * already know `view` — pass an explicit {@link RoutedFile} to override.
 */
export function fileView(path: string): FileViewKind {
  const extension = extensionOf(path);
  if (IMAGE_EXTENSIONS.has(extension)) return { view: 'image' };
  if (FONT_EXTENSIONS.has(extension)) return { view: 'font' };
  if (extension === 'md' || extension === 'mdx' || extension === 'markdown') {
    return { view: 'code', language: 'markdown' };
  }
  if (extension in EXTENSION_TO_LANGUAGE) {
    return { view: 'code', language: EXTENSION_TO_LANGUAGE[extension] };
  }
  return { view: 'binary' };
}

export interface FileContentRouterProps
  extends Omit<React.ComponentProps<'div'>, 'children' | 'onChange'> {
  /** The file to display, already classified by `view`. */
  file: RoutedFile;
  /** Render an editable file read-only. */
  readOnly?: boolean;
  /** Fired with new text when an editable (`code`) file is edited. */
  onTextChange?: (text: string) => void;
  /** Replaces the default `BinaryFileCard` for the `binary` view. */
  children?: React.ReactNode;
}

/**
 * Picks the right viewer for a {@link RoutedFile} — code → `CodeEditorPane`,
 * markdown → `MarkdownView`, image → `ImagePreview`, font → `FontPreview`, else
 * → `BinaryFileCard`. The type-aware heart of the editor; carries no app
 * knowledge or copy (override the binary fallback via `children`). Fills the
 * space it is given.
 */
export function FileContentRouter({
  file,
  readOnly,
  onTextChange,
  children,
  className,
  ...props
}: FileContentRouterProps) {
  let content: React.ReactNode;
  switch (file.view) {
    case 'code':
      content = (
        <CodeEditorPane
          value={file.text}
          language={file.language}
          readOnly={readOnly}
          onValueChange={onTextChange}
          className="size-full rounded-none border-0 focus-within:border-0 focus-within:ring-0"
        />
      );
      break;
    case 'markdown':
      content = (
        <div className="size-full overflow-auto p-4">
          <MarkdownView>{file.text}</MarkdownView>
        </div>
      );
      break;
    case 'image':
      content = <ImagePreview src={file.src} alt={file.alt} />;
      break;
    case 'font':
      content = (
        <div className="size-full overflow-auto p-6">
          <FontPreview src={file.src} format={file.format} />
        </div>
      );
      break;
    case 'binary':
      content = children ?? <BinaryFileCard name={file.path} />;
      break;
  }

  return (
    <div
      data-slot="file-content-router"
      data-view={file.view}
      className={cn('size-full', className)}
      {...props}
    >
      {content}
    </div>
  );
}
