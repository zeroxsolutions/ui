import { render, screen } from '@testing-library/react-native';
import { I18nManager, Platform } from 'react-native';
import { DirectionProvider, useDirection } from './direction';
import { Text } from './text';

function Reads() {
  return <Text testID="reads">{useDirection()}</Text>;
}

/** The nearest element above `element` that carries a `dir`. */
function dirAround(element: ReturnType<typeof screen.getByTestId>) {
  let at = element.parent;
  while (at && at.props.dir === undefined) at = at.parent;
  return at;
}

function systemReadsRightToLeft(isRTL: boolean) {
  jest.spyOn(I18nManager, 'getConstants').mockReturnValue({ ...I18nManager.getConstants(), isRTL });
}

describe('useDirection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads left to right outside a provider on a system that does', async () => {
    systemReadsRightToLeft(false);

    await render(<Reads />);

    expect(screen.getByTestId('reads')).toHaveTextContent('ltr');
  });

  it('reads right to left outside a provider on a system that does', async () => {
    systemReadsRightToLeft(true);

    await render(<Reads />);

    expect(screen.getByTestId('reads')).toHaveTextContent('rtl');
  });

  it("reads the provider's direction over the system's", async () => {
    systemReadsRightToLeft(false);

    await render(
      <DirectionProvider direction="rtl">
        <Reads />
      </DirectionProvider>,
    );

    expect(screen.getByTestId('reads')).toHaveTextContent('rtl');
  });

  it("reads the nearest provider's direction", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <DirectionProvider direction="ltr">
          <Reads />
        </DirectionProvider>
      </DirectionProvider>,
    );

    expect(screen.getByTestId('reads')).toHaveTextContent('ltr');
  });

  it("gives a provider without a direction the system's", async () => {
    systemReadsRightToLeft(true);

    await render(
      <DirectionProvider>
        <Reads />
      </DirectionProvider>,
    );

    expect(screen.getByTestId('reads')).toHaveTextContent('rtl');
  });
});

describe('DirectionProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets the direction on the page around its children on the web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');

    await render(
      <DirectionProvider direction="rtl">
        <Reads />
      </DirectionProvider>,
    );

    expect(dirAround(screen.getByTestId('reads'))).toHaveProp('dir', 'rtl');
  });

  it('draws nothing around its children on a device, where the system sets the layout direction', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Reads />
      </DirectionProvider>,
    );

    expect(dirAround(screen.getByTestId('reads'))).toBeNull();
  });
});
