import { render, screen } from '@testing-library/react-native';
import { I18nManager, Platform } from 'react-native';
import { DirectionProvider, useDirection, useDirectionSides, useMirrored, type TextDirection } from './direction';
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

function Sides() {
  return <Text testID="sides">{JSON.stringify(useDirectionSides())}</Text>;
}

function Mirrored() {
  return <Text testID="mirrored">{JSON.stringify(useMirrored() ?? null)}</Text>;
}

describe('useDirectionSides', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [
      "on the web, which lays out in the provider's direction",
      'web',
      false,
      true,
      'rtl',
      { rtl: true, layout: 'rtl', start: 'start', end: 'end', sidesSwapped: false },
    ],
    [
      'on a device laid out left to right under a right to left provider',
      'ios',
      false,
      true,
      'rtl',
      { rtl: true, layout: 'ltr', start: 'end', end: 'start', sidesSwapped: false },
    ],
    [
      'on a device laid out right to left under a left to right provider',
      'ios',
      true,
      true,
      'ltr',
      { rtl: false, layout: 'rtl', start: 'end', end: 'start', sidesSwapped: true },
    ],
    [
      'on a device laid out right to left, told to keep left and right',
      'android',
      true,
      false,
      'rtl',
      { rtl: true, layout: 'rtl', start: 'start', end: 'end', sidesSwapped: false },
    ],
    [
      'on a device laid out right to left with no provider',
      'android',
      true,
      true,
      undefined,
      { rtl: true, layout: 'rtl', start: 'start', end: 'end', sidesSwapped: true },
    ],
  ] as const)(
    'says which way an item runs and where its start is drawn, %s',
    async (_where, os, isRTL, swaps, direction: TextDirection | undefined, sides) => {
      jest.replaceProperty(Platform, 'OS', os);
      jest
        .spyOn(I18nManager, 'getConstants')
        .mockReturnValue({ ...I18nManager.getConstants(), isRTL, doLeftAndRightSwapInRTL: swaps });

      await render(
        direction === undefined ? (
          <Sides />
        ) : (
          <DirectionProvider direction={direction}>
            <Sides />
          </DirectionProvider>
        ),
      );

      expect(JSON.parse(String(screen.getByTestId('sides').props.children))).toEqual(sides);
    },
  );
});

describe('useMirrored', () => {
  it('mirrors side to side when text reads right to left, and leaves alone when it reads left to right', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Mirrored />
      </DirectionProvider>,
    );
    expect(JSON.parse(String(screen.getByTestId('mirrored').props.children))).toEqual({
      transform: [{ scaleX: -1 }],
    });

    await render(
      <DirectionProvider direction="ltr">
        <Mirrored />
      </DirectionProvider>,
    );
    expect(JSON.parse(String(screen.getByTestId('mirrored').props.children))).toBeNull();
  });
});
