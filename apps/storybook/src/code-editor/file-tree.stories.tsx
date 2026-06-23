import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Folder } from 'lucide-react';

import {
  FileTree,
  FileTreeGroup,
  FileTreeItem,
  FileTreeLabel,
} from '@chiselart/ui/file-tree';
import { FileTypeIcon } from '@chiselart/ui/file-type-icon';

const meta: Meta<typeof FileTree> = {
  title: 'Code Editor/FileTree',
  component: FileTree,
};
export default meta;

type Story = StoryObj<typeof FileTree>;

function FileLabel({ name }: { name: string }) {
  return (
    <FileTreeLabel>
      <FileTypeIcon name={name} className="size-4 text-muted-foreground" />
      {name.split('/').pop()}
    </FileTreeLabel>
  );
}

export const SkillBundle: Story = {
  render: () => {
    const [value, setValue] = React.useState('SKILL.md');
    const [expanded, setExpanded] = React.useState<string[]>([
      'scripts',
      'references',
    ]);
    return (
      <div className="w-64 rounded-lg border p-2">
        <FileTree
          aria-label="Skill files"
          value={value}
          onValueChange={setValue}
          expanded={expanded}
          onExpandedChange={setExpanded}
        >
          <FileTreeItem value="SKILL.md">
            <FileLabel name="SKILL.md" />
          </FileTreeItem>
          <FileTreeItem value="scripts">
            <FileTreeLabel>
              <Folder className="size-4 text-muted-foreground" />
              scripts
            </FileTreeLabel>
            <FileTreeGroup>
              <FileTreeItem value="scripts/run.py">
                <FileLabel name="scripts/run.py" />
              </FileTreeItem>
              <FileTreeItem value="scripts/util.py">
                <FileLabel name="scripts/util.py" />
              </FileTreeItem>
            </FileTreeGroup>
          </FileTreeItem>
          <FileTreeItem value="references">
            <FileTreeLabel>
              <Folder className="size-4 text-muted-foreground" />
              references
            </FileTreeLabel>
            <FileTreeGroup>
              <FileTreeItem value="references/api.md">
                <FileLabel name="references/api.md" />
              </FileTreeItem>
            </FileTreeGroup>
          </FileTreeItem>
          <FileTreeItem value="assets">
            <FileTreeLabel>
              <Folder className="size-4 text-muted-foreground" />
              assets
            </FileTreeLabel>
            <FileTreeGroup>
              <FileTreeItem value="assets/logo.png">
                <FileLabel name="assets/logo.png" />
              </FileTreeItem>
              <FileTreeItem value="assets/Inter.woff2">
                <FileLabel name="assets/Inter.woff2" />
              </FileTreeItem>
            </FileTreeGroup>
          </FileTreeItem>
        </FileTree>
      </div>
    );
  },
};
