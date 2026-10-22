import { Calculator, Calendar, CreditCard, Settings, Smile, User } from 'lucide-react-native';
import type { ReactNode } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function CommandDemo(): ReactNode {
  return (
    <Command className="border-border max-w-sm rounded-lg border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Icon as={Calendar} />
            <Text>Calendar</Text>
          </CommandItem>
          <CommandItem>
            <Icon as={Smile} />
            <Text>Search Emoji</Text>
          </CommandItem>
          <CommandItem disabled>
            <Icon as={Calculator} />
            <Text>Calculator</Text>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <Icon as={User} />
            <Text>Profile</Text>
            <CommandShortcut>{'\u2318P'}</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Icon as={CreditCard} />
            <Text>Billing</Text>
            <CommandShortcut>{'\u2318B'}</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Icon as={Settings} />
            <Text>Settings</Text>
            <CommandShortcut>{'\u2318S'}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export { CommandDemo };
