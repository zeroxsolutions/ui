import { act, render, screen, userEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { toast } from '@styles/nova/components/ui/sonner';
import { toast as baseToast } from '@styles/nova/components/ui/toast';

import { Preview } from './preview';

// The provider draws nothing until the device reports its insets, which jest never does; the library's
// own mock reports zero insets at once.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const UPDATE = 'exp://u.expo.dev/0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';

describe('Preview', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('draws the demo the link that opened the app names', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/badge-demo?channel-name=nova`);

    await render(<Preview bundledStyle="nova" applyColorScheme={() => undefined} />);

    expect(await screen.findByText('Overdue')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'badge-demo' })).toBeNull();
  });

  it('lists the demos when the app was opened without one', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);

    await render(<Preview bundledStyle={undefined} applyColorScheme={() => undefined} />);

    expect(await screen.findByRole('link', { name: 'badge-demo' })).toBeTruthy();
  });

  it('says no demo has the name a link carries, above the list of demos', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/no-such-demo`);

    await render(<Preview bundledStyle={undefined} applyColorScheme={() => undefined} />);

    expect(await screen.findByRole('heading')).toHaveTextContent('No demo is named no-such-demo.');
    expect(screen.getByRole('link', { name: 'button-demo' })).toBeTruthy();
  });

  it("draws the content a demo's dialog portals out when its trigger is pressed", async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/dialog-demo`);
    await render(<Preview bundledStyle={undefined} applyColorScheme={() => undefined} />);

    await userEvent.press(await screen.findByRole('button', { name: 'Open Dialog' }));

    expect(await screen.findByText('Edit profile')).toBeOnTheScreen();
  });

  it("draws a toast that the style's sonner raises, as a demo's button raises one", async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/badge-demo`);
    await render(<Preview bundledStyle="nova" applyColorScheme={() => undefined} />);
    await screen.findByText('Overdue');

    await act(async () => {
      toast('Event has been created');
    });

    expect(await screen.findByText('Event has been created')).toBeTruthy();
    await act(async () => {
      toast.dismiss();
    });
    // The queue outlives the render, so the toast is let leave it before the next case.
    await waitForElementToBeRemoved(() => screen.queryByText('Event has been created'));
  });

  it("draws a toast that the style's toast manager adds, as a demo's button adds one", async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/badge-demo`);
    await render(<Preview bundledStyle="nova" applyColorScheme={() => undefined} />);
    await screen.findByText('Overdue');

    await act(async () => {
      baseToast.add({ title: 'Event created' });
    });

    expect(await screen.findByText('Event created')).toBeTruthy();
    await act(async () => {
      baseToast.close();
    });
    // The manager outlives the render, so the toast is let leave it before the next case.
    await waitFor(() => expect(screen.queryByText('Event created')).toBeNull());
  });
});
