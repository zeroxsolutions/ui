import { render, screen } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { highlightCode, loadHighlighter } from './highlighter';

/** The colour each piece of `text` in `line` is drawn in, as the line renders it. */
async function coloursOf(line: ReactNode, ...texts: string[]): Promise<unknown[]> {
  const view = await render(<Text>{line}</Text>);
  const colours = texts.map((text) => StyleSheet.flatten(screen.getByText(text).props.style)?.color);
  await view.unmount();
  return colours;
}

afterEach(() => {
  colorScheme.set('light');
});

describe('loadHighlighter', () => {
  it("draws each line's keyword in a colour apart from its number", async () => {
    const highlighter = await loadHighlighter('ts');
    const { lines } = highlighter!.highlight('const a = 1\nlet b = 2');

    expect(lines).toHaveLength(2);
    const [keyword, number] = await coloursOf(lines[0], 'const', '1');
    expect(keyword).toBeDefined();
    expect(keyword).not.toBe(number);
  });

  it('draws a keyword in another colour when the app draws dark', async () => {
    const highlighter = await loadHighlighter('typescript');
    const [light] = await coloursOf(highlighter!.highlight('const a = 1').lines[0], 'const');

    colorScheme.set('dark');
    const [dark] = await coloursOf(highlighter!.highlight('const a = 1').lines[0], 'const');

    expect(dark).toBeDefined();
    expect(dark).not.toBe(light);
  });

  it('returns null for a language it does not list', async () => {
    await expect(loadHighlighter('cobol')).resolves.toBeNull();
    await expect(highlightCode('MOVE A TO B.', 'cobol')).resolves.toBeNull();
  });

  it('takes an alias for a language it lists', async () => {
    const highlighter = await loadHighlighter('SH');

    const [command, comment] = await coloursOf(highlighter!.highlight('echo hi # note').lines[0], 'echo', '# note');

    expect(comment).toBeDefined();
    expect(comment).not.toBe(command);
  });

  it('continues a line from the grammar state the line before left', async () => {
    const highlighter = await loadHighlighter('ts');
    const first = highlighter!.highlight('/* open');
    const [comment] = await coloursOf(first.lines[0], '/* open');

    const [continued] = await coloursOf(
      highlighter!.highlight('still inside */', first.state).lines[0],
      'still inside */',
    );

    expect(continued).toBe(comment);
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
