import { act, screen } from '@testing-library/react-native';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, useImperativeHandle, useRef, type ComponentType, type ReactNode } from 'react';
import type { AnimatedIconProps, IconHandle } from '../lib/icon-motion';

/** The handle a stand-in icon hands its ref: spies a spec reads to see a control start or stop the icon. */
interface IconHandleSpy {
  startAnimation: jest.Mock<void, []>;
  stopAnimation: jest.Mock<void, []>;
}

type StandIn = ComponentType<AnimatedIconProps> & { handle: IconHandleSpy };

/**
 * `Glyph` drawn as it is, whose ref records each call on one {@link IconHandleSpy} for as long as the spec runs
 * and passes it on to the real icon, so its motion still runs.
 */
function standIn(Glyph: ComponentType<AnimatedIconProps>): StandIn {
  const handle: IconHandleSpy = { startAnimation: jest.fn(), stopAnimation: jest.fn() };
  function Icon({ ref, ...props }: AnimatedIconProps): ReactNode {
    const real = useRef<IconHandle>(null);
    useImperativeHandle(
      ref,
      () => ({
        startAnimation() {
          handle.startAnimation();
          real.current?.startAnimation();
        },
        stopAnimation() {
          handle.stopAnimation();
          real.current?.stopAnimation();
        },
      }),
      [],
    );
    return createElement(Glyph, { ...props, ref: real });
  }
  return Object.assign(Icon, { handle });
}

/**
 * The module a spec's `jest.mock` factory returns for an icon file of the lucide folder, named as `copy-icon`: each icon
 * draws and moves as the real one does, while its ref records each call on a spy {@link handleOf} reads back.
 *
 *   jest.mock('../../icons/lucide/copy-icon', () =>
 *     jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('copy-icon'),
 *   );
 */
function animatedIconModule(file: string): Record<string, StandIn> {
  const actual = jest.requireActual<Record<string, ComponentType<AnimatedIconProps>>>(`./lucide/${file}`);
  return Object.fromEntries(Object.entries(actual).map(([name, Glyph]) => [name, standIn(Glyph)]));
}

/**
 * The spy handle of an icon imported from a module {@link animatedIconModule} stands in for.
 * @throws {Error} when the icon's module was not mocked with it
 */
function handleOf(icon: ComponentType<AnimatedIconProps>): IconHandleSpy {
  const { handle } = icon as Partial<StandIn>;
  if (!handle) throw new Error(`${icon.name} is not a stand-in; mock its module with animatedIconModule`);
  return handle;
}

/**
 * Focuses `control` as a device does, through the handler its host element holds: a bare `fireEvent` would find
 * the one on the component above it and pass whatever the component dropped.
 */
async function focus(control: ReturnType<typeof screen.getByRole>): Promise<void> {
  await act(() => control.props.onFocus({ nativeEvent: {} }));
}

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

export { animatedIconModule, focus, handleOf, lucideIconModulesModule };
export type { IconHandleSpy };
