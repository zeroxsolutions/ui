import { render, screen, userEvent } from '@testing-library/react-native';
import { useState, type ComponentProps } from 'react';
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
  });
});
