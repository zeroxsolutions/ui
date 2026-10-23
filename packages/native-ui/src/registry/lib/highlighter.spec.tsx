import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { highlightCode, loadHighlighter } from './highlighter';

const mockTheme: { scheme: 'light' | 'dark' } = { scheme: 'light' };

jest.mock('nativewind', () => ({
  ...jest.requireActual<object>('nativewind'),
  useColorScheme: () => ({ colorScheme: mockTheme.scheme }),
}));

/** github-light's and github-dark's colours for a TypeScript keyword, and their colour for a comment. */
const KEYWORD = { light: '#D73A49', dark: '#F97583' };
const COMMENT = '#6A737D';

afterEach(() => {
  mockTheme.scheme = 'light';
});

describe('loadHighlighter', () => {
  it("draws each line's tokens in the light theme's colours", async () => {
    const highlighter = await loadHighlighter('ts');
    const { lines } = highlighter!.highlight('const a = 1\nlet b = 2');

    expect(lines).toHaveLength(2);
    await render(<Text>{lines[0]}</Text>);
    expect(screen.getByText('const')).toHaveStyle({ color: KEYWORD.light });
  });

  it("draws them in the dark theme's colours when the app draws dark", async () => {
    mockTheme.scheme = 'dark';
    const highlighter = await loadHighlighter('typescript');

    await render(<Text>{highlighter!.highlight('const a = 1').lines[0]}</Text>);

    expect(screen.getByText('const')).toHaveStyle({ color: KEYWORD.dark });
  });

  it('returns null for a language it does not list', async () => {
    await expect(loadHighlighter('cobol')).resolves.toBeNull();
    await expect(highlightCode('MOVE A TO B.', 'cobol')).resolves.toBeNull();
  });

  it('takes an alias for a language it lists', async () => {
    const highlighter = await loadHighlighter('SH');

    await render(<Text>{highlighter!.highlight('echo hi # note').lines[0]}</Text>);

    expect(screen.getByText('# note')).toHaveStyle({ color: COMMENT });
  });

  it('continues a line from the grammar state the line before left', async () => {
    const highlighter = await loadHighlighter('ts');
    const first = highlighter!.highlight('/* open');

    await render(<Text>{highlighter!.highlight('still inside */', first.state).lines[0]}</Text>);

    expect(screen.getByText('still inside */')).toHaveStyle({ color: COMMENT });
  });

  it('colours the escape codes of terminal output as ansi', async () => {
    const highlighter = await loadHighlighter('ansi');

    await render(<Text>{highlighter!.highlight('\u001b[31mfailed\u001b[0m passed').lines[0]}</Text>);

    expect(screen.getByText('failed')).not.toHaveStyle({ color: screen.getByText(' passed').props.style.color });
  });
});

describe('highlightCode', () => {
  it('returns one node per line', async () => {
    await expect(highlightCode('a\nb\nc', 'json')).resolves.toHaveLength(3);
  });
});
