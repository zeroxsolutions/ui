'use client';

import type { ReactElement } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/registry/bases/base-ui/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { SYMBOL_GROUPS } from '@zeroxsolutions/editor-core/math/core/symbols';
import { MATH_TEMPLATES } from '@zeroxsolutions/editor-core/math/core/templates';

/**
 * `<MathPalette>` - the symbol/template inserter. It composes the shipped
 * `Command` inside a `Popover` (search `CommandInput`, a `CommandGroup` per
 * category, a `CommandItem` per entry) - two shipped components composed the same
 * way `Combobox` itself is built, not hand-rolled markup. It is deliberately NOT a
 * `Combobox`: a palette inserts many entries in succession, so it stays open
 * across inserts (selecting an item never closes the popover). A structural
 * template carries a `caretOffset` so the host can land the caret in the first
 * hole. The trigger is supplied by the caller (a toolbar `Button`, or an
 * `InputGroupButton` in an inline addon) via the Base UI `render` prop; a
 * non-native-button trigger passes `nativeButton={false}`.
 */
export interface MathPaletteProps {
  /** Insert a snippet at the caret; `caretOffset` lands the caret inside a hole. */
  onInsert: (snippet: string, caretOffset?: number) => void;
  /** The popover trigger element, forwarded to Base UI `PopoverTrigger`'s `render`. */
  trigger: ReactElement;
  /** Set `false` when the trigger is not a native `<button>` (e.g. an addon control). */
  nativeButton?: boolean;
  className?: string;
}

export function MathPalette({
  onInsert,
  trigger,
  nativeButton = true,
  className,
}: MathPaletteProps) {
  return (
    <Popover>
      <PopoverTrigger render={trigger} nativeButton={nativeButton} />
      <PopoverContent align="start" className={cn('w-72 p-0', className)}>
        <Command>
          <CommandInput placeholder="Search symbols..." />
          <CommandList>
            <CommandEmpty>No symbols found.</CommandEmpty>
            {SYMBOL_GROUPS.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.symbols.map((symbol) => (
                  <CommandItem
                    key={symbol.latex}
                    // Search matches the name, the command, and the glyph.
                    value={`${symbol.label} ${symbol.latex} ${symbol.preview}`}
                    onSelect={() => onInsert(symbol.latex)}
                  >
                    <span aria-hidden className="w-5 text-center text-base">
                      {symbol.preview}
                    </span>
                    <span>{symbol.label}</span>
                    <CommandShortcut>{symbol.latex}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandGroup heading="Templates">
              {MATH_TEMPLATES.map((template) => (
                <CommandItem
                  key={template.label}
                  value={`${template.label} ${template.latex}`}
                  onSelect={() => onInsert(template.latex, template.caretOffset)}
                >
                  <span>{template.label}</span>
                  <CommandShortcut>{template.latex}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
