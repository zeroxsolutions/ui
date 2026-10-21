import { render, screen, userEvent } from '@testing-library/react-native';
import { useState, type ComponentProps } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Text } from './text';

type SettingsTabsProps = Pick<ComponentProps<typeof TabsList>, 'variant'> &
  Pick<ComponentProps<typeof Tabs>, 'orientation'>;

/** Two settings tabs whose value follows the pressed trigger, as a caller's state would. */
function SettingsTabs({ variant, orientation }: SettingsTabsProps) {
  const [value, setValue] = useState('account');
  return (
    <Tabs value={value} onValueChange={setValue} orientation={orientation}>
      <TabsList variant={variant} testID="list">
        <TabsTrigger value="account">
          <Text>Account</Text>
        </TabsTrigger>
        <TabsTrigger value="password">
          <Text>Password</Text>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Text>Edit your profile.</Text>
      </TabsContent>
      <TabsContent value="password">
        <Text>Change your password.</Text>
      </TabsContent>
    </Tabs>
  );
}

type HostElement = ReturnType<typeof screen.getByRole>;

/** The host children of `element` that are elements, not strings. */
function hostChildrenOf(element: HostElement): HostElement[] {
  return element.children.filter((child): child is HostElement => typeof child !== 'string');
}

function triggerClasses(name: string): string[] {
  return emittedClasses(screen.getByRole('tab', { name }).props.className);
}

describe('Tabs', () => {
  it('shows the selected content only, and switches when another trigger is pressed', async () => {
    const user = userEvent.setup();
    await render(<SettingsTabs />);

    expect(screen.getByText('Edit your profile.')).toBeOnTheScreen();
    expect(screen.queryByText('Change your password.')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('tab', { name: 'Password' }));

    expect(screen.getByText('Change your password.')).toBeOnTheScreen();
    expect(screen.queryByText('Edit your profile.')).not.toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Password' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Account' }).props.accessibilityState.selected).toBe(false);
  });

  it('draws the selected trigger raised on the background, with the foreground label', async () => {
    await render(<SettingsTabs />);

    expect(triggerClasses('Account')).toEqual(expect.arrayContaining(['bg-background', 'shadow']));
    expect(triggerClasses('Password')).not.toContain('bg-background');
    expect(emittedClasses(screen.getByText('Account').props.className)).toContain('text-foreground');
    expect(emittedClasses(screen.getByText('Password').props.className)).toContain('text-foreground/60');
    expect(emittedClasses(screen.getByText('Account').props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'font-sans-medium']),
    );
  });

  it('draws the list as a 36px muted row', async () => {
    await render(<SettingsTabs />);

    expect(emittedClasses(screen.getByTestId('list').props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'h-9', 'rounded-lg', 'flex-row']),
    );
  });

  it('underlines the selected trigger of a line list, on no background', async () => {
    await render(<SettingsTabs variant="line" />);

    const list = emittedClasses(screen.getByTestId('list').props.className);
    const underlines = (name: string) =>
      hostChildrenOf(screen.getByRole('tab', { name })).filter((child) =>
        emittedClasses(child.props.className).includes('bg-foreground'),
      );

    expect(list).toEqual(expect.arrayContaining(['rounded-none', 'bg-transparent']));
    expect(list).not.toContain('bg-muted');
    expect(triggerClasses('Account')).toEqual(expect.arrayContaining(['shadow-none', 'bg-transparent']));
    expect(triggerClasses('Account')).not.toContain('bg-background');
    expect(underlines('Account')).toHaveLength(1);
    expect(underlines('Password')).toHaveLength(0);
  });

  it('stacks a vertical list in a column and aligns its triggers to the start', async () => {
    await render(<SettingsTabs orientation="vertical" />);

    const list = emittedClasses(screen.getByTestId('list').props.className);

    expect(list).toContain('flex-col');
    expect(list).not.toContain('h-9');
    expect(triggerClasses('Account')).toEqual(expect.arrayContaining(['w-full', 'justify-start']));
  });

  it('announces a disabled trigger and ignores its presses', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <Tabs value="account" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="account">
            <Text>Account</Text>
          </TabsTrigger>
          <TabsTrigger value="billing" disabled>
            <Text>Billing</Text>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const billing = screen.getByRole('tab', { name: 'Billing' });

    await user.press(billing);

    expect(billing.props.accessibilityState.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(emittedClasses(billing.props.className)).toContain('disabled:opacity-50');
  });
});
