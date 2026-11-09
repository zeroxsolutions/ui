import { render, screen } from '@testing-library/react-native';
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

  it('forwards the props it was not asked for', async () => {
    await render(<FloatingToolbar testID="toolbar" accessibilityHint="Formats the selection" />);

    expect(screen.getByTestId('toolbar').props.accessibilityHint).toBe('Formats the selection');
  });
});
