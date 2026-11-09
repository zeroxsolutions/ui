import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { FloatingToolbar } from './floating-toolbar';

function Example() {
  return (
    <FloatingToolbar testID="toolbar" aria-label="Text formatting">
      <Button variant="ghost" size="icon-sm" aria-label="Bold">
        <Text>B</Text>
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Italic">
        <Text>I</Text>
      </Button>
    </FloatingToolbar>
  );
}

function toolbarClasses(style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId('toolbar').props.className, style);
}

describe('FloatingToolbar', () => {
  it('is a toolbar named by its aria-label, holding the tools the caller composes', async () => {
    await render(<Example />);

    // A container stays out of the accessibility tree's leaves, so its buttons stay reachable; Testing Library
    // finds by role only a leaf, so the role and name are read off the view.
    const toolbar = screen.getByTestId('toolbar');
    expect(toolbar.props.role).toBe('toolbar');
    expect(toolbar.props['aria-label']).toBe('Text formatting');
    expect(screen.getByRole('button', { name: 'Bold' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeOnTheScreen();
  });

  it('lays its tools out in a row on the card colour', async () => {
    await render(<Example />);

    expect(toolbarClasses()).toEqual(
      expect.arrayContaining(['bg-card/95', 'flex-row', 'items-center', 'gap-0.5', 'px-1.5', 'py-1']),
    );
  });

  it.each([
    ['vega', 'rounded-md'],
    ['lyra', 'rounded-none'],
  ] as const)("draws its ring in %s as a hairline border, %s, under the menu's shadow", async (style, radius) => {
    await render(<Example />);

    expect(toolbarClasses(style)).toEqual(
      expect.arrayContaining(['border', 'border-foreground/10', radius, 'shadow-md']),
    );
  });

  it("draws maia's fainter light ring and its dark one as the border's colours", async () => {
    await render(<Example />);

    expect(emittedClasses(screen.getByTestId('toolbar').props.className, 'maia')).toEqual(
      expect.arrayContaining(['border', 'border-foreground/5', 'dark:border-foreground/10', 'rounded-2xl']),
    );
  });

  it('forwards the props it was not asked for', async () => {
    await render(<FloatingToolbar testID="toolbar" accessibilityHint="Formats the selection" className="absolute" />);

    expect(screen.getByTestId('toolbar').props.accessibilityHint).toBe('Formats the selection');
    expect(toolbarClasses()).toContain('absolute');
  });
});
