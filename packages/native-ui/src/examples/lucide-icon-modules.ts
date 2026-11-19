/// <reference types="expo/types/metro-require" />

/**
 * Every icon module of the lucide set, by its path from the set's folder (`./copy-icon.tsx`), each evaluated the
 * first time it is asked for. Metro reads the folder as it bundles, so an icon added to the set reaches the gallery
 * with no list to edit. The path is relative because Metro resolves a context's folder from this file and never
 * through the `@/` alias; it holds in the sources this file is copied into, where `components/` sits beside
 * `examples/`.
 */
const lucideIconModules = require.context('../components/general/lucide', false, /-icon\.tsx$/);

export { lucideIconModules };
