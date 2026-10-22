import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Text } from './text';

function Repositories({ keepMounted = false, disabled = false }: { keepMounted?: boolean; disabled?: boolean }) {
  return (
    <Collapsible disabled={disabled}>
      <CollapsibleTrigger>
        <Text>Show repositories</Text>
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted={keepMounted} testID="content">
        <Text>@radix-ui/primitives</Text>
      </CollapsibleContent>
    </Collapsible>
  );
}

describe('Collapsible', () => {
  it('has a trigger announced as a collapsed button, and no content while closed', async () => {
    await render(<Repositories />);

    const trigger = screen.getByRole('button', { name: 'Show repositories' });
    expect(trigger).toBeCollapsed();
    expect(screen.queryByText('@radix-ui/primitives')).toBeNull();
  });

  it('shows the content and announces the trigger expanded when pressed, and hides it on a second press', async () => {
    const user = userEvent.setup();
    await render(<Repositories />);
    const trigger = screen.getByRole('button', { name: 'Show repositories' });

    await user.press(trigger);

    expect(trigger).toBeExpanded();
    expect(screen.getByText('@radix-ui/primitives')).toBeVisible();

    await user.press(trigger);

    expect(trigger).toBeCollapsed();
    expect(screen.queryByText('@radix-ui/primitives')).toBeNull();
  });

  it('follows a controlled open and reports presses through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Collapsible
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onOpenChange(next);
          }}
        >
          <CollapsibleTrigger>
            <Text>Details</Text>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Text>Shipped</Text>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    const user = userEvent.setup();
    await render(<Controlled />);

    expect(screen.getByText('Shipped')).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Details' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Shipped')).toBeNull();
  });

  it('keeps a keepMounted content rendered but hidden while closed', async () => {
    const user = userEvent.setup();
    await render(<Repositories keepMounted />);

    expect(screen.getByTestId('content', { includeHiddenElements: true })).not.toBeVisible();
    expect(emittedClasses(screen.getByTestId('content', { includeHiddenElements: true }).props.className)).toContain(
      'hidden',
    );

    await user.press(screen.getByRole('button', { name: 'Show repositories' }));

    expect(screen.getByTestId('content')).toBeVisible();
    expect(emittedClasses(screen.getByTestId('content').props.className)).not.toContain('hidden');
  });

  it('makes a Button the trigger through asChild, announced with its expanded state', async () => {
    const user = userEvent.setup();
    await render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Toggle" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Text>@stitches/react</Text>
        </CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    expect(trigger).toBeCollapsed();

    await user.press(trigger);

    expect(trigger).toBeExpanded();
    expect(screen.getByText('@stitches/react')).toBeVisible();
  });

  it('announces a disabled trigger and ignores its presses', async () => {
    const user = userEvent.setup();
    await render(<Repositories disabled />);
    const trigger = screen.getByRole('button', { name: 'Show repositories' });

    await user.press(trigger);

    expect(trigger).toBeDisabled();
    expect(screen.queryByText('@radix-ui/primitives')).toBeNull();
  });
});
