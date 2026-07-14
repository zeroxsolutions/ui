import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  MenuButton,
  MenuButtonAction,
  MenuButtonContent,
  MenuButtonMenu,
  MenuButtonRadioGroup,
  MenuButtonRadioItem,
  MenuButtonTrigger,
} from '@zeroxsolutions/ui/components/menu-button';

/**
 * `MenuButton` is the "remembered default" split control (GitHub-merge / VS Code
 * Run): the primary repeats the *currently-selected* action, and the caret opens
 * a menu that **changes which action is current** rather than firing it. Picking a
 * scope arms it as the primary; the user then clicks the primary to run it.
 * Contrast `SplitButton`, whose primary is a fixed default and whose menu items
 * fire on selection.
 */
const meta: Meta<typeof MenuButton> = {
  title: 'Components/MenuButton',
  component: MenuButton,
};
export default meta;

type Story = StoryObj<typeof MenuButton>;

const SCOPES = {
  once: 'Allow once',
  session: 'Allow this session',
  all: 'Always allow',
} as const;
type Scope = keyof typeof SCOPES;

/**
 * Pick a scope from the caret menu -> it becomes the primary label. The primary
 * then runs that armed scope on click; the menu selection persists as the default.
 */
export const RememberedDefault: Story = {
  render: () => {
    const [value, setValue] = useState<Scope>('once');
    return (
      <MenuButton>
        <MenuButtonAction variant="default" onClick={() => {}}>
          {SCOPES[value]}
        </MenuButtonAction>
        <MenuButtonMenu>
          <MenuButtonTrigger variant="default" aria-label="Change grant scope" />
          <MenuButtonContent>
            <MenuButtonRadioGroup
              value={value}
              onValueChange={(v) => setValue(v as Scope)}
            >
              {(Object.keys(SCOPES) as Scope[]).map((scope) => (
                <MenuButtonRadioItem key={scope} value={scope}>
                  {SCOPES[scope]}
                </MenuButtonRadioItem>
              ))}
            </MenuButtonRadioGroup>
          </MenuButtonContent>
        </MenuButtonMenu>
      </MenuButton>
    );
  },
};
