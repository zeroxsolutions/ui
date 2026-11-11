import { getDefaultNormalizer, render, screen, userEvent, within } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { unified } from 'unified';
import { MarkdownView } from './markdown-view';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const HIDDEN = { includeHiddenElements: true } as const;

type Host = ReturnType<typeof screen.getByText>;

/**
 * Every host carrying `role`, in tree order. A list, a table and a rule are views that are not accessibility
 * elements, so a role query skips them, as the native table's own spec reads their role off their props.
 */
function withRole(role: string, from: Host | null = screen.root): Host[] {
  if (!from) return [];
  const below = from.children.flatMap((child) => (typeof child === 'string' ? [] : withRole(role, child)));
  return from.props.role === role ? [from, ...below] : below;
}

/** The nearest host at or above `element` that carries `role`. */
function closest(element: Host, role: string): Host | null {
  let at: Host | null = element;
  while (at && at.props.role !== role) at = at.parent;
  return at;
}

/** The text of the one Text inside `cell`. */
function textIn(cell: Host): string {
  return [within(cell).getByText(/./).props.children].flat().join('');
}

let openURL: jest.SpyInstance;

beforeEach(() => {
  openURL = jest.spyOn(Linking, 'openURL').mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('MarkdownView', () => {
  it('draws each heading as a heading of its level', async () => {
    await render(
      <MarkdownView>{'# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six'}</MarkdownView>,
    );

    const levels = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(
      (name) => screen.getByRole('heading', { name }).props['aria-level'],
    );
    expect(levels).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('draws a paragraph with its emphasis, strong and struck text, and no markup left', async () => {
    await render(<MarkdownView>{'Plain *leaning* and **bold** and ~~gone~~ words.'}</MarkdownView>);

    expect(screen.getByText('Plain leaning and bold and gone words.')).toBeOnTheScreen();
    expect(screen.getByText('leaning')).toBeOnTheScreen();
    expect(screen.getByText('bold')).toBeOnTheScreen();
    expect(screen.getByText('gone')).toBeOnTheScreen();
    expect(screen.queryByText(/[*~]/)).toBeNull();
  });

  it('breaks a line where the source ends one with two spaces', async () => {
    await render(<MarkdownView>{'first  \nsecond'}</MarkdownView>);

    const exact = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) };
    expect(screen.getByText('first\nsecond', exact)).toBeOnTheScreen();
  });

  it('opens a link with a safe URL', async () => {
    const user = userEvent.setup();
    await render(<MarkdownView>{'See the [changelog](https://example.test/changelog).'}</MarkdownView>);

    await user.press(screen.getByRole('link', { name: 'changelog' }));

    expect(openURL).toHaveBeenCalledWith('https://example.test/changelog');
  });

  it('opens a link GFM finds in plain text', async () => {
    const user = userEvent.setup();
    await render(<MarkdownView>{'Mail someone@example.test today.'}</MarkdownView>);

    await user.press(screen.getByRole('link', { name: 'someone@example.test' }));

    expect(openURL).toHaveBeenCalledWith('mailto:someone@example.test');
  });

  it('opens a reference link through its definition', async () => {
    const user = userEvent.setup();
    await render(<MarkdownView>{'Read [the docs][docs].\n\n[docs]: https://example.test/docs'}</MarkdownView>);

    await user.press(screen.getByRole('link', { name: 'the docs' }));

    expect(openURL).toHaveBeenCalledWith('https://example.test/docs');
  });

  it('does not open a link whose protocol is unsafe', async () => {
    const user = userEvent.setup();
    await render(
      <MarkdownView>{'[script](javascript:alert(1)) [data](data:text/html,x) [vb](VBScript:msgbox(1))'}</MarkdownView>,
    );

    for (const name of ['script', 'data', 'vb']) {
      await user.press(screen.getByRole('link', { name }));
    }

    expect(openURL).not.toHaveBeenCalled();
  });

  it('numbers an ordered list from its start', async () => {
    await render(<MarkdownView>{'3. three\n4. four'}</MarkdownView>);

    const [three, four] = withRole('listitem');
    expect(within(three).getByText('3.')).toBeOnTheScreen();
    expect(within(three).getByText('three')).toBeOnTheScreen();
    expect(within(four).getByText('4.')).toBeOnTheScreen();
    expect(within(four).getByText('four')).toBeOnTheScreen();
  });

  it('nests a list inside the item it belongs to', async () => {
    await render(<MarkdownView>{'- parent\n  - child\n- sibling'}</MarkdownView>);

    const [outer, inner] = withRole('list');
    expect(closest(screen.getByText('child'), 'list')).toBe(inner);
    expect(closest(inner, 'listitem')).toBe(closest(screen.getByText('parent'), 'listitem'));
    expect(closest(screen.getByText('sibling'), 'list')).toBe(outer);
  });

  it('draws each task item as a checkbox in its state, named by its text', async () => {
    await render(<MarkdownView>{'- [x] Ship the parser\n- [ ] Document the API\n- Plain note'}</MarkdownView>);

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'Ship the parser' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Document the API' })).not.toBeChecked();
    expect(screen.getByText('Plain note')).toBeOnTheScreen();
  });

  it('keeps a task checkbox in its state when pressed', async () => {
    const user = userEvent.setup();
    await render(<MarkdownView>{'- [ ] Document the API'}</MarkdownView>);

    await user.press(screen.getByRole('checkbox', { name: 'Document the API' }));

    expect(screen.getByRole('checkbox', { name: 'Document the API' })).not.toBeChecked();
  });

  it('draws a blockquote and a rule', async () => {
    await render(<MarkdownView>{'> quoted words\n\n---\n\nafter'}</MarkdownView>);

    expect(screen.getByText('quoted words')).toBeOnTheScreen();
    expect(withRole('separator')).toHaveLength(1);
    expect(screen.getByText('after')).toBeOnTheScreen();
  });

  it('draws an image named by its alt text', async () => {
    await render(<MarkdownView>{'![A harbour at dusk](https://example.test/harbour.png)'}</MarkdownView>);

    expect(screen.getByRole('img', { name: 'A harbour at dusk' })).toBeOnTheScreen();
  });

  it('draws a table with its header and body cells', async () => {
    await render(<MarkdownView>{'| A | B |\n| :- | -: |\n| 1 | 2 |\n| 3 | 4 |'}</MarkdownView>);

    expect(withRole('table')).toHaveLength(1);
    expect(withRole('columnheader').map(textIn)).toEqual(['A', 'B']);
    expect(withRole('cell').map(textIn)).toEqual(['1', '2', '3', '4']);
  });

  it('keeps inline code a chip in the text, with no copy action', async () => {
    await render(<MarkdownView>{'use `npm` here'}</MarkdownView>);

    expect(screen.getByText('npm')).toBeOnTheScreen();
    expect(screen.getByText('use npm here')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('draws fenced code as a code card headed with its language, with a copy action', async () => {
    await render(<MarkdownView>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);

    expect(screen.getByText('JSON')).toBeOnTheScreen();
    expect(screen.getByText('{ "a": 1 }')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Toggle content' })).toBeOnTheScreen();
  });

  it('leaves fenced code with no language headerless, with a floating copy action', async () => {
    await render(<MarkdownView>{'```\nline one\nline two\n```'}</MarkdownView>);

    expect(screen.getByText('line two')).toBeOnTheScreen();
    expect(screen.queryByText('Plain text')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Toggle content' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeOnTheScreen();
  });

  it('drops raw HTML and keeps the text around it', async () => {
    await render(<MarkdownView>{'<script>alert(1)</script>\n\nsafe and <b>bold</b> text'}</MarkdownView>);

    expect(screen.queryByText(/script|alert|<b>/, HIDDEN)).toBeNull();
    expect(screen.getByText('safe and bold text')).toBeOnTheScreen();
  });

  it('parses the source again only when the string changes', async () => {
    const parse = jest.spyOn(Object.getPrototypeOf(unified()), 'parse');
    await render(<MarkdownView>{'# Same'}</MarkdownView>);
    const afterFirst = parse.mock.calls.length;

    await screen.rerender(<MarkdownView>{'# Same'}</MarkdownView>);
    expect(parse.mock.calls.length).toBe(afterFirst);

    await screen.rerender(<MarkdownView>{'# Changed'}</MarkdownView>);
    expect(parse.mock.calls.length).toBeGreaterThan(afterFirst);
    expect(screen.getByRole('heading', { name: 'Changed' })).toBeOnTheScreen();
  });
});
