'use client';

import { useReducer, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { PaletteIcon } from '@/registry/bases/base-ui/icons/lucide/palette-icon';
import { FieldGroup, FieldLegend, FieldSet } from '@/registry/bases/base-ui/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { COLOR_TOKENS, type ColorToken } from '@zeroxsolutions/editor-core/template/layout/index';
import type { LayoutWords } from '../layout/layout-words';
import { ChromeControl } from './chrome-icon';
import { useEditorChanges } from './use-editor-changes';

type Paint = 'text' | 'background';

const PAINT_MARKS = { text: 'textColor', background: 'textBackground' } as const;
const PAINT_COMMANDS = { text: 'setTextColor', background: 'setTextBackground' } as const;

/**
 * The theme variable each token draws with, as the editor's sheet draws a coloured run: a colour to read on the
 * page for the text, a surface to set text on for the background. `default` is the text's own colour.
 */
function paintOf(token: ColorToken, paint: Paint): string | undefined {
  if (token === 'default') return undefined;
  if (paint === 'text') {
    if (token === 'muted') return 'var(--muted-foreground)';
    if (token === 'primary') return 'var(--primary)';
    if (token === 'accent') return 'var(--accent-foreground)';
    return `var(--hue-${token})`;
  }
  if (token === 'muted') return 'var(--muted)';
  if (token === 'primary') return 'color-mix(in oklab, var(--primary) 15%, transparent)';
  if (token === 'accent') return 'var(--accent)';
  return `var(--hue-${token}-surface)`;
}

/** The token of `paint` the selection carries, `default` where it carries none. */
function paintIn(editor: IEditor, paint: Paint): ColorToken {
  return COLOR_TOKENS.find((token) => editor.isActive(PAINT_MARKS[paint], { token })) ?? 'default';
}

interface ColorMenuSwatchesProps {
  editor: IEditor;
  paint: Paint;
  words: LayoutWords;
  /** Draws the menu again at once, after a swatch has coloured the selection. */
  onPicked(): void;
}

/** One palette, the text's or the background's: a toggle per token, each showing the letter it would draw. */
function ColorMenuSwatches({ editor, paint, words, onPicked }: ColorMenuSwatchesProps): ReactNode {
  const current = paintIn(editor, paint);
  return (
    <FieldSet>
      <FieldLegend variant="label">{paint === 'text' ? words.textColor : words.textBackground}</FieldLegend>
      <ToggleGroup
        size="sm"
        spacing={1}
        className="grid grid-cols-6"
        value={[current]}
        onValueChange={(values) => {
          const [picked] = values as ColorToken[];
          // Pressing the token already picked keeps it, as a radio does.
          if (picked !== undefined && editor.run(PAINT_COMMANDS[paint], { token: picked })) onPicked();
        }}
      >
        {COLOR_TOKENS.map((token) => (
          <ToggleGroupItem key={token} value={token} aria-label={words.colors[token]}>
            <span
              aria-hidden
              data-slot="color-menu-swatch"
              data-paint={paint}
              style={
                { [paint === 'text' ? '--swatch-text' : '--swatch-surface']: paintOf(token, paint) } as CSSProperties
              }
            >
              A
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FieldSet>
  );
}

export interface ColorMenuProps {
  editor: IEditor;
  words: LayoutWords;
  /** Called as the menu opens and closes, so the bar it sits in stays while the focus is in the menu. */
  onOpenChange?(open: boolean): void;
}

/**
 * The selection's text and background colour from the theme's tokens: a toggle that opens a popover of two
 * palettes, each swatch named from `words`. Picking a swatch colours the selection and leaves the menu open, so
 * both can be set; closing it gives the focus back to the editor, the selection as it was. Drawn inside a
 * `TooltipProvider`, as the bubble draws its controls.
 */
function ColorMenu({ editor, words, onOpenChange }: ColorMenuProps): ReactNode {
  const [open, setOpen] = useState(false);
  // The pressed swatches follow each colour picked, which no prop of this menu carries. Those changes are drawn a
  // frame later, so a pick draws the menu at once, in the same frame as the coloured text, not with Default pressed.
  useEditorChanges(editor);
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  const picked = () => flushSync(redraw);
  const painted = paintIn(editor, 'text') !== 'default' || paintIn(editor, 'background') !== 'default';
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
        if (!next) editor.focus();
      }}
    >
      <ChromeControl
        icon={PaletteIcon}
        iconSized
        render={(control) => (
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Toggle
                      size="sm"
                      pressed={painted}
                      aria-label={words.textColor}
                      // Keep the editor's focus, and its selection, until the menu takes it.
                      onMouseDown={(event) => event.preventDefault()}
                      {...control}
                    />
                  }
                />
              }
            />
            <TooltipContent>{words.textColor}</TooltipContent>
          </Tooltip>
        )}
      />
      <PopoverContent aria-label={words.textColor} side="bottom" align="start">
        <FieldGroup>
          <ColorMenuSwatches editor={editor} paint="text" words={words} onPicked={picked} />
          <ColorMenuSwatches editor={editor} paint="background" words={words} onPicked={picked} />
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}

export { ColorMenu };
