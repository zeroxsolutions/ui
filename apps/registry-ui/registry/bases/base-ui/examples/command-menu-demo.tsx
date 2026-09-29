'use client';

import { useState, type ReactNode } from 'react';

import { CommandMenu, CommandMenuItem } from '@/registry/bases/base-ui/components/navigation/command-menu';
import { useCommandShortcut } from '@/registry/bases/base-ui/hooks/use-command-shortcut';
import { CommandEmpty, CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';

const FILES = ['SKILL.md', 'scripts/run.py', 'settings.json'] as const;

/** A command palette, reopened by Ctrl/Cmd+K, that reports the chosen file. */
function CommandMenuDemo(): ReactNode {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<string>('SKILL.md');
  useCommandShortcut({ key: 'k', onTrigger: () => setOpen(true) });

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-muted-foreground text-sm">Picked: {picked}</p>
      <CommandMenu open={open} onOpenChange={setOpen} onValueChange={setPicked}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandEmpty>No file found.</CommandEmpty>
          {FILES.map((file) => (
            <CommandMenuItem key={file} value={file}>
              {file}
            </CommandMenuItem>
          ))}
        </CommandList>
      </CommandMenu>
    </div>
  );
}

export { CommandMenuDemo };
