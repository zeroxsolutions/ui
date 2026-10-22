import { renderHook } from '@testing-library/react-native';
import { useChartTheme } from './chart-theme.uniwind';

const mockUniwind: { theme: string; variables: Record<string, string | undefined> } = { theme: 'light', variables: {} };

// The specs map ./color-scheme to NativeWind's file; this file's engine reads Uniwind's.
jest.mock('./color-scheme', () => jest.requireActual<object>('./color-scheme.uniwind'));

// The jest run has no Uniwind engine; this stands in for the theme it would hold.
jest.mock('uniwind', () => ({
  useUniwind: () => ({ theme: mockUniwind.theme, hasAdaptiveThemes: true }),
  useCSSVariable: (names: string[]) => names.map((name) => mockUniwind.variables[name]),
}));

describe('useChartTheme on Uniwind', () => {
  beforeEach(() => {
    mockUniwind.theme = 'light';
    mockUniwind.variables = {};
  });

  it('reads a theme variable as the colour Uniwind holds it under, --color-<name>', async () => {
    mockUniwind.variables = { '--color-chart-1': '#2563eb', '--color-destructive': '#dc2626' };
    const { result } = await renderHook(() => useChartTheme());

    expect(result.current.themeColor('--chart-1')).toBe('#2563eb');
    expect(result.current.themeColor('--color-chart-1')).toBe('#2563eb');
    expect(result.current.themeColor('--destructive')).toBe('#dc2626');
  });

  it('reports the scheme Uniwind draws', async () => {
    mockUniwind.theme = 'dark';
    const { result } = await renderHook(() => useChartTheme());

    expect(result.current.colorScheme).toBe('dark');
  });

  it('warns once in development of a variable the device has no colour for', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = await renderHook(() => useChartTheme());

    expect(result.current.themeColor('--brand')).toBeUndefined();
    expect(result.current.themeColor('--brand')).toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('--brand');
    warn.mockRestore();
  });
});
