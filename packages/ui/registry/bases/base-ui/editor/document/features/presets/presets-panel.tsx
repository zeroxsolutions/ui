'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { SearchIcon } from '@/registry/bases/base-ui/icons/lucide/search-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import { Empty, EmptyDescription } from '@/registry/bases/base-ui/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import type { BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { ChromeIcon, useChromeActive } from '../../ui/chrome-icon';
import { startPresetDrag } from './presets-feature';

/** Every string the presets panel draws. */
export interface PresetsMessages {
  /** The panel's heading, which names its region and its list. */
  title: string;
  /** The search field's label and placeholder. */
  search: string;
  /** What the panel says when the editor can hold none of the presets now, or none matches the search. */
  empty: string;
  /** Why a listed preset's click inserts nothing: it does not fit where a click puts it, though a drop elsewhere does. */
  notAtCaret: string;
}

const DEFAULT_PRESETS_MESSAGES: PresetsMessages = {
  title: 'Presets',
  search: 'Search presets',
  empty: 'No presets fit here',
  notAtCaret: 'Does not fit where a click puts it; drag it to a spot that takes it',
};

/** More presets than this, and the panel offers a search over them. */
const SEARCH_AFTER = 6;

export interface EditorPresetsPanelProps {
  editor: IEditor;
  /**
   * The presets the editor was built with; the panel lists those `insertPreset` can insert somewhere, and a click
   * inserts one at the top level only.
   */
  presets: readonly BlockPreset[];
  /** The host's words for any string the panel draws; the rest stay English. */
  messages?: Partial<PresetsMessages>;
  className?: string;
}

/** A preset the editor can hold somewhere, and whether it can go where a click puts it. */
interface PresetRow {
  preset: BlockPreset;
  clickable: boolean;
}

/** Where a click puts a preset: the top level, so a lane the caret was left in by the last insert takes nothing. */
const CLICKED = { level: 'top' } as const;

/**
 * The presets the editor can hold somewhere, read as those it can insert at the start of the document: a lane
 * takes fewer presets than the document does, never more.
 */
function rowsOf(editor: IEditor, presets: readonly BlockPreset[]): readonly PresetRow[] {
  return presets
    .filter(({ id }) => editor.can('insertPreset', { id, at: 0 }))
    .map((preset) => ({ preset, clickable: editor.can('insertPreset', { id: preset.id, ...CLICKED }) }));
}

const sameRows = (a: readonly PresetRow[], b: readonly PresetRow[]): boolean =>
  a.length === b.length &&
  a.every((row, index) => row.preset === b[index].preset && row.clickable === b[index].clickable);

/**
 * The rows of `presets`, read again as the selection or the document changes, after each render, and when
 * `refresh` is called. The editor reports no change of its editability, and an email editor none of its locked
 * structure, so a host that changes either without drawing the panel again leaves it to `refresh`.
 */
function usePresetRows(
  editor: IEditor,
  presets: readonly BlockPreset[],
): { rows: readonly PresetRow[]; refresh(): void } {
  const [rows, setRows] = useState(() => rowsOf(editor, presets));
  const refresh = useCallback(() => {
    const next = rowsOf(editor, presets);
    setRows((previous) => (sameRows(previous, next) ? previous : next));
  }, [editor, presets]);
  useEffect(() => {
    const offSelection = editor.onSelectionUpdate(refresh);
    const offChange = editor.onChange(refresh);
    return () => {
      offSelection();
      offChange();
    };
  }, [editor, refresh]);
  useEffect(() => {
    // After the rest of this render's effects, one of which may be the editor's own taking a new editability.
    queueMicrotask(refresh);
  });
  return { rows, refresh };
}

/** Whether `preset`'s label or one of its keywords holds `query`, in any case. */
function matches(preset: BlockPreset, query: string): boolean {
  const wanted = query.trim().toLocaleLowerCase();
  return [preset.label, ...preset.keywords].some((word) => word.toLocaleLowerCase().includes(wanted));
}

interface EditorPresetsPanelItemProps {
  row: PresetRow;
  /** The id of the line saying why a row that does not fit where a click puts it inserts nothing on a click. */
  notAtCaretId: string;
  onInsert(id: string): void;
}

/**
 * One preset: a click, Enter or Space inserts it after the top-level block holding the caret, and a drag carries
 * it to the spot it drops on. A preset that does not fit there is still dragged, and its click is refused.
 */
function EditorPresetsPanelItem({ row, notAtCaretId, onInsert }: EditorPresetsPanelItemProps): ReactNode {
  const { preset, clickable } = row;
  const { active, handlers } = useChromeActive();
  return (
    <div role="listitem" data-slot="editor-presets-panel-item">
      <Item
        size="sm"
        render={<button type="button" />}
        draggable
        aria-disabled={clickable ? undefined : true}
        aria-describedby={clickable ? undefined : notAtCaretId}
        onDragStart={(event) => startPresetDrag(event.dataTransfer, preset.id)}
        onClick={() => {
          if (clickable) onInsert(preset.id);
        }}
        {...handlers}
        className="cn-editor-menu-item hover:bg-accent hover:text-accent-foreground cursor-grab text-start active:cursor-grabbing aria-disabled:opacity-60"
      >
        <ItemMedia variant="icon" className="cn-editor-menu-media bg-secondary size-8 border text-base">
          <ChromeIcon icon={preset.icon ?? LayoutPanelTopIcon} sized active={active} />
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
 * The presets an editor can hold, for a host to place beside it: a click inserts one at the top level, after the
 * top-level block holding the caret or at the end of a document the editor never had the focus in, and a drag
 * drops one where the pointer lets go, a lane included. A preset the editor refuses where a click puts it is
 * listed with its click refused and the reason read to assistive tech. Drawn in the Document Editor's menu rows,
 * with a search over more than six presets.
 */
function EditorPresetsPanel({ editor, presets, messages, className }: EditorPresetsPanelProps): ReactNode {
  const text = { ...DEFAULT_PRESETS_MESSAGES, ...messages };
  const titleId = useId();
  const searchId = useId();
  const notAtCaretId = useId();
  const [query, setQuery] = useState('');
  const { rows, refresh } = usePresetRows(editor, presets);
  const searchable = presets.length > SEARCH_AFTER;
  const shown = useMemo(
    () => rows.filter(({ preset }) => !searchable || matches(preset, query)),
    [rows, searchable, query],
  );
  const insert = (id: string) => {
    if (editor.run('insertPreset', { id, ...CLICKED })) editor.focus();
  };

  return (
    <Card
      size="sm"
      role="region"
      aria-labelledby={titleId}
      data-slot="editor-presets-panel"
      className={cn('min-h-0', className)}
      onPointerEnter={refresh}
      onFocus={refresh}
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
            {shown.map((row) => (
              <EditorPresetsPanelItem key={row.preset.id} row={row} notAtCaretId={notAtCaretId} onInsert={insert} />
            ))}
          </div>
        )}
        <span id={notAtCaretId} hidden>
          {text.notAtCaret}
        </span>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_PRESETS_MESSAGES, EditorPresetsPanel };
