import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';

function DropdownMenuDemo(): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="self-start">
          <Text>Open</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <Text>Profile</Text>
            <DropdownMenuShortcut>{'\u21E7\u2318P'}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Text>Billing</Text>
            <DropdownMenuShortcut>{'\u2318B'}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Text>Settings</Text>
            <DropdownMenuShortcut>{'\u2318S'}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Text>Team</Text>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Text>Invite users</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <Text>Email</Text>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Text>Message</Text>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Text>New Team</Text>
            <DropdownMenuShortcut>{'\u2318T'}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Text>API</Text>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <Text>Log out</Text>
          <DropdownMenuShortcut>{'\u21E7\u2318Q'}</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownMenuDemo };
