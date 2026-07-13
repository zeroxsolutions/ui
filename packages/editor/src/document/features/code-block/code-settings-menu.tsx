'use client';

import { Settings2 } from 'lucide-react';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/dropdown-menu';

/**
 * The live-view settings for a code-block's editable CodeMirror surface. Local
 * view-state only — never persisted to the document (which holds just `code` and
 * `language`); each field maps to a CodeMirror `Compartment` on `CodeMirrorPane`.
 */
export interface CodeMirrorSettings {
  /** Columns a tab occupies and the width of one indent step. */
  tabSize: number;
  /** Indent with a real tab character instead of spaces. */
  useTabs: boolean;
  /** Show the line-number gutter. */
  showLineNumbers: boolean;
  /** Soft-wrap long lines instead of scrolling horizontally. */
  softWrap: boolean;
}

const TAB_SIZES = [2, 4, 8] as const;

export interface CodeSettingsMenuProps {
  /** The current pane settings, reflected as the menu's checked/selected state. */
  settings: CodeMirrorSettings;
  /** Fired with the changed field(s) whenever an option is toggled or picked. */
  onSettingsChange: (patch: Partial<CodeMirrorSettings>) => void;
}

/**
 * A ghost-icon dropdown that toggles a code-block's editing preferences — tab
 * size, tabs-vs-spaces, the line-number gutter, and soft wrap — composed from the
 * design-system `DropdownMenu`. Selections are reported through `onSettingsChange`
 * and drive `CodeMirrorPane`'s compartments live (no remount).
 */
export function CodeSettingsMenu({
  settings,
  onSettingsChange,
}: CodeSettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Code settings" />
        }
      >
        <Settings2 />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={String(settings.tabSize)}
          onValueChange={(value) =>
            onSettingsChange({ tabSize: Number(value) })
          }
        >
          {/* The label lives inside the RadioGroup: Base UI's `MenuGroupLabel`
              needs a `Menu.Group`/`Menu.RadioGroup` context, so a bare label
              directly under the content throws on open. */}
          <DropdownMenuLabel>Tab size</DropdownMenuLabel>
          {TAB_SIZES.map((size) => (
            <DropdownMenuRadioItem key={size} value={String(size)}>
              {size}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={settings.useTabs}
          onCheckedChange={(checked) => onSettingsChange({ useTabs: checked })}
        >
          Use tabs
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.showLineNumbers}
          onCheckedChange={(checked) =>
            onSettingsChange({ showLineNumbers: checked })
          }
        >
          Show line numbers
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.softWrap}
          onCheckedChange={(checked) => onSettingsChange({ softWrap: checked })}
        >
          Soft wrap
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
