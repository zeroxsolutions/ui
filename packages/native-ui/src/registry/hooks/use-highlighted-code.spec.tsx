import { render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useHighlightedCode } from './use-highlighted-code';

describe('useHighlightedCode', () => {
  it('returns one highlighted node per line, leaving out a trailing newline', async () => {
    const { result } = await renderHook(() => useHighlightedCode('const a = 1\nconst b = 2\n', 'ts'));

    await waitFor(() => expect(typeof result.current[0]).not.toBe('string'));
    expect(result.current).toHaveLength(2);
    await render(<Text>{result.current[1]}</Text>);
    expect(screen.getByText('const')).toHaveStyle({ color: '#D73A49' });
  });

  it('returns the plain lines for a language the highlighter does not list', async () => {
    const { result } = await renderHook(() => useHighlightedCode('MOVE A TO B.', 'cobol'));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current).toEqual(['MOVE A TO B.']);
  });

  it('keeps the nodes of the lines already written as more code streams in', async () => {
    const { result, rerender } = await renderHook(({ code }: { code: string }) => useHighlightedCode(code, 'ts'), {
      initialProps: { code: 'const a = 1\nconst b' },
    });
    await waitFor(() => expect(typeof result.current[0]).not.toBe('string'));
    const [first] = result.current;

    await rerender({ code: 'const a = 1\nconst b = 2\nconst c' });

    expect(result.current).toHaveLength(3);
    expect(result.current[0]).toBe(first);
  });
});
