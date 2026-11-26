import { act, renderHook } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';
import { useColorScheme } from './color-scheme';

afterEach(() => {
  colorScheme.set('light');
});

describe('useColorScheme on NativeWind', () => {
  it.each(['dark', 'light'] as const)('reads %s from NativeWind', async (held) => {
    const { result } = await renderHook(() => useColorScheme());

    await act(() => colorScheme.set(held));

    expect(result.current).toBe(held);
  });
});
