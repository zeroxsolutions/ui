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
    <PermissionCard status={status}>
      <CardHeader>
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        <CardDescription>Deploy the web app to production</CardDescription>
        <PermissionCardStatus variant={status === 'denied' ? 'destructive' : 'outline'}>
          {STATUS_WORD[status]}
        </PermissionCardStatus>
      </CardHeader>
      <PermissionCardActions>
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
});
