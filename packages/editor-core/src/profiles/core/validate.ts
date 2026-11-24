import { hrefProblems, parseInlineMarkup, variableTokens, type VariableType } from '../../template/index.js';
import { leadingToken } from '../../template/markup/href.js';
import {
  defaultBlocks,
  LIBRARY_BLOCK_PAIRS,
  libraryBlocks,
  type DefaultBlockType,
  type LibraryBlockType,
} from '../../template/email/blocks/index.js';
import { IMAGE_TEXT_MAX_LENGTH } from '../../template/email/blocks/image.js';
import { TABLE_MAX_COLUMNS, TABLE_MAX_ROWS } from '../../template/email/blocks/table.js';
import { EMAIL_KINDS } from './profile.js';
import { measureSmsBody, strayBraceOffset } from './sms-text.js';
import type {
  BlockEditor,
  BlockEditorAttribute,
  BlockEditorField,
  BlockEditorItems,
} from '../../template/email/define-email-block.js';
import type { EditorEmailBlock, EditorProfile, ProfileProblem } from './types.js';

const RATIO_WEIGHT_MAX = 12;

interface Walk {
  readonly profile: EditorProfile;
  readonly problems: ProfileProblem[];
  readonly printed: Set<string>;
  count: number;
}

interface Field {
  readonly field?: string;
  readonly item?: number;
  readonly value: string;
  readonly max: number;
  readonly marked: boolean;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function declaredType(walk: Walk, name: string): VariableType | undefined {
  return walk.profile.variables.find((variable) => variable.name === name)?.type;
}

/** The problems one text field has: its size, its markup, and each token it spells. */
function checkField(walk: Walk, block: string, { field, item, value, max, marked }: Field): void {
  const where = { block, ...(field === undefined ? {} : { field }), ...(item === undefined ? {} : { item }) };
  if (value === '') walk.problems.push({ kind: 'text-empty', ...where });
  else if (value.length > max) walk.problems.push({ kind: 'text-too-long', ...where });

  if (marked) checkMarkup(walk, where, value);
  checkTokens(walk, where, value);
}

/** What the write check refuses in inline markup: markup that does not parse, and each link it would not open. */
function checkMarkup(walk: Walk, where: Pick<ProfileProblem, 'block' | 'field' | 'item'>, value: string): void {
  const parsed = parseInlineMarkup(value);
  if (!parsed.ok) {
    walk.problems.push({ kind: 'markup-malformed', ...where, offset: parsed.offset });
    return;
  }
  const flagged = new Set<string>();
  for (const run of parsed.runs) {
    if (run.kind !== 'link' || flagged.has(run.href) || !hrefFaulty(walk, run.href)) continue;
    flagged.add(run.href);
    const name = leadingToken(run.href);
    walk.problems.push({ kind: 'link-invalid', ...where, ...(name === undefined ? {} : { name }) });
  }
}

function checkTokens(walk: Walk, where: Pick<ProfileProblem, 'block' | 'field' | 'item'>, value: string): void {
  for (const name of new Set(variableTokens(value))) {
    walk.printed.add(name);
    if (declaredType(walk, name) === undefined) walk.problems.push({ kind: 'variable-undeclared', ...where, name });
  }
}

/** Whether `href` cannot be sent as written; an undeclared token is `checkTokens`' to report. */
function hrefFaulty(walk: Walk, href: string): boolean {
  return hrefProblems(href, (name) => declaredType(walk, name)).some((problem) => problem.kind === 'href-invalid');
}

function checkHref(walk: Walk, block: string, value: string): void {
  checkField(walk, block, { field: 'href', value, max: walk.profile.bounds.href, marked: false });
  if (value === '') return;
  if (hrefFaulty(walk, value)) {
    walk.problems.push({ kind: 'href-invalid', block, field: 'href' });
  }
}

/** An image's address: a web one, or a url variable; never a mail address, which `hrefFaulty` lets a link take. */
const MAIL = /^mailto:/i;

/** What the write check refuses in one plain, link or image field of a product block, or of one of its items. */
function checkOwnField(
  walk: Walk,
  field: BlockEditorField,
  stored: unknown,
  where: Pick<ProfileProblem, 'block' | 'field' | 'item'>,
): void {
  const value = text(stored);
  // Left out, a field reads as empty; a value that is not text cannot be read at all.
  if (stored !== undefined && typeof stored !== 'string') walk.problems.push({ kind: 'text-empty', ...where });
  else if (field.required && value.trim() === '') walk.problems.push({ kind: 'text-empty', ...where });
  if (value.length > field.max) walk.problems.push({ kind: 'text-too-long', ...where });
  if (field.kind === 'plainText' || value === '') return;
  const faulty =
    /[\r\n]/.test(value) || hrefFaulty(walk, value) || (field.kind === 'imageUrl' && MAIL.test(value.trim()));
  if (faulty) walk.problems.push({ kind: 'href-invalid', ...where });
}

/** An image the built-in image block loads: a literal `https:` address, or a url variable. */
const SECURE_IMAGE = /^https:\/\//i;

/** What the write check refuses in an image block: a missing or refused source, an empty alt, and each bound. */
function checkImage(walk: Walk, content: Record<string, unknown>, id: string): void {
  const fields: readonly BlockEditorField[] = [
    { name: 'src', kind: 'imageUrl', label: '', max: walk.profile.bounds.href, required: true },
    { name: 'alt', kind: 'plainText', label: '', max: IMAGE_TEXT_MAX_LENGTH, required: true },
    { name: 'caption', kind: 'plainText', label: '', max: IMAGE_TEXT_MAX_LENGTH, required: false },
    { name: 'href', kind: 'link', label: '', max: walk.profile.bounds.href, required: false },
  ];
  for (const field of fields) checkTokens(walk, { block: id, field: field.name }, text(content[field.name]));
  for (const field of fields) {
    const before = walk.problems.length;
    checkOwnField(walk, field, content[field.name], { block: id, field: field.name });
    const src = text(content.src).trim();
    // A plain page address loads over no secure connection, which the image block refuses on write.
    if (field.name === 'src' && walk.problems.length === before && src !== '' && leadingToken(src) === undefined) {
      if (!SECURE_IMAGE.test(src)) walk.problems.push({ kind: 'href-invalid', block: id, field: 'src' });
    }
  }
}

/**
 * What the write check refuses in a table block: rows that are not a list (`content-invalid`), none
 * (`text-empty`), more rows or columns than it holds (`table-too-large`), rows of two widths or a row that is not
 * a list of text (`content-invalid`, the row as `item`), and in each cell what a paragraph's text is refused for.
 */
function checkTable(walk: Walk, content: Record<string, unknown>, id: string): void {
  const where = { block: id, field: 'rows' };
  const rows: unknown = content.rows;
  if (!Array.isArray(rows)) {
    walk.problems.push({ kind: 'content-invalid', ...where });
    return;
  }
  if (rows.length === 0) walk.problems.push({ kind: 'text-empty', ...where });
  const lists = rows.filter((row): row is unknown[] => Array.isArray(row));
  if (rows.length > TABLE_MAX_ROWS || lists.some((row) => row.length > TABLE_MAX_COLUMNS)) {
    walk.problems.push({ kind: 'table-too-large', ...where });
  }
  if (lists.some((row) => row.length !== lists[0].length)) walk.problems.push({ kind: 'content-invalid', ...where });
  rows.forEach((row: unknown, item) => {
    if (!Array.isArray(row) || row.length === 0 || row.some((cell) => typeof cell !== 'string')) {
      walk.problems.push({ kind: 'content-invalid', ...where, item });
      return;
    }
    for (const cell of row as string[]) {
      if (cell === '') continue;
      if (cell.length > walk.profile.bounds.text) walk.problems.push({ kind: 'text-too-long', ...where, item });
      checkMarkup(walk, { ...where, item }, cell);
      checkTokens(walk, { ...where, item }, cell);
    }
  });
}

/**
 * What the write check refuses in an items field: a value that is not a list, or an entry that is not an object
 * of the item's fields (`content-invalid`), fewer items than `min` (`text-empty`) or more than `max`
 * (`list-too-long`), and each item's fields, under the item's index.
 */
function checkItems(walk: Walk, items: BlockEditorItems, stored: unknown, id: string): void {
  const where = { block: id, field: items.name };
  // Left out, an items field reads as none; null is a value, which the write check refuses.
  const entries: unknown = stored === undefined ? [] : stored;
  if (!Array.isArray(entries)) {
    walk.problems.push({ kind: 'content-invalid', ...where });
    return;
  }
  if (entries.length < items.min) walk.problems.push({ kind: 'text-empty', ...where });
  else if (entries.length > items.max) walk.problems.push({ kind: 'list-too-long', ...where });
  entries.forEach((entry: unknown, item) => {
    const known = isRecord(entry) && Object.keys(entry).every((key) => items.fields.some(({ name }) => name === key));
    if (!known) walk.problems.push({ kind: 'content-invalid', ...where, item });
    if (!isRecord(entry)) return;
    for (const field of items.fields) checkOwnField(walk, field, entry[field.name], { ...where, item });
  });
}

/**
 * What the renderer's write check refuses in a product block's fields, in the kinds a default block's take: the
 * body as a paragraph's text, each other field's size, each link and image address, and the lane count.
 * Each field's tokens are checked under its name.
 */
function checkOwnBlock(
  walk: Walk,
  own: BlockEditor,
  block: EditorEmailBlock,
  content: Record<string, unknown>,
  id: string,
): void {
  for (const name of [...(own.body === null ? [] : [own.body.name]), ...own.fields.map((field) => field.name)]) {
    checkTokens(walk, { block: id, field: name }, text(content[name]));
  }
  for (const items of own.items) {
    const entries = content[items.name];
    if (!Array.isArray(entries)) continue;
    entries.forEach((entry: unknown, item) => {
      if (!isRecord(entry)) return;
      for (const field of items.fields) {
        checkTokens(walk, { block: id, field: items.name, item }, text(entry[field.name]));
      }
    });
  }
  if (own.body !== null) {
    const value = text(content[own.body.name]);
    const where = { block: id, field: own.body.name };
    if (value === '') walk.problems.push({ kind: 'text-empty', ...where });
    else if (value.length > own.body.max) walk.problems.push({ kind: 'text-too-long', ...where });
    const parsed = parseInlineMarkup(value);
    if (!parsed.ok) walk.problems.push({ kind: 'markup-malformed', ...where, offset: parsed.offset });
    else {
      const flagged = new Set<string>();
      for (const run of parsed.runs) {
        if (run.kind === 'link' && !flagged.has(run.href) && hrefFaulty(walk, run.href)) {
          flagged.add(run.href);
          const name = leadingToken(run.href);
          walk.problems.push({ kind: 'link-invalid', ...where, ...(name === undefined ? {} : { name }) });
        }
      }
    }
  }
  for (const field of own.fields) checkOwnField(walk, field, content[field.name], { block: id, field: field.name });
  // A library block's paired fields, such as a button's label and link, are filled together; the empty one is flagged.
  for (const [one, other] of LIBRARY_BLOCK_PAIRS[own.type as LibraryBlockType] ?? []) {
    const filled = (name: string) => text(content[name]).trim() !== '';
    if (filled(one) !== filled(other)) {
      walk.problems.push({ kind: 'text-empty', block: id, field: filled(one) ? other : one });
    }
  }
  for (const items of own.items) checkItems(walk, items, content[items.name], id);
  if (own.lanes !== null) {
    const count = Array.isArray(block.lanes) ? block.lanes.length : 0;
    if (count < own.lanes.min || count > own.lanes.max) {
      walk.problems.push({ kind: 'lanes-count', block: id, field: own.lanes.name });
    }
  }
}

/** The editor of a block built as a product's is: a profile's own block, or one of the library's. */
function ownEditorOf(walk: Walk, type: string): BlockEditor | undefined {
  const own = walk.profile.blocks?.find((candidate) => candidate.type === type);
  if (own) return own;
  return Object.hasOwn(libraryBlocks, type) ? libraryBlocks[type as LibraryBlockType].editor : undefined;
}

/** The keys each default kind's strict content schema has. */
const CONTENT_KEYS: Readonly<Record<string, readonly string[]>> = {
  paragraph: ['text'],
  callout: ['text'],
  list: ['items'],
  button: ['label', 'href'],
  code: ['code'],
  html: ['html'],
  divider: [],
  columns: [],
  heading: ['text'],
  quote: ['text'],
  image: ['src', 'alt', 'caption', 'href'],
  table: ['rows'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The block's content as the checks read it, with what the write check refuses for its shape reported as
 * `content-invalid`: content that is not an object, and each key the type's content does not have. A kind
 * named only through `extraKinds` has no known keys, so only its shape is checked.
 */
function contentOf(walk: Walk, block: EditorEmailBlock, id: string): Record<string, unknown> {
  const raw: unknown = block.content;
  if (!isRecord(raw)) {
    walk.problems.push({ kind: 'content-invalid', block: id });
    return {};
  }
  const own = ownEditorOf(walk, block.type);
  const keys = own
    ? [
        ...(own.body === null ? [] : [own.body.name]),
        ...own.fields.map((field) => field.name),
        ...own.items.map((items) => items.name),
      ]
    : CONTENT_KEYS[block.type];
  if (keys !== undefined) {
    for (const key of Object.keys(raw)) {
      if (!keys.includes(key)) walk.problems.push({ kind: 'content-invalid', block: id, field: key });
    }
  }
  return raw;
}

/** Whether `value` is one the product attribute takes. */
function attributeTakes(attribute: BlockEditorAttribute, value: unknown): boolean {
  if (attribute.kind === 'choice') return attribute.values.some((option) => option.value === value);
  if (attribute.kind === 'toggle') return typeof value === 'boolean';
  return typeof value === 'number' && value >= attribute.min && value <= attribute.max;
}

/**
 * What the write check refuses in a block's attributes, as `attributes-invalid`: attributes that are not an
 * object, and each key its type does not have or whose value it does not take, the key as `field`. A columns
 * block's ratio is `checkColumns`' to report. A kind named only through `extraKinds` has no known attributes,
 * so only its shape is checked.
 */
function checkAttributes(walk: Walk, block: EditorEmailBlock, id: string): void {
  const raw: unknown = block.attributes;
  if (!isRecord(raw)) {
    walk.problems.push({ kind: 'attributes-invalid', block: id });
    return;
  }
  const fields = new Set<string>();
  const own = ownEditorOf(walk, block.type);
  if (own) {
    for (const attribute of own.attributes) {
      if (raw[attribute.name] !== undefined && !attributeTakes(attribute, raw[attribute.name])) {
        fields.add(attribute.name);
      }
    }
    for (const key of Object.keys(raw)) {
      if (!own.attributes.some((attribute) => attribute.name === key)) fields.add(key);
    }
  } else if (Object.hasOwn(defaultBlocks, block.type)) {
    const parsed = defaultBlocks[block.type as DefaultBlockType].attributes.safeParse(raw);
    for (const issue of parsed.error?.issues ?? []) {
      const keys = issue.code === 'unrecognized_keys' ? issue.keys : [issue.path[0]];
      for (const key of keys) if (typeof key === 'string') fields.add(key);
    }
  }
  if (block.type === 'columns') fields.delete('ratio');
  for (const field of fields) walk.problems.push({ kind: 'attributes-invalid', block: id, field });
}

function checkColumns(walk: Walk, block: EditorEmailBlock, id: string): void {
  const lanes = Array.isArray(block.lanes) ? block.lanes : [];
  const ratio = isRecord(block.attributes) ? block.attributes.ratio : undefined;
  const valid =
    Array.isArray(ratio) &&
    ratio.length === lanes.length &&
    lanes.length >= 2 &&
    lanes.length <= walk.profile.bounds.lanes &&
    ratio.every((weight) => Number.isInteger(weight) && weight >= 1 && weight <= RATIO_WEIGHT_MAX);
  if (!valid) walk.problems.push({ kind: 'lanes-mismatch', block: id, field: 'ratio' });
  for (const lane of lanes) walkBlocks(walk, lane, 1);
}

function checkBlock(walk: Walk, block: EditorEmailBlock, depth: number): void {
  const id = block.id ?? block.key;
  const { bounds, kinds } = walk.profile;
  walk.count += 1;

  // A lane holds no block of lanes: the renderer draws a columns block, or a product's lanes block, at the top only.
  if (depth > 0 && (block.type === 'columns' || block.lanes !== undefined)) {
    walk.problems.push({ kind: 'block-nested-too-deep', block: id });
    return;
  }
  if (!(EMAIL_KINDS as readonly string[]).includes(block.type) && !kinds.includes(block.type)) {
    walk.problems.push({ kind: 'unknown-block-type', block: id });
    return;
  }
  if (!kinds.includes(block.type)) {
    walk.problems.push({ kind: 'block-not-allowed', block: id });
    return;
  }

  const content = contentOf(walk, block, id);
  checkAttributes(walk, block, id);
  switch (block.type) {
    case 'paragraph':
    case 'callout':
    case 'heading':
    case 'quote':
      checkField(walk, id, { field: 'text', value: text(content.text), max: bounds.text, marked: true });
      break;
    case 'list': {
      const items = Array.isArray(content.items) ? content.items : [];
      if (items.length === 0) walk.problems.push({ kind: 'text-empty', block: id, field: 'items' });
      if (items.length > bounds.listItems) walk.problems.push({ kind: 'list-too-long', block: id, field: 'items' });
      items.forEach((value, item) =>
        checkField(walk, id, { field: 'items', item, value: text(value), max: bounds.text, marked: true }),
      );
      break;
    }
    case 'button':
      checkField(walk, id, { field: 'label', value: text(content.label), max: bounds.label, marked: false });
      checkHref(walk, id, text(content.href));
      break;
    case 'code':
      checkField(walk, id, { field: 'code', value: text(content.code), max: bounds.text, marked: false });
      break;
    case 'html':
      checkField(walk, id, { field: 'html', value: text(content.html), max: bounds.text, marked: false });
      break;
    case 'columns':
      checkColumns(walk, block, id);
      break;
    case 'divider':
      break;
    case 'image':
      checkImage(walk, content, id);
      break;
    case 'table':
      checkTable(walk, content, id);
      break;
    default: {
      const own = ownEditorOf(walk, block.type);
      if (own) checkOwnBlock(walk, own, block, content, id);
      else {
        for (const name of new Set(variableTokens(content))) {
          walk.printed.add(name);
          if (declaredType(walk, name) === undefined) {
            walk.problems.push({ kind: 'variable-undeclared', block: id, name });
          }
        }
      }
      // A product's lanes block: its lanes' blocks are checked as a columns block's are.
      for (const lane of Array.isArray(block.lanes) ? block.lanes : []) walkBlocks(walk, lane, depth + 1);
    }
  }
}

function walkBlocks(walk: Walk, blocks: readonly EditorEmailBlock[], depth: number): void {
  // Stored JSON is read, not trusted: a lane or an entry of another shape is passed over rather than thrown on.
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) if (isRecord(block)) checkBlock(walk, block as unknown as EditorEmailBlock, depth);
}

function checkSms(walk: Walk, body: string): void {
  const offset = strayBraceOffset(body);
  if (offset !== -1) walk.problems.push({ kind: 'sms-placeholder-malformed', block: null, offset });
  const { segments, units, limit } = measureSmsBody(body);
  const maxSegments = walk.profile.maxSegments ?? 1;
  if (units > limit && segments > maxSegments) walk.problems.push({ kind: 'sms-segment-exceeded', block: null });
  checkTokens(walk, { block: null }, body);
  for (const { name, required } of walk.profile.variables) {
    if (required && !walk.printed.has(name)) {
      walk.problems.push({ kind: 'required-variable-not-printed', block: null, name });
    }
  }
}

/** The problems `value` has against `profile`, in document order, then field order. The editor never refuses an edit for one. */
export function validate(value: readonly EditorEmailBlock[] | string, profile: EditorProfile): ProfileProblem[] {
  const walk: Walk = { profile, problems: [], printed: new Set(), count: 0 };
  if (typeof value === 'string') {
    checkSms(walk, value);
    return walk.problems;
  }
  walkBlocks(walk, value, 0);
  if (walk.count > profile.bounds.blocks) walk.problems.push({ kind: 'too-many-blocks', block: null });
  for (const { name, required } of profile.variables) {
    if (required && !walk.printed.has(name)) {
      walk.problems.push({ kind: 'required-variable-not-printed', block: null, name });
    }
  }
  return walk.problems;
}
