import { render, screen } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Icon } from './icon.uniwind';

// The jest run has no Uniwind engine, so this stands in for withUniwind's manual mapping on native: a
// mapping with a styleProperty takes that one value unless the prop is already set, and a mapping
// without one takes every style the classes resolve to, under the caller's own.
jest.mock('uniwind', () => {
  const classStyles: Record<string, Record<string, unknown>> = {
    'size-4': { width: 16, height: 16 },
    'ml-auto': { marginLeft: 'auto' },
    'shrink-0': { flexShrink: 0 },
    'text-red-500': { color: 'red' },
    'text-foreground': { color: 'black' },
  };
  const resolve = (className: string): Record<string, unknown> =>
    Object.assign({}, ...className.split(/\s+/).map((name) => classStyles[name] ?? {}));

  return {
    withUniwind:
      (
        Component: ComponentType<Record<string, unknown>>,
        options: Record<string, { fromClassName: string; styleProperty?: string }>,
      ) =>
      (props: Record<string, unknown>) => {
        const generated: Record<string, unknown> = {};
        for (const [propName, option] of Object.entries(options)) {
          const className = props[option.fromClassName];
          if (typeof className !== 'string') continue;
          const styles = resolve(className);
          if (option.styleProperty === undefined) {
            generated[propName] = props[propName] === undefined ? styles : [styles, props[propName]];
          } else if (props[propName] === undefined) {
            generated[propName] = styles[option.styleProperty];
          }
        }
        return require('react').createElement(Component, { ...props, ...generated });
      },
  };
});

describe('Icon on Uniwind', () => {
  it('does not pass the className it mapped on to the svg', async () => {
    await render(<Icon as={Check} className="size-4 text-red-500" accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' }).props.className).not.toMatch(/size-4|text-red-500/);
  });

  it('gives the svg the margin and the shrink its classes name, as NativeWind does', async () => {
    await render(<Icon as={Check} className="ml-auto shrink-0" accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' })).toHaveStyle({ marginLeft: 'auto', flexShrink: 0 });
  });

  it('lets an explicit size and colour win over the classes', async () => {
    await render(
      <Icon
        as={Check}
        className="size-4 text-red-500"
        size={24}
        color="blue"
        accessible
        role="img"
        aria-label="Saved"
      />,
    );

    expect(screen.getByRole('img', { name: 'Saved' })).toHaveStyle({ width: 24, height: 24, color: 'blue' });
  });
});
