import { Portal } from '@rn-primitives/portal';
import { render, screen } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';

import * as findDemoModule from './find-demo';
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

  it("draws an overlay's portalled content, as a demo's dialog or menu opens one", async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(`${UPDATE}/--/overlay-demo`);
    jest.spyOn(findDemoModule, 'findDemo').mockReturnValue(function OverlayDemo() {
      return (
        <Portal name="overlay-demo">
          <Text>Portalled</Text>
        </Portal>
      );
    });

    await render(<Preview bundledStyle={undefined} applyColorScheme={() => undefined} />);

    expect(await screen.findByText('Portalled')).toBeTruthy();
  });
});
