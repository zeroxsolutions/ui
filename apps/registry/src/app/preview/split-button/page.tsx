'use client';

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@zeroxsolutions/ui/components/split-button';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/**
 * Authored props per part - the meaningful config a consumer touches. Compound
 * parts forward their primitive's props (Button / DropdownMenu*); each row
 * points at the part and surfaces its curated default.
 */
const SPLIT_BUTTON_PROPS: PropEntry[] = [
  {
    name: 'SplitButtonAction',
    type: 'ComponentProps<typeof Button>',
    default: 'variant="outline"',
    description:
      'Primary action segment. Forwards Button props; the label or icon is its children.',
  },
  {
    name: 'SplitButtonTrigger',
    type: 'ComponentProps<typeof Button>',
    default: 'variant="outline", size="icon"',
    description:
      'Caret segment that opens the menu. Glyph defaults to a chevron; aria-label defaults to "More options".',
  },
  {
    name: 'SplitButtonContent',
    type: 'ComponentProps<typeof DropdownMenuContent>',
    default: 'align="end"',
    description:
      'Dropdown surface; sized to its content (w-auto) so item labels do not wrap.',
  },
  {
    name: 'SplitButtonItem',
    type: 'ComponentProps<typeof DropdownMenuItem>',
    default: '-',
    description: 'One related-variant item; supply its own onClick handler.',
  },
  {
    name: 'SplitButtonMenu',
    type: 'ComponentProps<typeof DropdownMenu>',
    default: '-',
    description:
      'Menu wrapper - owns the caret open state via the Base UI DropdownMenu.',
  },
  {
    name: '...props (Root)',
    type: 'ComponentProps<typeof ButtonGroup>',
    default: '-',
    description:
      'Spread onto the underlying ButtonGroup; a matched variant/size is set per segment.',
  },
];

/** April-2026 shadcn shape: Root -> Action + Menu -> Trigger + Content -> Item. */
const SPLIT_BUTTON_COMPOSITION: CompositionNode = {
  name: 'SplitButton',
  slot: 'Root',
  children: [
    { name: 'SplitButtonAction', slot: 'Action' },
    {
      name: 'SplitButtonMenu',
      slot: 'Menu',
      children: [
        { name: 'SplitButtonTrigger', slot: 'Trigger' },
        {
          name: 'SplitButtonContent',
          slot: 'Content',
          children: [{ name: 'SplitButtonItem', slot: 'Item' }],
        },
      ],
    },
  ],
};

/**
 * Doc page for `SplitButton`. The Preview keeps the live render that
 * `radius-seam.spec.ts` measures (the ButtonGroup seam), so this retrofit adds
 * the Code/Props/Composition tabs around it without touching the component.
 */
export default function SplitButtonPreviewPage() {
  return (
    <DocPage
      title="SplitButton"
      description="A single divided control - a primary action segment plus a caret that opens a menu of related variants. Composes ButtonGroup for the seamed outline."
      preview={
        <ComponentPreview>
          <div className="flex flex-col items-start gap-6">
            <SplitButton aria-label="Allow">
              <SplitButtonAction>Action</SplitButtonAction>
              <SplitButtonMenu>
                <SplitButtonTrigger aria-label="More action options" />
                <SplitButtonContent>
                  <SplitButtonItem onClick={() => {}}>Second</SplitButtonItem>
                  <SplitButtonItem onClick={() => {}}>Third</SplitButtonItem>
                </SplitButtonContent>
              </SplitButtonMenu>
            </SplitButton>
          </div>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="split-button"
          importPath="components/split-button"
          exportedAs="SplitButton"
        />
      }
      propsTable={<PropsTable rows={SPLIT_BUTTON_PROPS} />}
      composition={<CompositionTree tree={SPLIT_BUTTON_COMPOSITION} />}
    />
  );
}
