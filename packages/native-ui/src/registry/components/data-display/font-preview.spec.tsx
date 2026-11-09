import { render, screen, waitFor } from '@testing-library/react-native';
import { loadAsync } from 'expo-font';
import { StyleSheet } from 'react-native';
import { FontPreview } from './font-preview';

jest.mock('expo-font', () => ({ loadAsync: jest.fn() }));

const load = jest.mocked(loadAsync);
const INTER = 'https://example.com/Inter.ttf';
const PANGRAM = 'The quick brown fox jumps over the lazy dog';

function specimens() {
  return screen.getAllByText(PANGRAM).map((node) => StyleSheet.flatten(node.props.style));
}

beforeEach(() => {
  load.mockReset().mockResolvedValue(undefined);
});

describe('FontPreview', () => {
  it('draws the pangram at each default size, labelled with the size, largest first', async () => {
    await render(<FontPreview src={INTER} />);

    expect(specimens().map((style) => style.fontSize)).toEqual([36, 24, 18, 14]);
    expect(screen.getAllByText(/^\d+$/).map((node) => node.props.children)).toEqual([36, 24, 18, 14]);
    await waitFor(() => expect(specimens()[0]?.fontFamily).toBeDefined());
  });

  it('draws its own text at the sizes it is given, one line each, a line height 1.375 times the size', async () => {
    await render(
      <FontPreview src={INTER} sizes={[20, 10]}>
        Hamburgefonstiv
      </FontPreview>,
    );

    const lines = screen.getAllByText('Hamburgefonstiv');
    expect(lines.map((node) => StyleSheet.flatten(node.props.style).lineHeight)).toEqual([27.5, 13.75]);
    expect(lines.map((node) => node.props.numberOfLines)).toEqual([1, 1]);
    await waitFor(() => expect(load).toHaveBeenCalled());
  });

  it('loads the file under a family of its own, and names it on every specimen once loaded', async () => {
    await render(<FontPreview src={INTER} />);

    await waitFor(() => expect(specimens()[0]?.fontFamily).toBeDefined());
    const [[family, source]] = load.mock.calls as [[string, string]];
    expect(source).toBe(INTER);
    expect(family).toMatch(/^font-[a-zA-Z0-9]+$/);
    expect(specimens().map((style) => style.fontFamily)).toEqual([family, family, family, family]);
  });

  it('names no family before the file loads, nor when it fails to', async () => {
    load.mockRejectedValue(new Error('offline'));
    await render(<FontPreview src={INTER} />);

    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(specimens().map((style) => style.fontFamily)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('loads a new file under a new family when src changes', async () => {
    await render(<FontPreview src={INTER} />);
    await waitFor(() => expect(specimens()[0]?.fontFamily).toBeDefined());
    const first = specimens()[0]?.fontFamily;

    await screen.rerender(<FontPreview src="https://example.com/Geist.ttf" />);

    await waitFor(() => expect(specimens()[0]?.fontFamily).not.toBe(first));
    expect(specimens()[0]?.fontFamily).toBeDefined();
  });
});
