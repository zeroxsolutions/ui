import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { CommandMenu, CommandMenuItem } from '@/components/navigation/command-menu';
import { Button } from '@/components/ui/button';
import { CommandEmpty, CommandInput, CommandList } from '@/components/ui/command';
import { Text } from '@/components/ui/text';

const FILES = ['SKILL.md', 'scripts/run.py', 'settings.json'] as const;

/** A command palette, opened from its button, that reports the chosen file. */
function CommandMenuDemo(): ReactNode {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string>('SKILL.md');

  return (
    <View className="w-full items-start gap-2">
      <Button variant="outline" onPress={() => setOpen(true)}>
        <Text>Open menu</Text>
      </Button>
      <Text className="text-muted-foreground text-sm">Picked: {picked}</Text>
      <CommandMenu open={open} onOpenChange={setOpen} onValueChange={setPicked}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandEmpty>No file found.</CommandEmpty>
          {FILES.map((file) => (
            <CommandMenuItem key={file} value={file}>
              <Text>{file}</Text>
            </CommandMenuItem>
          ))}
        </CommandList>
      </CommandMenu>
    </View>
  );
}

export { CommandMenuDemo };
