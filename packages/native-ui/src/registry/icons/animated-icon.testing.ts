import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The module a spec's `jest.mock` factory returns for the examples' `lucide-icon-modules`, whose Metro
 * `require.context` Jest cannot run: the same keys (`./copy-icon.tsx`) over this package's lucide folder, each
 * module required as it is asked for.
 *
 *   jest.mock('./lucide-icon-modules', () =>
 *     jest.requireActual('../registry/icons/animated-icon.testing').lucideIconModulesModule(),
 *   );
 */
function lucideIconModulesModule(): { lucideIconModules: ((key: string) => unknown) & { keys(): string[] } } {
  const keys = readdirSync(join(__dirname, 'lucide'))
    .filter((file) => file.endsWith('-icon.tsx'))
    .map((file) => `./${file}`);
  const lucideIconModules = (key: string): unknown =>
    jest.requireActual(`./lucide/${key.slice(2).replace(/\.tsx$/, '')}`);
  return { lucideIconModules: Object.assign(lucideIconModules, { keys: () => keys }) };
}

export { lucideIconModulesModule };
