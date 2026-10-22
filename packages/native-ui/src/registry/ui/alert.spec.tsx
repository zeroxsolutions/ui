import { render, screen } from '@testing-library/react-native';
import { CircleAlert } from 'lucide-react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Alert, AlertAction, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';

function classesOf(testID: string, style: 'vega' | 'nova' = 'vega'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

describe('Alert', () => {
  it('carries the alert role, drawn as a bordered card-coloured box', async () => {
    await render(
      <Alert testID="alert">
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );

    // Not `accessible`, so a screen reader still reaches an action inside on its own, which leaves the
    // box outside getByRole.
    expect(screen.getByTestId('alert').props.role).toBe('alert');
    expect(classesOf('alert')).toEqual(
      expect.arrayContaining(['rounded-lg', 'border', 'px-4', 'py-3', 'bg-card', 'gap-0.5']),
    );
    expect(classesOf('alert', 'nova')).toEqual(expect.arrayContaining(['px-2.5', 'py-2']));
  });

  it('draws the title in the medium weight and the description muted', async () => {
    await render(
      <Alert>
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes are live.</AlertDescription>
      </Alert>,
    );

    expect(emittedClasses(screen.getByText('Saved').props.className)).toEqual(
      expect.arrayContaining(['font-sans-medium', 'text-sm', 'text-card-foreground']),
    );
    expect(emittedClasses(screen.getByText('Your changes are live.').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm']),
    );
  });

  it('draws the destructive title and description in the destructive colour', async () => {
    await render(
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Check your card.</AlertDescription>
      </Alert>,
    );

    expect(emittedClasses(screen.getByText('Payment failed').props.className)).toContain('text-destructive');
    const description = emittedClasses(screen.getByText('Check your card.').props.className);
    expect(description).toContain('text-destructive/90');
    expect(description).not.toContain('text-muted-foreground');
  });

  it('sets an icon beside the title and description, spaced by the style', async () => {
    await render(
      <Alert testID="alert">
        <Icon as={CircleAlert} accessible role="img" aria-label="Warning" />
        <AlertTitle>Low storage</AlertTitle>
        <AlertDescription>Free some space.</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByTestId('alert');
    expect(classesOf('alert')).toEqual(expect.arrayContaining(['flex-row', 'gap-x-2.5']));
    expect(classesOf('alert', 'nova')).toContain('gap-x-2');
    const [icon, text] = alert.children.filter((child) => typeof child !== 'string');
    expect(icon).toBe(screen.getByRole('img', { name: 'Warning' }));
    expect(text).toContainElement(screen.getByText('Low storage'));
    expect(text).toContainElement(screen.getByText('Free some space.'));
  });

  it('keeps a column with no icon', async () => {
    await render(
      <Alert testID="alert">
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );

    expect(classesOf('alert')).not.toContain('flex-row');
  });

  it('draws an icon at 16px', async () => {
    expect(emittedClasses('cn-alert/icon')).toEqual(['size-4']);
    // The spec renders the source, whose icon class is still the slot token, so the token is
    // registered with the size the build translates it to.
    registerCSS('.cn-alert\\/icon { width: 16px; height: 16px; }');
    await render(
      <Alert variant="destructive">
        <Icon as={CircleAlert} accessible role="img" aria-label="Error" />
        <AlertTitle>Payment failed</AlertTitle>
      </Alert>,
    );

    const { width, height } = screen.getByRole('img', { name: 'Error' }).props;
    expect({ width, height }).toEqual({ width: 16, height: 16 });
  });

  it('pins an action to the top right and keeps the text clear of it', async () => {
    await render(
      <Alert testID="alert">
        <AlertTitle>Update ready</AlertTitle>
        <AlertAction testID="action">
          <Button size="xs">
            <Text>Restart</Text>
          </Button>
        </AlertAction>
      </Alert>,
    );

    expect(classesOf('alert')).toEqual(expect.arrayContaining(['relative', 'pr-[72px]']));
    expect(classesOf('action')).toEqual(expect.arrayContaining(['absolute', 'top-2.5', 'right-3']));
    expect(screen.getByRole('button', { name: 'Restart' })).toBeOnTheScreen();
  });
});
