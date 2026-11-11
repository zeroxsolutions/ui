import type { EmojiDatum } from '@zeroxsolutions/fluent-emoji/catalog';

/** Emoji per row of the picker's grid. */
const EMOJI_PICKER_COLUMNS = 8;

/** A group of emoji under one heading: a catalog category, or the consumer's frequent row. */
interface EmojiPickerSection {
  id: string;
  name: string;
  emojis: EmojiDatum[];
}

/** One row of the picker's list: a section heading or a row of up to `EMOJI_PICKER_COLUMNS` emoji. */
type EmojiPickerRow =
  | { type: 'header'; key: string; id: string; name: string }
  | { type: 'cells'; key: string; emojis: EmojiDatum[] };

/**
 * The picker's list rows: each section's heading followed by its emoji eight to a row, or, given search
 * `results`, those alone eight to a row with no heading. `headerIndices` are the rows that are headings, in
 * order. Each row's `key` is unique within one call.
 */
function emojiPickerRows(
  sections: EmojiPickerSection[],
  results: EmojiDatum[] | null,
): { rows: EmojiPickerRow[]; headerIndices: number[] } {
  const rows: EmojiPickerRow[] = [];
  const headerIndices: number[] = [];
  const pushCells = (emojis: EmojiDatum[], keyBase: string): void => {
    for (let i = 0; i < emojis.length; i += EMOJI_PICKER_COLUMNS) {
      rows.push({
        type: 'cells',
        key: `${keyBase}-${i}`,
        emojis: emojis.slice(i, i + EMOJI_PICKER_COLUMNS),
      });
    }
  };
  if (results) {
    pushCells(results, 'search');
    return { rows, headerIndices };
  }
  for (const sec of sections) {
    headerIndices.push(rows.length);
    rows.push({
      type: 'header',
      key: `h-${sec.id}`,
      id: sec.id,
      name: sec.name,
    });
    pushCells(sec.emojis, sec.id);
  }
  return { rows, headerIndices };
}

export { EMOJI_PICKER_COLUMNS, emojiPickerRows };
export type { EmojiPickerRow, EmojiPickerSection };
