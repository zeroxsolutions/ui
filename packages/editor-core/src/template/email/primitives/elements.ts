import type { ColumnNode, EmailNode, TextRun } from './nodes.js';

/** One element of the email as it is written: its tag, its structural attributes and the classes it is styled by. */
export interface EmailElement {
  readonly tag: string;
  readonly attributes: readonly (readonly [name: string, value: string])[];
  readonly classes: readonly string[];
  readonly children: readonly ElementChild[];
  /** A style the primitive's own value sets, such as a spacer's height, written before the stylesheet's. */
  readonly ownStyle?: string;
}

/** An element, text to escape, or markup written as it is. */
export type ElementChild = EmailElement | { readonly text: string } | { readonly raw: string };

/** Where a node sits: among a stack's rows, which a table holds, or in a cell's flow. */
type Place = 'stack' | 'flow';

const TABLE: readonly (readonly [string, string])[] = [
  ['role', 'presentation'],
  ['cellpadding', '0'],
  ['cellspacing', '0'],
];
const FULL_TABLE: readonly (readonly [string, string])[] = [...TABLE, ['width', '100%']];

/** Outlook on Windows reads no `max-width`, so it alone is given a fixed table around the card. */
const OUTLOOK_OPEN =
  '<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->';
const OUTLOOK_CLOSE = '<!--[if mso]></td></tr></table><![endif]-->';

function element(
  tag: string,
  classes: readonly string[],
  children: readonly ElementChild[],
  attributes: readonly (readonly [string, string])[] = [],
): EmailElement {
  return { tag, attributes, classes, children };
}

function row(cell: EmailElement): EmailElement {
  return element('tr', [], [cell]);
}

/** A table of rows, each node in `children` one of them. */
function stack(classes: readonly string[], children: readonly EmailNode[]): EmailElement {
  return element('table', classes, expandNodes(children, 'stack'), FULL_TABLE);
}

function runs(list: readonly TextRun[]): ElementChild[] {
  return list.map((run) => {
    if (run.kind === 'link') return element('a', ['zx-link'], runs(run.label), [['href', run.href]]);
    let drawn: ElementChild = { text: run.text };
    if (run.italic) drawn = element('em', [], [drawn]);
    if (run.bold) drawn = element('strong', [], [drawn]);
    return drawn;
  });
}

function lanes(columns: readonly ColumnNode[]): EmailElement[] {
  const total = columns.reduce((sum, column) => sum + column.weight, 0);
  return columns.map((column, index) =>
    element(
      'td',
      [...column.classes, 'zx-lane', ...(index === columns.length - 1 ? ['zx-lane-last'] : [])],
      [stack([], column.children)],
      [
        ['width', `${total === 0 ? 0 : Math.round((column.weight / total) * 100)}%`],
        ['valign', 'top'],
      ],
    ),
  );
}

/** The elements one node is drawn as, outside a stack. */
function flow(node: EmailNode): ElementChild[] {
  switch (node.kind) {
    case 'section':
      return [element('table', [], [row(element('td', node.classes, expandNodes(node.children, 'flow')))], FULL_TABLE)];
    case 'columns':
      return [element('table', node.classes, [element('tr', [], lanes(node.columns))], FULL_TABLE)];
    case 'column':
      return lanes([node]);
    case 'text':
      return [element('div', node.classes, runs(node.runs))];
    case 'heading':
      return [element(`h${node.level}`, node.classes, runs(node.runs))];
    case 'button':
      return [element('a', node.classes, [{ text: node.label }], [['href', node.href]])];
    case 'image': {
      const image = element(
        'img',
        node.classes,
        [],
        [
          ['src', node.src],
          ['alt', node.alt],
          ['width', String(node.width)],
        ],
      );
      return [node.href === null ? image : element('a', ['zx-image-link'], [image], [['href', node.href]])];
    }
    case 'divider':
      return [element('div', node.classes, [{ raw: '&nbsp;' }])];
    case 'list':
      return [
        element(
          node.ordered ? 'ol' : 'ul',
          node.classes,
          node.items.map((item) => element('li', [], runs(item))),
        ),
      ];
    case 'code':
      return [element('div', node.classes, [{ text: node.text }])];
    case 'spacer':
      return [
        {
          ...element('div', node.classes, [{ raw: '&nbsp;' }]),
          ownStyle: `height:${node.height}px;line-height:${node.height}px;font-size:0;`,
        },
      ];
    case 'raw':
      return node.html === '' ? [] : [{ raw: node.html }];
    case 'preheader':
      return node.text === '' ? [] : [element('div', ['zx-preheader'], [{ text: node.text }])];
    case 'card':
      return [
        element(
          'table',
          ['zx-canvas'],
          [
            row(
              element(
                'td',
                ['zx-outer'],
                [
                  { raw: OUTLOOK_OPEN },
                  element('table', node.classes, [row(element('td', ['zx-inner'], [stack([], node.children)]))], TABLE),
                  { raw: OUTLOOK_CLOSE },
                ],
                [['align', 'center']],
              ),
            ),
          ],
          FULL_TABLE,
        ),
      ];
    case 'region':
      return node.children.length === 0 ? [] : [stack(['zx-region', `zx-region-${node.name}`], node.children)];
  }
}

/**
 * The elements `nodes` are drawn as. In a stack each node is a row: a section is its own row's cell, raw markup
 * is written as it is (a render that writes its own rows), and any other node sits in a cell of its own.
 */
export function expandNodes(nodes: readonly EmailNode[], place: Place = 'flow'): ElementChild[] {
  if (place === 'flow') return nodes.flatMap(flow);
  return nodes.flatMap((node): ElementChild[] => {
    if (node.kind === 'section') return [row(element('td', node.classes, expandNodes(node.children, 'flow')))];
    if (node.kind === 'raw') return flow(node);
    const drawn = flow(node);
    return drawn.length === 0 ? [] : [row(element('td', [], drawn))];
  });
}
