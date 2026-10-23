import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from './color-scheme';

const mockScheme: { value: string | undefined } = { value: 'light' };

jest.mock('nativewind', () => ({
  ...jest.requireActual<object>('nativewind'),
  useColorScheme: () => ({ colorScheme: mockScheme.value }),
}));

describe('useColorScheme on NativeWind', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [undefined, 'light'],
  ])('reads %s from NativeWind as %s', async (held, drawn) => {
    mockScheme.value = held;

    const { result } = await renderHook(() => useColorScheme());

    expect(result.current).toBe(drawn);
  });
});
