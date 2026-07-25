'use client';

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

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

/**
 * Authored props per part - the meaningful config a consumer touches. Compound
 * parts forward their primitive's props (Button / DropdownMenu*); the consumer
 * owns the current `value` and threads it to action label + radio group.
 */
const MENU_BUTTON_PROPS: PropEntry[] = [
  {
    name: 'MenuButtonAction',
    type: 'ComponentProps<typeof Button>',
    default: 'variant="outline"',
    description:
      'Primary segment - repeats the currently-selected action; its label reflects value.',
  },
  {
    name: 'MenuButtonTrigger',
    type: 'ComponentProps<typeof Button>',
    default: 'variant="outline", size="icon"',
    description:
      'Caret segment - opens the menu that changes the current action. aria-label defaults to "Change action".',
  },
  {
    name: 'MenuButtonContent',
    type: 'ComponentProps<typeof DropdownMenuContent>',
    default: 'align="end"',
    description:
      'Dropdown surface; sized to its content (w-auto) so labels do not wrap.',
  },
  {
    name: 'MenuButtonRadioGroup',
    type: 'ComponentProps<typeof DropdownMenuRadioGroup>',
    default: '-',
    description:
      'The current-selection group - value + onValueChange set the default that the primary repeats.',
  },
  {
    name: 'MenuButtonRadioItem',
    type: 'ComponentProps<typeof DropdownMenuRadioItem>',
    default: '-',
    description: 'One selectable default; the checked one is the current action.',
  },
  {
    name: 'MenuButtonMenu',
    type: 'ComponentProps<typeof DropdownMenu>',
    default: '-',
    description: 'Menu wrapper - owns open + selection state via Base UI DropdownMenu.',
  },
];

/** Root -> Action + Menu -> Trigger + Content -> RadioGroup -> RadioItem. */
const MENU_BUTTON_COMPOSITION: CompositionNode = {
  name: 'MenuButton',
  slot: 'Root',
  children: [
    { name: 'MenuButtonAction', slot: 'Action' },
    {
      name: 'MenuButtonMenu',
      slot: 'Menu',
      children: [
        { name: 'MenuButtonTrigger', slot: 'Trigger' },
        {
          name: 'MenuButtonContent',
          slot: 'Content',
          children: [
            {
              name: 'MenuButtonRadioGroup',
              slot: 'RadioGroup',
              children: [{ name: 'MenuButtonRadioItem', slot: 'RadioItem' }],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Doc page for `MenuButton`. The Preview keeps the live stateful render that
 * `radius-seam.spec.ts` measures, so this retrofit adds the Code/Props/
 * Composition tabs around it without touching the component.
 */
export default function MenuButtonPreviewPage() {
  const [value, setValue] = useState<(typeof OPTIONS)[number]['value']>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <DocPage
      title="MenuButton"
      description="A remembered-default split control - the primary repeats the currently-selected action and the caret opens a menu that changes which action is current. Composes ButtonGroup for the seamed outline."
      preview={
        <ComponentPreview>
          <MenuButton aria-label="Remembered action">
            <MenuButtonAction>{current?.label}</MenuButtonAction>
            <MenuButtonMenu>
              <MenuButtonTrigger aria-label="Change action" />
              <MenuButtonContent>
                <MenuButtonRadioGroup
                  value={value}
                  onValueChange={(next) => setValue(next as typeof value)}
                >
                  {OPTIONS.map((option) => (
                    <MenuButtonRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuButtonRadioItem>
                  ))}
                </MenuButtonRadioGroup>
              </MenuButtonContent>
            </MenuButtonMenu>
          </MenuButton>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="menu-button"
          importPath="components/menu-button"
          exportedAs="MenuButton"
        />
      }
      propsTable={<PropsTable rows={MENU_BUTTON_PROPS} />}
      composition={<CompositionTree tree={MENU_BUTTON_COMPOSITION} />}
    />
  );
}
