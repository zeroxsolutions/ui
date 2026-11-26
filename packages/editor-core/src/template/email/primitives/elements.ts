import type { VAlign } from '../../layout/index.js';
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
    const paint = [
      ...(run.color === undefined || run.color === 'default' ? [] : [`zx-color-${run.color}`]),
      ...(run.background === undefined || run.background === 'default' ? [] : [`zx-bg-${run.background}`]),
    ];
    return paint.length === 0 ? drawn : element('span', paint, [drawn]);
  });
}

/** The `valign` a table cell takes for each vertical alignment, which Outlook reads where it reads no CSS. */
const CELL_VALIGN = { top: 'top', center: 'middle', bottom: 'bottom' } as const satisfies Record<VAlign, string>;

function lanes(columns: readonly ColumnNode[], valign?: VAlign): EmailElement[] {
  const total = columns.reduce((sum, column) => sum + column.weight, 0);
  return columns.map((column, index) =>
    element(
      'td',
      [
        ...column.classes,
        'zx-lane',
        ...(index === columns.length - 1 ? ['zx-lane-last'] : []),
        ...(valign === undefined ? [] : [`zx-valign-${valign}`]),
      ],
      [stack([], column.children)],
      [
        ['width', `${total === 0 ? 0 : Math.round((column.weight / total) * 100)}%`],
        ['valign', CELL_VALIGN[valign ?? 'top']],
      ],
    ),
  );
}

/** Whether `node` is a wide section's row, which the card draws outside its padding. */
function isWideRow(node: EmailNode): boolean {
  return node.kind === 'section' && node.classes.includes('zx-section-wide');
}

/**
 * The card's children in runs: each run of rows drawn inside the card's padding, and each wide section's row,
 * lifted out of its region into a region of its own, drawn without it.
 */
function cardRuns(children: readonly EmailNode[]): { readonly wide: boolean; readonly nodes: EmailNode[] }[] {
  const runs: { wide: boolean; nodes: EmailNode[] }[] = [{ wide: false, nodes: [] }];
  const padded = (node: EmailNode): void => {
    const last = runs[runs.length - 1];
    if (last.wide) runs.push({ wide: false, nodes: [node] });
    else last.nodes.push(node);
  };
  for (const child of children) {
    if (child.kind !== 'region' || !child.children.some(isWideRow)) {
      padded(child);
      continue;
    }
    let rows: EmailNode[] = [];
    const flush = (): void => {
      if (rows.length > 0) padded({ ...child, children: rows });
      rows = [];
    };
    for (const row of child.children) {
      if (!isWideRow(row)) {
        rows.push(row);
        continue;
      }
      flush();
      runs.push({ wide: true, nodes: [{ ...child, children: [row] }] });
    }
    flush();
  }
  return runs.filter((run) => run.nodes.length > 0);
}

/** The card's inner rows: one padded cell, or, around a wide section, padded runs flush against it. */
function cardRows(children: readonly EmailNode[]): EmailElement[] {
  const runs = cardRuns(children);
  if (!runs.some((run) => run.wide)) return [row(element('td', ['zx-inner'], [stack([], children)]))];
  return runs.map((run, index) => {
    if (run.wide) return row(element('td', ['zx-inner-wide'], [stack([], run.nodes)]));
    const classes = [
      'zx-inner',
      ...(runs[index + 1]?.wide === true ? ['zx-inner-flush-bottom'] : []),
      ...(runs[index - 1]?.wide === true ? ['zx-inner-flush-top'] : []),
    ];
    return row(element('td', classes, [stack([], run.nodes)]));
  });
}

/** The elements one node is drawn as, outside a stack. */
function flow(node: EmailNode): ElementChild[] {
  switch (node.kind) {
    case 'section':
      return [element('table', [], [row(element('td', node.classes, expandNodes(node.children, 'flow')))], FULL_TABLE)];
    case 'columns':
      return [element('table', node.classes, [element('tr', [], lanes(node.columns, node.valign))], FULL_TABLE)];
    case 'column':
      return lanes([node]);
    case 'text':
      return [element('div', node.classes, runs(node.runs))];
    case 'heading':
      return [element(`h${node.level}`, node.classes, runs(node.runs))];
    case 'button':
      return [element('a', node.classes, [{ text: node.label }], node.href === null ? [] : [['href', node.href]])];
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
    case 'table': {
      if (node.rows.length === 0) return [];
      const shares = node.columnWidths;
      const sum = shares?.reduce((total, share) => total + share, 0) ?? 0;
      const widths =
        shares === undefined || sum <= 0 ? null : shares.map((share) => `${Math.round((share / sum) * 100)}%`);
      // A data table, so no presentation role: a screen reader reads its cells by row and header.
      const rows = node.rows.map((cells, index) => {
        const head = node.header && index === 0;
        return element(
          'tr',
          [],
          cells.map((cell, column) =>
            element(head ? 'th' : 'td', ['zx-table-cell', ...(head ? ['zx-table-head'] : [])], runs(cell), [
              ...(index === 0 && widths !== null ? [['width', widths[column]] as const] : []),
              ...(head ? [['scope', 'col'] as const] : []),
              ['align', 'left'],
              ['valign', 'top'],
            ]),
          ),
        );
      });
      return [
        element('table', node.classes, rows, [
          ['cellpadding', '0'],
          ['cellspacing', '0'],
          ['border', '0'],
          ['width', '100%'],
        ]),
      ];
    }
    case 'icons': {
      if (node.items.length === 0) return [];
      const size = String(node.size);
      const cells = node.items.map((item, index) =>
        element(
          'td',
          ['zx-icon', ...(index === node.items.length - 1 ? ['zx-icon-last'] : [])],
          [
            element(
              'a',
              ['zx-icon-link'],
              [
                element(
                  'img',
                  ['zx-icon-image'],
                  [],
                  [
                    ['src', item.src],
                    ['alt', item.alt],
                    ['width', size],
                    ['height', size],
                  ],
                ),
              ],
              [['href', item.href]],
            ),
          ],
          [['valign', 'middle']],
        ),
      );
      // A table of one row keeps the icons on one line; Outlook places it by its `align`, the rest by its margin.
      const align = node.align === 'left' ? [] : [['align', node.align] as const];
      return [element('table', node.classes, [element('tr', [], cells)], [...TABLE, ...align])];
    }
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
                  element('table', node.classes, cardRows(node.children), TABLE),
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
 * a render wrote as rows is written as it is, and any other node sits in a cell of its own.
 */
export function expandNodes(nodes: readonly EmailNode[], place: Place = 'flow'): ElementChild[] {
  if (place === 'flow') return nodes.flatMap(flow);
  return nodes.flatMap((node): ElementChild[] => {
    if (node.kind === 'section') return [row(element('td', node.classes, expandNodes(node.children, 'flow')))];
    if (node.kind === 'raw' && node.rows === true) return flow(node);
    const drawn = flow(node);
    return drawn.length === 0 ? [] : [row(element('td', [], drawn))];
  });
}
