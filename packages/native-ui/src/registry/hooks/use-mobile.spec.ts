import { renderHook } from '@testing-library/react-native';
import { useIsMobile } from './use-mobile';

/** Lays the window out `width` px wide, as a phone (375) or a tablet (1024) would. */
function windowOf(width: number) {
  jest
    .spyOn(jest.requireActual<{ useWindowDimensions: unknown }>('react-native'), 'useWindowDimensions', 'get')
    .mockReturnValue(() => ({ width, height: 800, scale: 2, fontScale: 1 }));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useIsMobile', () => {
  it.each([
    [375, true],
    [767, true],
    [768, false],
    [1024, false],
  ])('at a window %ipx wide is %s', async (width, mobile) => {
    windowOf(width);

    const { result } = await renderHook(() => useIsMobile());

    expect(result.current).toBe(mobile);
  });
});
