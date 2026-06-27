import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { Button } from '@zeroxsolutions/ui/button';
import {
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandShortcut,
} from '@zeroxsolutions/ui/command';
import {
  CommandSwitcher,
  CommandSwitcherItem,
} from '@zeroxsolutions/ui/command-switcher';
import { FileTypeIcon } from '@zeroxsolutions/ui/file-type-icon';
import { useCommandShortcut } from '@zeroxsolutions/ui/use-command-shortcut';

const FILES = [
  'SKILL.md',
  'manifest.json',
  'scripts/run.py',
  'scripts/util.py',
  'references/api.md',
  'assets/logo.png',
];

const meta: Meta<typeof CommandSwitcher> = {
  title: 'Code Editor/CommandSwitcher',
  component: CommandSwitcher,
};
export default meta;

type Story = StoryObj<typeof CommandSwitcher>;

export const FileJump: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState('SKILL.md');
    useCommandShortcut({ key: 'k', onTrigger: () => setOpen((o) => !o) });

    return (
      <div className="flex flex-col items-start gap-3">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Jump to file
          <CommandShortcut>⌘K</CommandShortcut>
        </Button>
        <span className="text-sm text-muted-foreground">Active: {active}</span>

        <CommandSwitcher
          open={open}
          onOpenChange={setOpen}
          onValueChange={setActive}
        >
          <CommandInput placeholder="Jump to file…" />
          <CommandList>
            <CommandEmpty>No files found.</CommandEmpty>
            {FILES.map((file) => (
              <CommandSwitcherItem key={file} value={file}>
                <FileTypeIcon name={file} className="text-muted-foreground" />
                {file}
              </CommandSwitcherItem>
            ))}
          </CommandList>
        </CommandSwitcher>
      </div>
    );
  },
};
