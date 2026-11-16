import {
  ArrowUp,
  Bold,
  Check,
  ChevronRight,
  Circle,
  CircleX,
  Download,
  Dumbbell,
  Eye,
  Flag,
  Hash,
  Lightbulb,
  Plane,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../test/nova-style.css';
import { ArrowUpIcon } from '@/registry/bases/base-ui/icons/arrow-up-icon';
import { BoldIcon } from '@/registry/bases/base-ui/icons/bold-icon';
import { CheckIcon } from '@/registry/bases/base-ui/icons/check-icon';
import { ChevronRightIcon } from '@/registry/bases/base-ui/icons/chevron-right-icon';
import { CircleIcon } from '@/registry/bases/base-ui/icons/circle-icon';
import { CircleXIcon } from '@/registry/bases/base-ui/icons/circle-x-icon';
import { DownloadIcon } from '@/registry/bases/base-ui/icons/download-icon';
import { DumbbellIcon } from '@/registry/bases/base-ui/icons/dumbbell-icon';
import { EyeIcon } from '@/registry/bases/base-ui/icons/eye-icon';
import { FlagIcon } from '@/registry/bases/base-ui/icons/flag-icon';
import { HashIcon } from '@/registry/bases/base-ui/icons/hash-icon';
import { LightbulbIcon } from '@/registry/bases/base-ui/icons/lightbulb-icon';
import { PlaneIcon } from '@/registry/bases/base-ui/icons/plane-icon';
import { PlusIcon } from '@/registry/bases/base-ui/icons/plus-icon';
import { Settings2Icon } from '@/registry/bases/base-ui/icons/settings-2-icon';
import { Trash2Icon } from '@/registry/bases/base-ui/icons/trash-2-icon';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { InputGroupButton } from '@/registry/bases/base-ui/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { BlockMenu } from './block-menu';
import { BubbleMenu } from './bubble-menu';
import { CHROME_ICON_CLASS, ChromeIcon } from './chrome-icon';
import { EditorToolbar } from './editor-toolbar';
import { SlashMenu } from './slash-menu';

/** The rendered widths of the svgs inside an element, in order. */
function svgWidths(root: ParentNode): number[] {
  return Array.from(root.querySelectorAll('svg')).map((svg) => svg.getBoundingClientRect().width);
}

/** The nova sheet draws the controls, as in an installing app. */
function Nova({ children }: { children: ReactNode }) {
  return <div className="style-nova">{children}</div>;
}

const editor = {
  status: 'ready',
  run: vi.fn(() => true),
  isActive: () => false,
  isEditable: () => true,
  isFocused: () => true,
  getSelection: () => ({ from: 1, to: 4, empty: false, isNode: false }),
  onChange: () => () => {},
  onSelectionUpdate: () => () => {},
  caretRect: () => ({ top: 10, bottom: 30, left: 20, right: 80 }),
  triggerQuery: () => ({ from: 1, to: 2, query: '' }),
  setSlashDecoration: () => {},
  focus: () => {},
} as unknown as IEditor;

/** Two items in one menu: what master drew (the lucide element carrying `size-4`), and the animated icon now. */
const items = [
  { id: 'was', title: 'Was', icon: <Bold className="size-4" />, command: 'x' },
  { id: 'now', title: 'Now', icon: BoldIcon, command: 'x' },
];

/** The two icons of a menu draw at the same size, and at 16px. */
function expectSameAsBefore([was, now]: number[]): void {
  expect(was).toBeGreaterThan(0);
  expect(now).toBeCloseTo(was, 0);
}

describe('the size of an icon the chrome draws', () => {
  it('keeps a toolbar icon at the size the lucide element had', async () => {
    const { container } = await render(
      <Nova>
        <EditorToolbar editor={editor} items={items} />
      </Nova>,
    );
    const widths = svgWidths(container);
    expect(widths).toEqual([16, 16]);
  });

  it('keeps a bubble icon at the size the lucide element had', async () => {
    const host = document.createElement('p');
    host.textContent = 'some selected text';
    document.body.append(host);
    const range = document.createRange();
    range.selectNodeContents(host);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    await render(
      <Nova>
        <BubbleMenu editor={editor} items={items} />
      </Nova>,
    );
    const bubble = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=bubble-menu]');
      if (!found) throw new Error('the bubble is not open');
      return found;
    });
    expectSameAsBefore(svgWidths(bubble));
  });

  it('keeps a slash row icon at the size the lucide element had', async () => {
    await render(
      <Nova>
        <SlashMenu editor={editor} items={items} />
      </Nova>,
    );
    const menu = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=slash-menu]');
      if (!found || svgWidths(found).length < 2) throw new Error('the menu is not open');
      return found;
    });
    expectSameAsBefore(svgWidths(menu));
  });

  it('keeps a block menu icon at the size the lucide element had', { timeout: 30_000 }, async () => {
    const container = document.createElement('div');
    // The handle sits 28px left of the block, so keep the block inside the viewport.
    container.style.marginLeft = '100px';
    container.innerHTML = '<div class="ProseMirror"><p>text</p></div>';
    document.body.append(container);
    await render(
      <Nova>
        <BlockMenu editor={editor} container={container} items={items} />
      </Nova>,
    );
    const block = container.querySelector('p')!.getBoundingClientRect();
    container.dispatchEvent(new MouseEvent('mousemove', { clientY: block.top + 1 }));
    const handle = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('[aria-label="Block actions"]');
      if (!found) throw new Error('no handle');
      return found;
    });
    await userEvent.click(handle);
    const menu = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=dropdown-menu-content]');
      if (!found || svgWidths(found).length < 2) throw new Error('the menu is not open');
      return found;
    });
    expectSameAsBefore(svgWidths(menu));
  });

  it('keeps the other controls at the size their lucide element had', async () => {
    // Each pair is the real slot twice: master's element, and the animated icon the feature now hands over.
    const pairs: Array<[ReactNode, ReactNode]> = [
      [
        <Tabs defaultValue="v">
          <TabsList>
            <TabsTrigger value="v">
              <Eye />
            </TabsTrigger>
          </TabsList>
        </Tabs>,
        <Tabs defaultValue="v">
          <TabsList>
            <TabsTrigger value="v">
              <ChromeIcon icon={EyeIcon} active={false} />
            </TabsTrigger>
          </TabsList>
        </Tabs>,
      ],
      [
        <Button variant="ghost" size="icon">
          <Settings2 />
        </Button>,
        <Button variant="ghost" size="icon">
          <ChromeIcon icon={Settings2Icon} active={false} />
        </Button>,
      ],
      [
        <InputGroupButton size="icon-xs">
          <Check />
        </InputGroupButton>,
        <InputGroupButton size="icon-xs">
          <ChromeIcon icon={CheckIcon} active={false} />
        </InputGroupButton>,
      ],
      [
        <Button variant="outline" size="sm">
          <Download />
          Export
        </Button>,
        <Button variant="outline" size="sm">
          <DownloadIcon aria-hidden />
          Export
        </Button>,
      ],
      [
        <Button variant="ghost" size="icon-sm">
          <Plus />
        </Button>,
        <Button variant="ghost" size="icon-sm">
          <PlusIcon aria-hidden />
        </Button>,
      ],
      [
        <InputGroupButton size="icon-sm">
          <ArrowUp />
        </InputGroupButton>,
        <InputGroupButton size="icon-sm">
          <ArrowUpIcon aria-hidden />
        </InputGroupButton>,
      ],
      // The toggle marker and the block handle's plus are bare elements no primitive sizes.
      [
        <span className="flex size-6 items-center justify-center">
          <ChevronRight className="size-4" />
        </span>,
        <span className="flex size-6 items-center justify-center">
          <ChromeIcon icon={ChevronRightIcon} className={CHROME_ICON_CLASS} active={false} />
        </span>,
      ],
      [
        <span className="flex size-6 items-center justify-center">
          <Plus size={16} />
        </span>,
        <span className="flex size-6 items-center justify-center">
          <PlusIcon size={16} aria-hidden />
        </span>,
      ],
    ];
    for (const [was, now] of pairs) {
      const a = await render(<Nova>{was}</Nova>);
      const b = await render(<Nova>{now}</Nova>);
      expect(svgWidths(b.container)).toEqual(svgWidths(a.container));
    }
  });

  it('keeps the components remaining controls at the size their lucide element had', async () => {
    const pairs: Array<[ReactNode, ReactNode]> = [
      [
        <Button variant="ghost" size="icon-sm">
          <Trash2 />
        </Button>,
        <Button variant="ghost" size="icon-sm">
          <Trash2Icon aria-hidden />
        </Button>,
      ],
      [
        <Button variant="outline" size="sm">
          <Settings2 />
        </Button>,
        <Button variant="outline" size="sm">
          <Settings2Icon aria-hidden />
        </Button>,
      ],
      // The swatch is a bare element no primitive sizes.
      [
        <span className="flex size-8 items-center justify-center">
          <Check aria-hidden className="size-4" />
        </span>,
        <span className="flex size-8 items-center justify-center">
          <CheckIcon aria-hidden size={16} />
        </span>,
      ],
      [
        <Badge variant="outline">
          <Circle data-icon="inline-start" aria-hidden />
          word
        </Badge>,
        <Badge variant="outline">
          <CircleIcon data-icon="inline-start" aria-hidden size={12} />
          word
        </Badge>,
      ],
      [
        <Badge variant="outline">
          <CircleX data-icon="inline-start" aria-hidden />
          word
        </Badge>,
        <Badge variant="outline">
          <CircleXIcon data-icon="inline-start" aria-hidden size={12} />
          word
        </Badge>,
      ],
      [
        <ToggleGroup>
          {[Plane, Dumbbell, Lightbulb, Hash, Flag].map((Icon, index) => (
            <ToggleGroupItem key={index} value={String(index)} aria-label={String(index)}>
              <Icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>,
        <ToggleGroup>
          {[PlaneIcon, DumbbellIcon, LightbulbIcon, HashIcon, FlagIcon].map((Icon, index) => (
            <ToggleGroupItem key={index} value={String(index)} aria-label={String(index)}>
              <Icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>,
      ],
    ];
    for (const [was, now] of pairs) {
      const a = await render(<Nova>{was}</Nova>);
      const b = await render(<Nova>{now}</Nova>);
      expect(svgWidths(b.container)).toEqual(svgWidths(a.container));
    }
  });
});
