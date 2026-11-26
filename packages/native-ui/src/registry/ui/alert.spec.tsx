import { render, screen } from '@testing-library/react-native';
import { Alert, AlertAction, AlertTitle } from './alert';
import { Button } from './button';
import { Text } from './text';

describe('Alert', () => {
  it('carries the alert role', async () => {
    await render(
      <Alert testID="alert">
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );

    // Not `accessible`, so a screen reader still reaches an action inside on its own, which leaves the
    // box outside getByRole.
    expect(screen.getByTestId('alert').props.role).toBe('alert');
  });

  it('leaves an action inside it reachable as a button of its own', async () => {
    await render(
      <Alert>
        <AlertTitle>Update ready</AlertTitle>
        <AlertAction>
          <Button size="xs">
            <Text>Restart</Text>
          </Button>
        </AlertAction>
      </Alert>,
    );

    expect(screen.getByRole('button', { name: 'Restart' })).toBeOnTheScreen();
  });
});
