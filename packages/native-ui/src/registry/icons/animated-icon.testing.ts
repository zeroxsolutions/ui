import { act, screen } from '@testing-library/react-native';
import { createElement, useImperativeHandle, type ComponentType, type ReactNode } from 'react';
import type { AnimatedIconProps } from '../lib/icon-motion';

/** The handle a stand-in icon hands its ref: spies a spec reads to see a control start or stop the icon. */
interface IconHandleSpy {
  startAnimation: jest.Mock<void, []>;
  stopAnimation: jest.Mock<void, []>;
}

type StandIn = ComponentType<AnimatedIconProps> & { handle: IconHandleSpy };

/** `Glyph` drawn as it is, handing its ref one {@link IconHandleSpy} for as long as the spec runs. */
function standIn(Glyph: ComponentType<AnimatedIconProps>): StandIn {
  const handle: IconHandleSpy = { startAnimation: jest.fn(), stopAnimation: jest.fn() };
  function Icon({ ref, ...props }: AnimatedIconProps): ReactNode {
    useImperativeHandle(ref, () => handle, []);
    return createElement(Glyph, props);
  }
  return Object.assign(Icon, { handle });
}

/**
 * The module a spec's `jest.mock` factory returns for an icon file of this folder, named as `copy-icon`: each icon
 * draws as the real one does, while its ref receives a spy {@link handleOf} reads back.
 *
 *   jest.mock('../../icons/copy-icon', () =>
 *     jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('copy-icon'),
 *   );
 */
function animatedIconModule(file: string): Record<string, StandIn> {
  const actual = jest.requireActual<Record<string, ComponentType<AnimatedIconProps>>>(`./${file}`);
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

export { animatedIconModule, focus, handleOf };
export type { IconHandleSpy };
