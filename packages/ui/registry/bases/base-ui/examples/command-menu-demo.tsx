'use client';

import { useState, type ReactNode } from 'react';

import { CommandMenu, CommandMenuItem } from '@/registry/bases/base-ui/components/navigation/command-menu';
import { useCommandShortcut } from '@/registry/bases/base-ui/hooks/use-command-shortcut';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CommandEmpty, CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';

const FILES = ['SKILL.md', 'scripts/run.py', 'settings.json'] as const;

/** A command palette, opened from its button or by Ctrl/Cmd+K, that reports the chosen file. */
function CommandMenuDemo(): ReactNode {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string>('SKILL.md');
  useCommandShortcut({ key: 'k', onTrigger: () => setOpen(true) });

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open menu
        </Button>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
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
