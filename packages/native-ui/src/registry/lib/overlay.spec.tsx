import { Portal, PortalHost } from '@rn-primitives/portal';
import { act, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePortalHostCheck } from './overlay';

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
