'use client';

import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { SearchIcon } from '@/registry/bases/base-ui/icons/lucide/search-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import { Empty, EmptyDescription } from '@/registry/bases/base-ui/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import type { BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { CHROME_ICON_CLASS, ChromeIcon, useChromeActive } from '../../ui/chrome-icon';
import { startPresetDrag } from './presets-feature';

/** Every string the presets panel draws. */
export interface PresetsMessages {
  /** The panel's heading, which names its region and its list. */
  title: string;
  /** The search field's label and placeholder. */
  search: string;
  /** What the panel says when no preset fits where the caret is, or none matches the search. */
  empty: string;
}

const DEFAULT_PRESETS_MESSAGES: PresetsMessages = {
  title: 'Presets',
  search: 'Search presets',
  empty: 'No presets fit here',
};

/** More presets than this, and the panel offers a search over them. */
const SEARCH_AFTER = 6;

export interface EditorPresetsPanelProps {
  editor: IEditor;
  /** The presets the editor was built with; the panel lists those `insertPreset` can insert where the caret is. */
  presets: readonly BlockPreset[];
  /** The host's words for any string the panel draws; the rest stay English. */
  messages?: Partial<PresetsMessages>;
  className?: string;
}

function offeredBy(editor: IEditor, presets: readonly BlockPreset[]): ReadonlySet<string> {
  return new Set(presets.filter(({ id }) => editor.can('insertPreset', { id })).map(({ id }) => id));
}

/** The ids of `presets` the editor can insert now, read again as the selection or the document changes. */
function useOfferedPresets(editor: IEditor, presets: readonly BlockPreset[]): ReadonlySet<string> {
  const [offered, setOffered] = useState(() => offeredBy(editor, presets));
  useEffect(() => {
    const update = () => {
      const next = offeredBy(editor, presets);
      setOffered((previous) =>
        previous.size === next.size && [...next].every((id) => previous.has(id)) ? previous : next,
      );
    };
    update();
    const offSelection = editor.onSelectionUpdate(update);
    const offChange = editor.onChange(update);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor, presets]);
  return offered;
}

/** Whether `preset`'s label or one of its keywords holds `query`, in any case. */
function matches(preset: BlockPreset, query: string): boolean {
  const wanted = query.trim().toLocaleLowerCase();
  return [preset.label, ...preset.keywords].some((word) => word.toLocaleLowerCase().includes(wanted));
}

interface EditorPresetsPanelItemProps {
  preset: BlockPreset;
  onInsert(id: string): void;
}

/** One preset: a click inserts it after the caret's block, a drag carries it to the spot it drops on. */
function EditorPresetsPanelItem({ preset, onInsert }: EditorPresetsPanelItemProps): ReactNode {
  const { active, handlers } = useChromeActive();
  return (
    <div role="listitem" data-slot="editor-presets-panel-item">
      <Item
        size="sm"
        render={<button type="button" />}
        draggable
        onDragStart={(event) => startPresetDrag(event.dataTransfer, preset.id)}
        onClick={() => onInsert(preset.id)}
        {...handlers}
        className="cn-editor-menu-item hover:bg-accent hover:text-accent-foreground cursor-grab text-start active:cursor-grabbing"
      >
        <ItemMedia variant="icon" className="cn-editor-menu-media bg-secondary size-8 border text-base">
          <ChromeIcon icon={preset.icon ?? LayoutPanelTopIcon} className={CHROME_ICON_CLASS} active={active} />
        </ItemMedia>
        <ItemContent className="gap-0.5">
          <ItemTitle>{preset.label}</ItemTitle>
          {preset.description !== null && (
            <ItemDescription className="line-clamp-2">{preset.description}</ItemDescription>
          )}
        </ItemContent>
      </Item>
    </div>
  );
}

/**
 * The presets an editor offers where its caret is, for a host to place beside it: a click inserts one after
 * the block holding the caret, and a drag drops one where the pointer lets go. Drawn in the Document Editor's
 * menu rows, with a search over more than six presets.
 */
function EditorPresetsPanel({ editor, presets, messages, className }: EditorPresetsPanelProps): ReactNode {
  const text = { ...DEFAULT_PRESETS_MESSAGES, ...messages };
  const titleId = useId();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const offered = useOfferedPresets(editor, presets);
  const searchable = presets.length > SEARCH_AFTER;
  const shown = useMemo(
    () => presets.filter((preset) => offered.has(preset.id) && (!searchable || matches(preset, query))),
    [presets, offered, searchable, query],
  );
  const insert = (id: string) => {
    if (editor.run('insertPreset', { id })) editor.focus();
  };

  return (
    <Card
      size="sm"
      role="region"
      aria-labelledby={titleId}
      data-slot="editor-presets-panel"
      className={cn('min-h-0', className)}
    >
      <CardHeader>
        <CardTitle id={titleId}>{text.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-2">
        {searchable && (
          <InputGroup>
            <label htmlFor={searchId} className="sr-only">
              {text.search}
            </label>
            <InputGroupInput
              id={searchId}
              type="search"
              placeholder={text.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden size={16} />
            </InputGroupAddon>
          </InputGroup>
        )}
        {shown.length === 0 ? (
          <Empty className="min-h-0 gap-1 border-0 p-6">
            <EmptyDescription>{text.empty}</EmptyDescription>
          </Empty>
        ) : (
          <div role="list" aria-labelledby={titleId} data-slot="editor-presets-panel-list" className="flex flex-col">
            {shown.map((preset) => (
              <EditorPresetsPanelItem key={preset.id} preset={preset} onInsert={insert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { DEFAULT_PRESETS_MESSAGES, EditorPresetsPanel };
