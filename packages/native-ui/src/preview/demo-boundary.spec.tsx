import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { DemoBoundary } from './demo-boundary';

function Throws(): ReactNode {
  throw new Error('Text strings must be rendered within a <Text> component.');
}

describe('DemoBoundary', () => {
  beforeEach(() => {
    // React logs the caught error, and the boundary logs it again with the demo's name.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the error a demo threw, with its message and the demo's name, in place of the demo", async () => {
    await render(
      <DemoBoundary name="button-demo">
        <Throws />
      </DemoBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /The button-demo demo threw.*Text strings must be rendered within a <Text> component\./,
    );
  });

  it('draws the demo when it does not throw', async () => {
    await render(
      <DemoBoundary name="button-demo">
        <Text>Continue</Text>
      </DemoBoundary>,
    );

    expect(screen.getByText('Continue')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
