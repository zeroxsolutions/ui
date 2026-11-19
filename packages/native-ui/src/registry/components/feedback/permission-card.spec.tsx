import { isHiddenFromAccessibility, render, screen, userEvent } from '@testing-library/react-native';
import { handleOf } from '../../icons/animated-icon.testing';
import { CircleCheckIcon } from '../../icons/lucide/circle-check-icon';
import { CircleIcon } from '../../icons/lucide/circle-icon';
import { CircleXIcon } from '../../icons/lucide/circle-x-icon';
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

// Stands in for Icon so a spec reads which icon component the badge passes, not the path it draws; the icon still
// takes its ref, so the badge can play it.
jest.mock('../../ui/icon', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    ...jest.requireActual('../../ui/icon'),
    Icon: ({ as, ref }: import('../../ui/icon').IconProps) =>
      createElement('View', { testID: 'status-icon', icon: as }, createElement(as, { ref })),
  };
});
jest.mock('../../icons/lucide/circle-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('circle-icon'),
);
jest.mock('../../icons/lucide/circle-check-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('circle-check-icon'),
);
jest.mock('../../icons/lucide/circle-x-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('circle-x-icon'),
);

const STATUS_ICONS = {
  pending: handleOf(CircleIcon),
  approved: handleOf(CircleCheckIcon),
  denied: handleOf(CircleXIcon),
} as const;

beforeEach(() => {
  jest.clearAllMocks();
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
    ['pending', CircleIcon],
    ['approved', CircleCheckIcon],
    ['denied', CircleXIcon],
  ] as const)('draws the %s icon, hidden from a screen reader, which reads the word', async (status, icon) => {
    await render(<Example status={status} />);

    const drawn = screen.getByTestId('status-icon', { includeHiddenElements: true });
    expect(drawn.props.icon).toBe(icon);
    expect(isHiddenFromAccessibility(drawn)).toBe(true);
    expect(screen.getByText(STATUS_WORD[status])).toBeOnTheScreen();
  });
});

describe('PermissionCardStatus motion', () => {
  it('plays nothing as it is first drawn', async () => {
    await render(<Example status="approved" />);

    for (const handle of Object.values(STATUS_ICONS)) expect(handle.startAnimation).not.toHaveBeenCalled();
  });

  it.each([
    ['pending', 'approved'],
    ['pending', 'denied'],
    ['denied', 'pending'],
  ] as const)('plays the new status icon once when a %s request turns %s', async (from, to) => {
    await render(<Example status={from} />);

    await screen.rerender(<Example status={to} />);
    await screen.rerender(<Example status={to} />);

    expect(STATUS_ICONS[to].startAnimation).toHaveBeenCalledTimes(1);
    expect(STATUS_ICONS[from].startAnimation).not.toHaveBeenCalled();
  });
});
