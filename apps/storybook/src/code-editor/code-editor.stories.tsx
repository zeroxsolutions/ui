import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { CodeEditor, CodeEditorContent } from '@zeroxsolutions/editor/code/code-editor';
import { CommandInput, CommandList } from '@zeroxsolutions/ui/components/ui/command';
import {
  CommandSwitcher,
  CommandSwitcherItem,
} from '@zeroxsolutions/ui/components/command-switcher';
import { Empty } from '@zeroxsolutions/ui/components/ui/empty';
import { type RoutedFile } from '@zeroxsolutions/editor/code/file-content-router';
import {
  FileTree,
  FileTreeGroup,
  FileTreeItem,
  FileTreeLabel,
} from '@zeroxsolutions/ui/components/file-tree';
import { FileTypeIcon } from '@zeroxsolutions/ui/components/file-type-icon';
import { useCommandShortcut } from '@zeroxsolutions/ui/hooks/use-command-shortcut';

const INITIAL: RoutedFile[] = [
  {
    path: 'SKILL.md',
    view: 'code',
    language: 'markdown',
    text: '---\nname: pdf-filler\ndescription: Fill PDF forms from a JSON payload\n---\n\n# PDF Filler\n\nUse `scripts/fill.py` with a field map.\n',
  },
  {
    path: 'scripts/fill.py',
    view: 'code',
    language: 'python',
    text: 'import sys, json\n\n\ndef fill(template: str, data: dict) -> bytes:\n    """Render the template with the supplied field values."""\n    ...\n\n\nif __name__ == "__main__":\n    fill(sys.argv[1], json.load(sys.stdin))\n',
  },
  {
    path: 'scripts/util.py',
    view: 'code',
    language: 'python',
    text: 'def slugify(name: str) -> str:\n    return name.strip().lower().replace(" ", "-")\n',
  },
  {
    path: 'references/fields.json',
    view: 'code',
    language: 'json',
    text: '{\n  "name": "string",\n  "date": "iso8601",\n  "signed": "boolean"\n}\n',
  },
];

const FOLDERS = [
  { value: 'scripts', children: ['scripts/fill.py', 'scripts/util.py'] },
  { value: 'references', children: ['references/fields.json'] },
];
const ROOT_FILES = ['SKILL.md'];

/**
 * `CodeEditor` is the headless root for a multi-file code editor: it holds the
 * open files and the active selection in React context and leaves the layout to
 * the consumer, who assembles a `FileTree`, a `CodeEditorContent` pane, and a
 * `CommandSwitcher` against that shared state. It owns no persistence or dirty
 * tracking — the consumer holds the files and reacts to `onFileTextChange`.
 */
const meta: Meta<typeof CodeEditor> = {
  title: 'Code Editor/CodeEditor',
  component: CodeEditor,
};
export default meta;

type Story = StoryObj<typeof CodeEditor>;

/**
 * A full workspace wiring: a file tree, the routed content pane, and a ⌘K command
 * switcher all bound to one active-path selection, with edits flowing back through
 * `onFileTextChange`.
 */
export const Workspace: Story = {
  render: () => {
    const [files, setFiles] = React.useState(INITIAL);
    const [active, setActive] = React.useState('SKILL.md');
    const [paletteOpen, setPaletteOpen] = React.useState(false);
    useCommandShortcut({
      key: 'k',
      onTrigger: () => setPaletteOpen((o) => !o),
    });

    const onFileTextChange = (path: string, text: string) =>
      setFiles((prev) =>
        prev.map((f) => (f.path === path ? { ...f, text } : f)),
      );

    const label = (path: string) => (
      <>
        <FileTypeIcon name={path} className="size-4 text-muted-foreground" />
        {path.split('/').pop()}
      </>
    );

    return (
      <CodeEditor
        files={files}
        value={active}
        onValueChange={setActive}
        onFileTextChange={onFileTextChange}
      >
        <div className="flex h-[460px] w-[760px] overflow-hidden rounded-xl border border-border">
          <div className="w-60 shrink-0 overflow-auto border-r border-border bg-sidebar p-2">
            <FileTree
              aria-label="Skill files"
              value={active}
              onValueChange={setActive}
              defaultExpanded={['scripts', 'references']}
            >
              {ROOT_FILES.map((path) => (
                <FileTreeItem key={path} value={path}>
                  <FileTreeLabel>{label(path)}</FileTreeLabel>
                </FileTreeItem>
              ))}
              {FOLDERS.map((folder) => (
                <FileTreeItem key={folder.value} value={folder.value}>
                  <FileTreeLabel>
                    <FileTypeIcon
                      name="folder"
                      className="size-4 text-muted-foreground"
                    />
                    {folder.value}
                  </FileTreeLabel>
                  <FileTreeGroup>
                    {folder.children.map((path) => (
                      <FileTreeItem key={path} value={path}>
                        <FileTreeLabel>{label(path)}</FileTreeLabel>
                      </FileTreeItem>
                    ))}
                  </FileTreeGroup>
                </FileTreeItem>
              ))}
            </FileTree>
          </div>

          <div className="min-w-0 flex-1">
            <CodeEditorContent>
              <Empty>Select a file to edit.</Empty>
            </CodeEditorContent>
          </div>
        </div>

        <CommandSwitcher
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onValueChange={setActive}
        >
          <CommandInput placeholder="Jump to file… (⌘K)" />
          <CommandList>
            {files.map((file) => (
              <CommandSwitcherItem key={file.path} value={file.path}>
                <FileTypeIcon
                  name={file.path}
                  className="text-muted-foreground"
                />
                {file.path}
              </CommandSwitcherItem>
            ))}
          </CommandList>
        </CommandSwitcher>
      </CodeEditor>
    );
  },
};
