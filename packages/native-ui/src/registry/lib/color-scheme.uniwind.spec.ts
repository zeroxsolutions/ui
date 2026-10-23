import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from './color-scheme.uniwind';

const mockUniwind: { theme: string } = { theme: 'light' };

// The jest run has no Uniwind engine; this stands in for the theme it would hold.
jest.mock('uniwind', () => ({
  useUniwind: () => ({ theme: mockUniwind.theme, hasAdaptiveThemes: true }),
}));

describe('useColorScheme on Uniwind', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    ['brand', 'light'],
  ])('reads the theme %s as %s', async (theme, drawn) => {
    mockUniwind.theme = theme;

    const { result } = await renderHook(() => useColorScheme());

    expect(result.current).toBe(drawn);
  });
});
