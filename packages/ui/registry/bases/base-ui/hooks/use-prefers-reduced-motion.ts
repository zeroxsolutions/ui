import * as React from 'react';

function queryMatches(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Whether the user prefers reduced motion (`prefers-reduced-motion: reduce`), correct from the first
 * render (so a caller's mount-time effect never fires on a stale value) and live afterward. Reads
 * `false` in a server render, matching a desktop with no preference set; a caller gates a played
 * animation on it, never the state it ends in.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(queryMatches);

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => setPrefersReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return (): void => query.removeEventListener('change', onChange);
  }, []);

  return prefersReducedMotion;
}

export { usePrefersReducedMotion };
