import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, Text as NativeText } from 'react-native';
import { catchBackPress } from './overlay.testing';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
  type SidebarProps,
  type SidebarProviderProps,
} from './sidebar';

// Jest runs no Reanimated frame into the props a query reads, so the opacity a sheet fades in from hides it
// from them.
configure({ defaultIncludeHiddenElements: true });

/** Lays the window out `width` px wide, as a phone (375) or a tablet (1024) would. */
function windowOf(width: number) {
  jest
    .spyOn(jest.requireActual<{ useWindowDimensions: unknown }>('react-native'), 'useWindowDimensions', 'get')
    .mockReturnValue(() => ({ width, height: 800, scale: 2, fontScale: 1 }));
}

/** Prints what useSidebar reports, for the specs to read. */
function Report() {
  const { state, open, openMobile, isMobile } = useSidebar();
  return <NativeText testID="report">{JSON.stringify({ state, open, openMobile, isMobile })}</NativeText>;
}

const report = () =>
  JSON.parse(String(screen.getByTestId('report').props.children)) as {
    state: string;
    open: boolean;
    openMobile: boolean;
    isMobile: boolean;
  };

function App({ sidebar, ...props }: SidebarProviderProps & { sidebar?: SidebarProps }) {
  return (
    <>
      <SidebarProvider {...props}>
        <Sidebar testID="sidebar" {...sidebar}>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel testID="label">Platform</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Playground">
                    Playground
                  </SidebarMenuButton>
                  <SidebarMenuAction aria-label="More" />
                  <SidebarMenuSub testID="sub">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>History</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
          <Report />
        </SidebarInset>
      </SidebarProvider>
      <PortalHost />
    </>
  );
}

/** The SidebarTrigger in the screen's header, drawn after the Sidebar and its rail. */
const toggle = () => screen.getAllByRole('button', { name: 'Toggle Sidebar' }).at(-1)!;
const rail = () => screen.getAllByRole('button', { name: 'Toggle Sidebar' })[0];
/** The box whose width opens and closes the panel beside the screen. */
const gap = () => screen.getByTestId('sidebar').parent?.parent as ReturnType<typeof screen.getByTestId>;

describe('Sidebar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const setup = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  it('throws when useSidebar is used outside a SidebarProvider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(render(<Report />)).rejects.toThrow('useSidebar must be used within a SidebarProvider.');
  });

  describe('from the md width', () => {
    beforeEach(() => windowOf(1024));

    it('is a 16rem panel beside the screen, open by default, and not a mobile sidebar', async () => {
      await render(<App />);
      await elapse(300);

      expect(report()).toEqual({ state: 'expanded', open: true, openMobile: false, isMobile: false });
      expect(gap()).toHaveAnimatedStyle({ width: 256 });
      expect(screen.getByRole('button', { name: 'Playground' })).toBeOnTheScreen();
      expect(screen.getByTestId('sidebar')).not.toHaveProp('role', 'dialog');
    });

    it('announces the main content beside it', async () => {
      await render(<App />);

      expect(screen.getByTestId('report').parent).toHaveProp('role', 'main');
    });

    it('slides off the screen when its trigger is pressed, and back when pressed again', async () => {
      const user = setup();
      await render(<App />);

      await user.press(toggle());
      await elapse(300);
      expect(report()).toMatchObject({ state: 'collapsed', open: false });
      expect(gap()).toHaveAnimatedStyle({ width: 0 });

      await user.press(toggle());
      await elapse(300);
      expect(report()).toMatchObject({ state: 'expanded', open: true });
      expect(gap()).toHaveAnimatedStyle({ width: 256 });
    });

    it('opens and closes from its rail', async () => {
      const user = setup();
      await render(<App />);

      await user.press(rail());
      expect(report()).toMatchObject({ state: 'collapsed' });
      await user.press(rail());
      expect(report()).toMatchObject({ state: 'expanded' });
    });

    it('collapses to a 3rem rail of its icons, hiding labels of sub-menus and actions', async () => {
      const user = setup();
      await render(<App sidebar={{ collapsible: 'icon' }} />);

      await user.press(toggle());
      await elapse(300);

      expect(gap()).toHaveAnimatedStyle({ width: 48 });
      expect(screen.queryByTestId('sub')).toBeNull();
      expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Playground' })).toBeOnTheScreen();
    });

    it('keeps room around a floating rail of icons', async () => {
      const user = setup();
      await render(<App sidebar={{ collapsible: 'icon', variant: 'floating' }} />);

      await user.press(toggle());
      await elapse(300);

      expect(gap()).toHaveAnimatedStyle({ width: 64 });
    });

    it('does not collapse when collapsible is none', async () => {
      const user = setup();
      await render(<App sidebar={{ collapsible: 'none' }} />);

      await user.press(toggle());
      await elapse(300);

      expect(screen.getByTestId('sidebar')).toHaveStyle({ width: 256 });
    });

    it('starts collapsed with defaultOpen false', async () => {
      await render(<App defaultOpen={false} />);
      await elapse(300);

      expect(report()).toMatchObject({ state: 'collapsed', open: false });
      expect(gap()).toHaveAnimatedStyle({ width: 0 });
    });

    it('follows open, and reports a press on its trigger through onOpenChange without closing itself', async () => {
      const onOpenChange = jest.fn();
      const user = setup();
      const view = await render(<App open onOpenChange={onOpenChange} />);

      await user.press(toggle());
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(report()).toMatchObject({ open: true });

      await view.rerender(<App open={false} onOpenChange={onOpenChange} />);
      expect(report()).toMatchObject({ state: 'collapsed', open: false });
    });

    it('moves at once when the system asks for reduced motion', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const user = setup();
      await render(<App />);
      await elapse(0);

      await user.press(toggle());
      await elapse(0);

      expect(gap()).toHaveAnimatedStyle({ width: 0 });
    });

    it('announces the active button as selected', async () => {
      await render(<App />);

      expect(screen.getByRole('button', { name: 'Playground' })).toBeSelected();
    });

    it('opens and closes on Cmd+B or Ctrl+B on the web', async () => {
      jest.replaceProperty(Platform, 'OS', 'web');
      const listeners: ((event: unknown) => void)[] = [];
      const page = {
        addEventListener: (_type: string, listener: (event: unknown) => void) => listeners.push(listener),
        removeEventListener: () => undefined,
      };
      jest.replaceProperty(globalThis as unknown as { window: unknown }, 'window', page);
      await render(<App />);
      const press = (event: { key: string; metaKey?: boolean; ctrlKey?: boolean }) =>
        act(async () => {
          for (const listener of listeners) {
            listener({ metaKey: false, ctrlKey: false, preventDefault: () => undefined, ...event });
          }
        });

      await press({ key: 'b', metaKey: true });
      expect(report()).toMatchObject({ open: false });
      await press({ key: 'b', ctrlKey: true });
      expect(report()).toMatchObject({ open: true });
      await press({ key: 'b' });
      expect(report()).toMatchObject({ open: true });
    });
  });

  describe('below the md width', () => {
    beforeEach(() => windowOf(375));

    /** The open sheet's dimmed backdrop, which a press outside the sidebar lands on. */
    function overlay() {
      const fade = screen.getByTestId('sidebar').parent?.parent?.children[0];
      const backdrop = typeof fade === 'object' ? fade?.children[0] : undefined;
      if (backdrop === undefined || typeof backdrop === 'string') throw new Error('The sheet has no overlay');
      return backdrop;
    }

    it('draws no sidebar until its trigger opens it as a sheet, and reports itself mobile', async () => {
      await render(<App />);

      expect(report()).toEqual({ state: 'expanded', open: true, openMobile: false, isMobile: true });
      expect(screen.queryByTestId('sidebar')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Playground' })).toBeNull();
    });

    it('opens a modal sheet named Sidebar from its trigger, leaving the panel state alone', async () => {
      const user = setup();
      await render(<App />);

      await user.press(toggle());
      await elapse(300);

      expect(screen.getByTestId('sidebar')).toHaveProp('role', 'dialog');
      expect(screen.getByRole('heading', { name: 'Sidebar' })).toHaveProp(
        'nativeID',
        screen.getByTestId('sidebar').props['aria-labelledby'],
      );
      expect(screen.getByRole('button', { name: 'Playground' })).toBeOnTheScreen();
      expect(report()).toMatchObject({ openMobile: true, open: true });
    });

    it('closes on a press outside it', async () => {
      const user = setup();
      await render(<App />);
      await user.press(toggle());
      await elapse(300);

      await user.press(overlay());
      await elapse(300);

      expect(screen.queryByTestId('sidebar')).toBeNull();
      expect(report()).toMatchObject({ openMobile: false });
    });

    it('closes on the back button', async () => {
      const pressBack = catchBackPress();
      const user = setup();
      await render(<App />);
      await user.press(toggle());
      await elapse(300);

      await pressBack();
      await elapse(300);

      expect(screen.queryByTestId('sidebar')).toBeNull();
      expect(report()).toMatchObject({ openMobile: false });
    });

    it('draws no rail and no tooltip', async () => {
      const user = setup();
      await render(<App />);
      await user.press(toggle());
      await elapse(300);

      expect(screen.getAllByRole('button', { name: 'Toggle Sidebar' })).toHaveLength(1);
    });

    it('becomes a panel when the window widens to md', async () => {
      const view = await render(<App />);
      expect(screen.queryByTestId('sidebar')).toBeNull();

      windowOf(1024);
      await view.rerender(<App />);
      await elapse(300);

      expect(report()).toMatchObject({ isMobile: false });
      expect(screen.getByTestId('sidebar')).not.toHaveProp('role', 'dialog');
    });
  });
});
