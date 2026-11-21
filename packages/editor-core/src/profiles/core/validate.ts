import { parseInlineMarkup, variableTokens } from '../../template/index.js';
import type { EditorEmailBlock, EditorProfile, ProfileProblem } from './types.js';

const KNOWN_KINDS = ['paragraph', 'button', 'code', 'list', 'callout', 'divider', 'columns', 'html'];
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

function declaredType(walk: Walk, name: string): string | undefined {
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
      for (const run of parsed.runs) {
        const type = run.kind === 'link' ? declaredType(walk, run.variable) : undefined;
        if (run.kind === 'link' && type !== undefined && type !== 'url') {
          walk.problems.push({ kind: 'link-not-url-variable', ...where, name: run.variable });
        }
      }
    }
  }

  for (const name of new Set(variableTokens(value))) {
    walk.printed.add(name);
    if (declaredType(walk, name) === undefined) walk.problems.push({ kind: 'variable-undeclared', ...where, name });
  }
}

function checkHref(walk: Walk, block: string, value: string): void {
  const { bounds } = walk.profile;
  const before = walk.problems.length;
  checkField(walk, block, { field: 'href', value, max: bounds.href, marked: false });
  if (value === '' || walk.problems.length > before) return;
  const names = variableTokens(value);
  const exact = names.length === 1 && value === `{{${names[0]}}}`;
  if (!exact || declaredType(walk, names[0]) !== 'url') {
    walk.problems.push({ kind: 'href-not-url-variable', block, field: 'href' });
  }
}

function checkColumns(walk: Walk, block: EditorEmailBlock, id: string): void {
  const lanes = block.lanes ?? [];
  const ratio = block.attributes.ratio;
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

  if (depth > 0 && block.type === 'columns') {
    walk.problems.push({ kind: 'block-nested-too-deep', block: id });
    return;
  }
  if (!KNOWN_KINDS.includes(block.type) && !kinds.includes(block.type)) {
    walk.problems.push({ kind: 'unknown-block-type', block: id });
    return;
  }
  if (!kinds.includes(block.type)) {
    walk.problems.push({ kind: 'block-not-allowed', block: id });
    return;
  }

  const { content } = block;
  switch (block.type) {
    case 'paragraph':
    case 'callout':
      checkField(walk, id, { field: 'text', value: text(content.text), max: bounds.text, marked: true });
      break;
    case 'list': {
      const items = Array.isArray(content.items) ? content.items : [];
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
    default:
      for (const name of new Set(variableTokens(content))) {
        walk.printed.add(name);
        if (declaredType(walk, name) === undefined) {
          walk.problems.push({ kind: 'variable-undeclared', block: id, name });
        }
      }
  }
}

function walkBlocks(walk: Walk, blocks: readonly EditorEmailBlock[], depth: number): void {
  for (const block of blocks) checkBlock(walk, block, depth);
}

/** The problems `value` has against `profile`, in document order, then field order. The editor never refuses an edit for one. */
export function validate(value: readonly EditorEmailBlock[] | string, profile: EditorProfile): ProfileProblem[] {
  if (typeof value === 'string') return [];
  const walk: Walk = { profile, problems: [], printed: new Set(), count: 0 };
  walkBlocks(walk, value, 0);
  if (walk.count > profile.bounds.blocks) walk.problems.push({ kind: 'too-many-blocks', block: null });
  for (const { name, required } of profile.variables) {
    if (required && !walk.printed.has(name)) {
      walk.problems.push({ kind: 'required-variable-not-printed', block: null, name });
    }
  }
  return walk.problems;
}
