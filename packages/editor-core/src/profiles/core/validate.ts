import { hrefProblems, parseInlineMarkup, variableTokens, type VariableType } from '../../template/index.js';
import { leadingToken } from '../../template/markup/href.js';
import { defaultBlocks, type DefaultBlockType } from '../../template/email/blocks/index.js';
import { EMAIL_KINDS } from './profile.js';
import { measureSmsBody, strayBraceOffset } from './sms-text.js';
import type { EmailBlockEditor, EmailBlockEditorAttribute } from '../../template/email/define-email-block.js';
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

  if (marked) {
    const parsed = parseInlineMarkup(value);
    if (!parsed.ok) walk.problems.push({ kind: 'markup-malformed', ...where, offset: parsed.offset });
    else {
      const flagged = new Set<string>();
      for (const run of parsed.runs) {
        if (run.kind !== 'link' || flagged.has(run.href) || !hrefFaulty(walk, run.href)) continue;
        flagged.add(run.href);
        const name = leadingToken(run.href);
        walk.problems.push({ kind: 'link-invalid', ...where, ...(name === undefined ? {} : { name }) });
      }
    }
  }

  checkTokens(walk, where, value);
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

/**
 * What the renderer's write check refuses in a product block's fields, in the kinds a default block's take: the
 * body as a paragraph's text, each other field's size, each link and image address, and the lane count.
 * Each field's tokens are checked under its name.
 */
function checkOwnBlock(
  walk: Walk,
  own: EmailBlockEditor,
  block: EditorEmailBlock,
  content: Record<string, unknown>,
  id: string,
): void {
  for (const name of [...(own.body === null ? [] : [own.body.name]), ...own.fields.map((field) => field.name)]) {
    checkTokens(walk, { block: id, field: name }, text(content[name]));
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
  for (const field of own.fields) {
    const stored = content[field.name];
    const value = text(stored);
    const where = { block: id, field: field.name };
    // Left out, a field reads as empty; a value that is not text cannot be read at all.
    if (stored !== undefined && typeof stored !== 'string') walk.problems.push({ kind: 'text-empty', ...where });
    if (value.length > field.max) walk.problems.push({ kind: 'text-too-long', ...where });
    if (field.kind === 'plainText' || value === '') continue;
    const faulty =
      /[\r\n]/.test(value) || hrefFaulty(walk, value) || (field.kind === 'imageUrl' && MAIL.test(value.trim()));
    if (faulty) walk.problems.push({ kind: 'href-invalid', ...where });
  }
  if (own.lanes !== null) {
    const count = Array.isArray(block.lanes) ? block.lanes.length : 0;
    if (count < own.lanes.min || count > own.lanes.max) {
      walk.problems.push({ kind: 'lanes-count', block: id, field: own.lanes.name });
    }
  }
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
  const own = walk.profile.blocks?.find((candidate) => candidate.type === block.type);
  const keys = own
    ? [...(own.body === null ? [] : [own.body.name]), ...own.fields.map((field) => field.name)]
    : CONTENT_KEYS[block.type];
  if (keys !== undefined) {
    for (const key of Object.keys(raw)) {
      if (!keys.includes(key)) walk.problems.push({ kind: 'content-invalid', block: id, field: key });
    }
  }
  return raw;
}

/** Whether `value` is one the product attribute takes. */
function attributeTakes(attribute: EmailBlockEditorAttribute, value: unknown): boolean {
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
  const own = walk.profile.blocks?.find((candidate) => candidate.type === block.type);
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
    default: {
      const own = walk.profile.blocks?.find((candidate) => candidate.type === block.type);
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
