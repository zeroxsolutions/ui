'use client';

import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { CheckIcon } from '@/registry/bases/base-ui/icons/lucide/check-icon';
import { ChevronDownIcon } from '@/registry/bases/base-ui/icons/lucide/chevron-down-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { FieldLegend, FieldSet } from '@/registry/bases/base-ui/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  SECTION_BACKGROUNDS,
  SPACES,
  type LayoutSpace,
  type SectionBackground,
  type SectionLayout,
  type SectionWidth,
} from '@zeroxsolutions/editor-core/template/layout/index';
import { BlockToolbar, useBlockToolbarHold } from '../../layout/block-toolbar';
import type { LayoutWords } from '../../layout/layout-words';
import { ChromeControl } from '../../ui/chrome-icon';

/** What a section draws as while it sets no value: no background, a medium padding, the content's width. */
const SECTION_DEFAULTS = {
  background: 'none',
  padding: 'medium',
  width: 'content',
} as const satisfies Required<SectionLayout>;

/**
 * A menu of the toolbar, open or closed, which the toolbar holds drawn while it is open. As it closes, the focus goes
 * back to its trigger after a key closed it, so the toolbar's keys go on, and back to the text after a pointer did,
 * so the undo key reaches the editor.
 */
function useSectionToolbarMenu(editor: IEditor) {
  const [open, setOpen] = useState(false);
  const byKey = useRef(false);
  const hold = useBlockToolbarHold();
  const change = (next: boolean, key: boolean) => {
    byKey.current = key;
    setOpen(next);
    hold(next ? () => change(false, true) : null);
  };
  return {
    /** Closes the menu after a pick, by a key when `key` is true. */
    close: (key: boolean) => change(false, key),
    root: {
      open,
      onOpenChange: (next: boolean, details: { event: Event }) => change(next, details.event instanceof KeyboardEvent),
    },
    finalFocus: (closeType: string) => {
      if (closeType === 'keyboard' || byKey.current) return true;
      editor.focus();
      return false;
    },
  };
}

/** A dot of a section's background, ringed so a pale one shows; `none` is struck through, `picked` checked. */
function SectionToolbarSwatch({ background, picked = false }: { background: SectionBackground; picked?: boolean }) {
  return (
    <span aria-hidden data-slot="section-swatch" data-background={background} className="cn-editor-swatch">
      {picked && <CheckIcon className="cn-editor-icon" />}
    </span>
  );
}

/** A trigger of the toolbar: what it holds, its name from words or a swatch, and a chevron, as a menu's trigger shows. */
function SectionToolbarTrigger({ children, ...props }: ComponentProps<typeof Button>) {
  return (
    <ChromeControl
      icon={ChevronDownIcon}
      iconSized
      render={({ children: chevron, ...control }) => (
        <Button variant="ghost" size="sm" {...control} {...props}>
          {children}
          {chevron}
        </Button>
      )}
    />
  );
}

/**
 * The background's control: the current swatch, opening a popover of swatches under the name from words, each swatch
 * named from words, the current one pressed and checked.
 */
function SectionToolbarBackground({
  editor,
  value,
  words,
  onChange,
}: {
  editor: IEditor;
  value: SectionBackground;
  words: LayoutWords;
  onChange(background: SectionBackground): void;
}) {
  const menu = useSectionToolbarMenu(editor);
  const swatches = useRef<HTMLDivElement>(null);
  const nameOf = (token: SectionBackground) => (token === 'none' ? words.noBackground : words.colors[token]);
  return (
    <Popover {...menu.root}>
      {/* The swatch alone, named in its tooltip, so the toolbar fits a phone's content column. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <SectionToolbarTrigger aria-label={words.sectionBackground}>
                  <SectionToolbarSwatch background={value} />
                </SectionToolbarTrigger>
              }
            />
          }
        />
        <TooltipContent>{words.sectionBackground}</TooltipContent>
      </Tooltip>
      <PopoverContent
        aria-label={words.sectionBackground}
        side="bottom"
        align="start"
        // The current swatch, so the arrow keys start from it.
        initialFocus={() => swatches.current?.querySelector<HTMLElement>('[aria-pressed=true]') ?? true}
        finalFocus={menu.finalFocus}
      >
        <FieldSet>
          <FieldLegend variant="label">{words.sectionBackground}</FieldLegend>
          <ToggleGroup
            ref={swatches}
            size="sm"
            spacing={1}
            className="grid grid-cols-6"
            value={[value]}
            onValueChange={(values, { event }) => {
              const [picked] = values as SectionBackground[];
              // Pressing the swatch already picked keeps it, as a radio does.
              if (picked === undefined) return;
              onChange(picked);
              // Enter or Space makes a click with no click count.
              menu.close(!(event instanceof MouseEvent) || event.detail === 0);
            }}
          >
            {SECTION_BACKGROUNDS.map((token) => (
              <ToggleGroupItem key={token} value={token} aria-label={nameOf(token)}>
                <SectionToolbarSwatch background={token} picked={token === value} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      </PopoverContent>
    </Popover>
  );
}

/** A control picking one of `values` from a menu, its name and each value's from words, the current one checked. */
function SectionToolbarMenu<T extends string>({
  editor,
  label,
  values,
  value,
  nameOf,
  onChange,
}: {
  editor: IEditor;
  label: string;
  values: readonly T[];
  value: T;
  nameOf(value: T): string;
  onChange(value: T): void;
}) {
  const menu = useSectionToolbarMenu(editor);
  return (
    <DropdownMenu {...menu.root}>
      <DropdownMenuTrigger render={<SectionToolbarTrigger>{label}</SectionToolbarTrigger>} />
      <DropdownMenuContent
        aria-label={label}
        // Under the toolbar, which sits at the section's end.
        align="end"
        className="min-w-32"
        finalFocus={menu.finalFocus}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={(picked: T) => onChange(picked)}>
          {/* Inside the group: Base UI's group label throws without a group around it. */}
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {values.map((option) => (
            <DropdownMenuRadioItem key={option} value={option} closeOnClick>
              {nameOf(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface SectionToolbarProps {
  editor: IEditor;
  /** Where the section starts, as its view's `getPos()` reads it. */
  pos: number | undefined;
  /** The section's element, which the toolbar sits above. */
  anchor: HTMLElement | null;
  /** The section's tokens, each one of its set or unset; an unset one reads as its default. */
  layout: SectionLayout;
  /** The widths offered, in order; one or none draws no width control. */
  widths: readonly SectionWidth[];
  words: LayoutWords;
}

/**
 * A section's floating toolbar: three controls, its background, its padding and its width, each opening a menu named
 * from words. Picking a default stores no value; each pick is one undo step, through `setSectionLayout`.
 */
function SectionToolbar({ editor, pos, anchor, layout, widths, words }: SectionToolbarProps): ReactNode {
  const set = (change: Partial<Record<keyof SectionLayout, string | null>>) =>
    editor.run('setSectionLayout', { pos, layout: change });
  const stored = <T extends string>(value: T, fallback: T) => (value === fallback ? null : value);
  return (
    <BlockToolbar editor={editor} pos={pos} anchor={anchor} label={words.toolbar}>
      <SectionToolbarBackground
        editor={editor}
        value={layout.background ?? SECTION_DEFAULTS.background}
        words={words}
        onChange={(background) => set({ background: stored(background, SECTION_DEFAULTS.background) })}
      />
      <SectionToolbarMenu<LayoutSpace>
        editor={editor}
        label={words.sectionPadding}
        values={SPACES}
        value={layout.padding ?? SECTION_DEFAULTS.padding}
        nameOf={(space) => words.spaces[space]}
        onChange={(padding) => set({ padding: stored(padding, SECTION_DEFAULTS.padding) })}
      />
      {widths.length > 1 && (
        <SectionToolbarMenu<SectionWidth>
          editor={editor}
          label={words.sectionWidth}
          values={widths}
          value={layout.width ?? SECTION_DEFAULTS.width}
          nameOf={(width) => words.sectionWidths[width]}
          onChange={(width) => set({ width: stored(width, SECTION_DEFAULTS.width) })}
        />
      )}
    </BlockToolbar>
  );
}

export { SectionToolbar };
