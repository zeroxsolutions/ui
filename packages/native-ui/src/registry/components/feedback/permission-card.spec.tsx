import { isHiddenFromAccessibility, render, screen, userEvent } from '@testing-library/react-native';
import { Circle, CircleCheck, CircleX } from 'lucide-react-native';
import { Button } from '../../ui/button';
import { CardDescription, CardHeader } from '../../ui/card';
import { Text } from '../../ui/text';
import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
  type PermissionCardStatusValue,
} from './permission-card';
import { emittedClasses } from '../../../build/slot-tokens.testing';

// Stands in for Icon so a spec reads which icon component the badge passes, not the path it draws.
jest.mock('../../ui/icon', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    ...jest.requireActual('../../ui/icon'),
    Icon: ({ as }: { as: unknown }) => createElement('View', { testID: 'status-icon', icon: as }),
  };
});

const STATUS_WORD = { pending: 'Pending', approved: 'Allowed', denied: 'Denied' } as const;

type ExampleProps = {
  status: PermissionCardStatusValue;
  onDeny?: () => void;
  onAllow?: () => void;
};

function Example({ status, onDeny, onAllow }: ExampleProps) {
  return (
    <PermissionCard status={status} testID="card">
      <CardHeader>
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        <CardDescription>Deploy the web app to production</CardDescription>
        <PermissionCardStatus testID="status" variant={status === 'denied' ? 'destructive' : 'outline'}>
          {STATUS_WORD[status]}
        </PermissionCardStatus>
      </CardHeader>
      <PermissionCardActions testID="actions">
        <Button variant="ghost" onPress={onDeny}>
          <Text>Deny</Text>
        </Button>
        <Button onPress={onAllow}>
          <Text>Allow once</Text>
        </Button>
      </PermissionCardActions>
      <PermissionCardResolved>
        <CardDescription>Allowed once - 2:14pm</CardDescription>
      </PermissionCardResolved>
    </PermissionCard>
  );
}

function cardClasses(style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId('card').props.className, style);
}

describe('PermissionCard', () => {
  it('draws its title on one line, announced as a heading, its description and its status word', async () => {
    await render(<Example status="pending" />);

    expect(screen.getByRole('heading', { name: 'Run deploy.sh' }).props.numberOfLines).toBe(1);
    expect(screen.getByText('Deploy the web app to production')).toBeOnTheScreen();
    expect(screen.getByText('Pending')).toBeOnTheScreen();
  });

  it('shows the decision row only while pending, and its buttons take a press', async () => {
    const user = userEvent.setup();
    const onDeny = jest.fn();
    const onAllow = jest.fn();
    await render(<Example status="pending" onDeny={onDeny} onAllow={onAllow} />);

    expect(screen.queryByText('Allowed once - 2:14pm')).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Deny' }));
    await user.press(screen.getByRole('button', { name: 'Allow once' }));

    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it.each(['approved', 'denied'] as const)(
    'keeps the resolved outcome in place of the decision once %s',
    async (status) => {
      await render(<Example status={status} />);

      expect(screen.getByText('Allowed once - 2:14pm')).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Deny' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Allow once' })).toBeNull();
    },
  );

  it.each([
    ['vega', 'rounded-xl', 'py-4'],
    ['lyra', 'rounded-none', 'py-3'],
  ] as const)('is the small card in %s, with no bottom padding under its footer', async (style, radius, padding) => {
    await render(<Example status="pending" />);

    // pb-0 follows the card's own vertical padding, so it wins on the bottom edge.
    const classes = cardClasses(style);
    expect(classes).toEqual(expect.arrayContaining([radius, padding, 'pb-0']));
    expect(classes.indexOf('pb-0')).toBeGreaterThan(classes.indexOf(padding));
  });

  it('keeps its bottom padding with no decision or resolved row', async () => {
    await render(
      <PermissionCard status="pending" testID="card">
        <CardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        </CardHeader>
      </PermissionCard>,
    );

    expect(cardClasses()).toContain('py-4');
    expect(cardClasses()).not.toContain('pb-0');
  });
});

describe('PermissionCardStatus', () => {
  it.each([
    ['pending', Circle],
    ['approved', CircleCheck],
    ['denied', CircleX],
  ] as const)('draws the %s icon, hidden from a screen reader, which reads the word', async (status, icon) => {
    await render(<Example status={status} />);

    const drawn = screen.getByTestId('status-icon', { includeHiddenElements: true });
    expect(drawn.props.icon).toBe(icon);
    expect(isHiddenFromAccessibility(drawn)).toBe(true);
    expect(screen.getByText(STATUS_WORD[status])).toBeOnTheScreen();
  });

  it('is an outline badge unless the caller passes another variant', async () => {
    await render(<Example status="pending" />);
    expect(emittedClasses(screen.getByTestId('status').props.className)).toContain('border-border');

    await screen.rerender(<Example status="denied" />);
    expect(emittedClasses(screen.getByTestId('status').props.className)).toContain('bg-destructive/10');
  });
});
