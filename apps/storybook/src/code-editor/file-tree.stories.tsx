import type { Meta, StoryObj } from '@storybook/react-vite';
import { Folder } from 'lucide-react';
import * as React from 'react';

import {
  FileTree,
  FileTreeGroup,
  FileTreeItem,
  FileTreeLabel,
} from '@zeroxsolutions/ui/file-tree';
import { FileTypeIcon } from '@zeroxsolutions/ui/file-type-icon';

/**
 * `FileTree` is an accessible tree view (WAI-ARIA APG Tree View) for navigating a
 * file bundle. The Root owns selection and folder expansion as
 * controlled/uncontrolled state and drives keyboard navigation (arrows move and
 * collapse/expand, Enter/Space select); consumers compose `FileTreeItem`,
 * `FileTreeLabel`, and `FileTreeGroup` and supply every visible label and icon.
 * The stories build a small folder hierarchy to exercise selection, nesting, and
 * expansion.
 */
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

/**
 * A nested folder hierarchy with controlled selection and expansion, pairing each
 * leaf with a `FileTypeIcon` and each folder with a `Folder` glyph.
 */
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
