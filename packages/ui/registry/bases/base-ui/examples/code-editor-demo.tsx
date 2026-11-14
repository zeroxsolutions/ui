'use client';

import { useState, type ReactNode } from 'react';

import { CodeEditor, CodeEditorContent, useCodeEditor, type RoutedFile } from '@/registry/bases/base-ui/editor/code';
import { FileTree, FileTreeItem, FileTreeLabel } from '@/registry/bases/base-ui/components/data-display/file-tree';

const initial: RoutedFile[] = [
  {
    path: 'itinerary.ts',
    view: 'code',
    language: 'typescript',
    text: "export const stops = ['Hanoi', 'Hue', 'Hoi An'];\n",
  },
  { path: 'README.md', view: 'markdown', text: '# Itinerary\n\nThree stops, ten days.' },
];

function Tree(): ReactNode {
  const { files, activePath, setActivePath } = useCodeEditor();
  return (
    <FileTree aria-label="Files" value={activePath} onValueChange={setActivePath} className="w-40 shrink-0">
      {files.map((file) => (
        <FileTreeItem key={file.path} value={file.path}>
          <FileTreeLabel>{file.path}</FileTreeLabel>
        </FileTreeItem>
      ))}
    </FileTree>
  );
}

/** Two files, a tree to pick one and a pane that edits the code and reads the Markdown. */
function CodeEditorDemo(): ReactNode {
  const [files, setFiles] = useState(initial);
  return (
    <CodeEditor
      files={files}
      defaultValue="itinerary.ts"
      onFileTextChange={(path, text) =>
        setFiles((current) => current.map((file) => (file.path === path && 'text' in file ? { ...file, text } : file)))
      }
    >
      <div className="flex h-64 w-full max-w-2xl gap-3">
        <Tree />
        <div className="min-w-0 flex-1">
          <CodeEditorContent>Pick a file.</CodeEditorContent>
        </div>
      </div>
    </CodeEditor>
  );
}

export { CodeEditorDemo };
