import { Portal, PortalHost } from '@rn-primitives/portal';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import * as ReactNative from 'react-native';
import { Platform, View } from 'react-native';
import { useModalOverlay, useModalOverlayShown, usePortalHostCheck } from './overlay';

/** An overlay part as the items draw one: shown through a Portal, with the check's probe inside it. */
function Overlay({ shown, hostName }: { shown: boolean; hostName?: string }) {
  const probe = usePortalHostCheck(shown, 'Dialog', hostName);
  return shown ? (
    <Portal name="overlay" hostName={hostName}>
      {probe}
    </Portal>
  ) : null;
}

describe('usePortalHostCheck', () => {
  let error: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

  it('reports an overlay shown with no PortalHost to draw it, naming the host and where it goes', async () => {
    await render(<Overlay shown />);
    await elapse(1_000);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toMatch(/Dialog.*no <PortalHost \/>.*root.*installation#add-a-portal-host/s);
  });

  it('names the host an overlay asked for by name', async () => {
    await render(
      <>
        <Overlay shown hostName="sheet-host" />
        <PortalHost />
      </>,
    );
    await elapse(1_000);

    expect(error.mock.calls[0]?.[0]).toMatch(/<PortalHost name="sheet-host" \/>/);
  });

  it('says nothing when a PortalHost draws the overlay', async () => {
    await render(
      <>
        <Overlay shown />
        <PortalHost />
      </>,
    );
    await elapse(1_000);

    expect(error).not.toHaveBeenCalled();
  });

  it('says nothing while the overlay is not shown', async () => {
    await render(<Overlay shown={false} />);
    await elapse(1_000);

    expect(error).not.toHaveBeenCalled();
  });

  it('checks again each time the overlay is shown', async () => {
    const view = await render(<Overlay shown />);
    await elapse(1_000);
    await view.rerender(<Overlay shown={false} />);
    await view.rerender(<Overlay shown />);
    await elapse(1_000);

    expect(error).toHaveBeenCalledTimes(2);
  });

  it('says nothing on the web, where the primitives draw into the page without a host', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Overlay shown />);
    await elapse(1_000);

    expect(error).not.toHaveBeenCalled();
  });
});

/** A modal overlay's layer, drawn while `shown`. */
function ModalLayer({ shown, testID }: { shown: boolean; testID: string }) {
  const layer = useModalOverlay(shown);
  return shown ? <View testID={testID} {...layer} /> : null;
}

/** The app's screen, hidden from screen readers while a modal overlay is shown. */
function Screen() {
  return <View testID="screen" aria-hidden={useModalOverlayShown()} />;
}

/** Whether screen readers skip the screen: a query that leaves out hidden elements no longer finds it. */
function screenHidden(): boolean {
  return screen.queryByTestId('screen', { includeHiddenElements: false }) === null;
}

describe('useModalOverlay', () => {
  it('hides the screen from screen readers while a modal overlay is shown, and shows it again after', async () => {
    const view = await render(
      <>
        <Screen />
        <ModalLayer shown testID="layer" />
      </>,
    );
    expect(screenHidden()).toBe(true);

    await view.rerender(
      <>
        <Screen />
        <ModalLayer shown={false} testID="layer" />
      </>,
    );
    expect(screenHidden()).toBe(false);
  });

  it('keeps the screen hidden until the last of two shown overlays goes', async () => {
    const view = await render(
      <>
        <Screen />
        <ModalLayer shown testID="first" />
        <ModalLayer shown testID="second" />
      </>,
    );

    await view.rerender(
      <>
        <Screen />
        <ModalLayer shown={false} testID="first" />
        <ModalLayer shown testID="second" />
      </>,
    );
    expect(screenHidden()).toBe(true);

    await view.unmount();
  });

  it('shows the screen again when a shown overlay is removed without closing', async () => {
    const view = await render(
      <>
        <Screen />
        <ModalLayer shown testID="layer" />
      </>,
    );

    await view.rerender(<Screen />);

    expect(screenHidden()).toBe(false);
  });

  it("makes the overlay's layer modal for VoiceOver, which then reads none of its siblings", async () => {
    await render(<ModalLayer shown testID="layer" />);

    expect(screen.getByTestId('layer')).toHaveProp('accessibilityViewIsModal', true);
  });

  it('leaves the layer to the web, where the primitives hide the page themselves', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<ModalLayer shown testID="layer" />);

    expect(screen.getByTestId('layer')).not.toHaveProp('accessibilityViewIsModal');
  });

  it('shares the count across copies of the module, as an app whose styles each ship one has', async () => {
    type Overlay = typeof import('./overlay');
    const load = (): Overlay => {
      let copy: Overlay | undefined;
      jest.isolateModules(() => {
        // The copies share the app's one React and React Native, as an app's style folders do.
        jest.doMock('react', () => React);
        jest.doMock('react-native', () => ReactNative);
        copy = jest.requireActual<Overlay>('./overlay');
      });
      if (copy === undefined) throw new Error('The overlay module did not load');
      return copy;
    };
    const vega = load();
    const nova = load();
    expect(nova).not.toBe(vega);

    function NovaDialog({ shown }: { shown: boolean }) {
      nova.useModalOverlay(shown);
      return null;
    }
    function VegaScreen() {
      return <View testID="screen" aria-hidden={vega.useModalOverlayShown()} />;
    }

    const view = await render(
      <>
        <VegaScreen />
        <NovaDialog shown />
      </>,
    );
    expect(screenHidden()).toBe(true);

    await view.rerender(
      <>
        <VegaScreen />
        <NovaDialog shown={false} />
      </>,
    );
    expect(screenHidden()).toBe(false);
  });
});
