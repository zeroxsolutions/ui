import { useWindowDimensions } from 'react-native';

/** The window width, in px, from which a screen is not a phone's: Tailwind's `md`. */
const MOBILE_BREAKPOINT = 768;

/** Whether the window is narrower than the `md` width, as a phone's is; it follows the window as it resizes. */
function useIsMobile(): boolean {
  return useWindowDimensions().width < MOBILE_BREAKPOINT;
}

export { useIsMobile };
