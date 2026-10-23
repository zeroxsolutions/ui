import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { zuiFonts } from '@/lib/fonts';
import { useModalOverlayShown } from '@/lib/overlay';
import { Toaster as NovaToaster, useSonner as useNovaSonner } from '@styles/nova/components/ui/sonner';
import { Toaster as VegaToaster, useSonner as useVegaSonner } from '@styles/vega/components/ui/sonner';
import { Toaster as NovaBaseToaster, useToastManager as useNovaToastManager } from '@styles/nova/components/ui/toast';
import { Toaster as VegaBaseToaster, useToastManager as useVegaToastManager } from '@styles/vega/components/ui/toast';

import { DemoBoundary } from './demo-boundary';
import { DEMO_NAMES, findDemo } from './find-demo';
import { frameHeightOf, postHeightToHost, showsOverlay } from './frame-height';
import {
  demoNameFromDeepLink,
  demoNameFromSearch,
  initialDemoName,
  styleFromSearch,
  styleOf,
  themeFromSearch,
  type ColorScheme,
  type PreviewStyle,
} from './preview-url';

void SplashScreen.preventAutoHideAsync();

/** The page's location on web; native has none, and reads the demo from the link that opened it. */
const location = Platform.OS === 'web' ? window.location : undefined;

/**
 * Each style's Toasters, sonner's and toast's, and their hooks on the toasts that are up. A style's demos
 * raise toasts through that style's own sonner and toast manager, whose toasts only its own Toasters draw.
 */
const TOASTERS = {
  vega: {
    Toaster: VegaToaster,
    useSonner: useVegaSonner,
    BaseToaster: VegaBaseToaster,
    useToastManager: useVegaToastManager,
  },
  nova: {
    Toaster: NovaToaster,
    useSonner: useNovaSonner,
    BaseToaster: NovaBaseToaster,
    useToastManager: useNovaToastManager,
  },
} as const satisfies Record<PreviewStyle, unknown>;

/** The demo a link names until the app has read the link, on native, where reading it is async. */
const LINK_UNREAD = Symbol('link unread');

function DemoList({ missing, onOpen }: { missing: string | undefined; onOpen: (name: string) => void }): ReactNode {
  return (
    <View className="gap-2">
      {missing !== undefined && (
        <Text role="heading" className="font-sans-semibold text-destructive">
          No demo is named {missing}.
        </Text>
      )}
      {DEMO_NAMES.map((name) => (
        <Text key={name} role="link" className="text-primary underline" onPress={() => onOpen(name)}>
          {name}
        </Text>
      ))}
    </View>
  );
}

/**
 * The demo the app was opened on: the page's `?demo=` on web; on native the path after `/--/` of the link
 * that opened it, then of each link that reaches it while open, as Expo Go hands a scanned link to the
 * running app.
 * @returns the name, `undefined` for none, or {@link LINK_UNREAD} until native has read the link; and a
 * setter that opens another demo
 */
function useDemoName(): [string | undefined | typeof LINK_UNREAD, (name: string) => void] {
  const [name, setName] = useState<string | undefined | typeof LINK_UNREAD>(() =>
    location ? demoNameFromSearch(location.search) : LINK_UNREAD,
  );

  useEffect(() => {
    if (location) return;
    void initialDemoName(() => Linking.getInitialURL()).then((initial) =>
      setName((read) => (read === LINK_UNREAD ? initial : read)),
    );
    const subscription = Linking.addEventListener('url', ({ url }) => setName(demoNameFromDeepLink(url)));
    return () => subscription.remove();
  }, []);

  const open = (next: string): void => {
    if (!location) {
      setName(next);
      return;
    }
    const search = new URLSearchParams(location.search);
    search.set('demo', next);
    location.search = search.toString();
  };
  return [name, open];
}

/**
 * Whether the web page shows an overlay, such as an open dialog, kept up to date as overlays open and close;
 * always false on native, which posts no height.
 */
function useOverlayShown(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = (): void => setShown(showsOverlay(document));
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true });
    update();
    return () => observer.disconnect();
  }, []);
  return shown;
}

interface PreviewProps {
  /**
   * `process.env.EXPO_PUBLIC_STYLE`, the style a native update was bundled in, which Expo writes only
   * into the app's own code. On native the preview draws it, `vega` when it is unset; on web it draws
   * the page's `?style=`, `vega` without one.
   */
  bundledStyle: string | undefined;
  /**
   * Shows `scheme` whatever the system's, the engine's own way; called before the first paint on web when
   * the page asks for a scheme with `?theme=`, and again whenever a different function is passed, so pass
   * one declared at module scope.
   */
  applyColorScheme: (scheme: ColorScheme) => void;
}

/** The style the preview draws: the page's `?style=` on web, the bundled one on native, `vega` without either. */
function previewStyleOf(bundledStyle: string | undefined): PreviewStyle {
  return (location ? styleFromSearch(location.search) : styleOf(bundledStyle)) ?? 'vega';
}

function PreviewScreen({ bundledStyle, applyColorScheme }: PreviewProps): ReactNode {
  const style = previewStyleOf(bundledStyle);
  const [loaded, error] = useFonts(zuiFonts);
  const [name, open] = useDemoName();
  const insets = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState<number>();
  const overlayShown = useOverlayShown();
  // A toast draws over the page like an overlay, at the frame's bottom edge, so the frame grows for it too.
  // The style is fixed for the app's life, so the same hook runs on every render.
  const sonnerToasts = TOASTERS[style].useSonner().toasts;
  const baseToasts = TOASTERS[style].useToastManager().toasts;
  const toastShown = sonnerToasts.length > 0 || baseToasts.length > 0;

  useLayoutEffect(() => {
    const scheme = location ? themeFromSearch(location.search) : undefined;
    if (scheme !== undefined) applyColorScheme(scheme);
  }, [applyColorScheme]);

  const ready = (loaded || error !== null) && name !== LINK_UNREAD;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (Platform.OS === 'web' && contentHeight !== undefined) {
      postHeightToHost(window, frameHeightOf(contentHeight, overlayShown || toastShown));
    }
  }, [contentHeight, overlayShown, toastShown]);

  const modalShown = useModalOverlayShown();
  if (!ready) return null;
  const Demo = name === undefined ? undefined : findDemo(style, name);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="p-6"
      onContentSizeChange={(_width, height) => setContentHeight(height)}
    >
      {/* An open modal overlay hides the demo from screen readers on a device; the web's primitives hide
          the page themselves, and focus returns into it while the overlay goes out. */}
      <View
        aria-hidden={Platform.OS !== 'web' && modalShown}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {Demo !== undefined && name !== undefined ? (
          <DemoBoundary key={name} name={name}>
            <Demo />
          </DemoBoundary>
        ) : (
          <DemoList missing={name} onOpen={open} />
        )}
      </View>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

/**
 * Draws the demo the address names, in the style it names, such as
 * `/native-preview/index.html?style=nova&demo=button-demo` on web or
 * `exp://u.expo.dev/<project>/--/button-demo` in Expo Go, in the colour scheme `?theme=light|dark` asks
 * for on web, or the system's without one; a name no demo has says so above the list of demos, and no
 * name lists them. In a frame, it posts the drawn content's height to the page framing it each time
 * that height changes, and a taller one while the demo shows an overlay. The splash screen stays up until the fonts and, on native, the link are read.
 *
 * A preview app renders it as its root, after importing its engine's stylesheet; `@/` in this module and
 * the demos' `@/` resolve to that app's emitted sources. It holds the app's `PortalHost` and both Toasters, so
 * the app adds none; a demo's overlay draws there, above the demo and inside the safe area's provider, and its
 * toasts above that.
 */
function Preview(props: PreviewProps): ReactNode {
  const { Toaster, BaseToaster } = TOASTERS[previewStyleOf(props.bundledStyle)];
  return (
    <SafeAreaProvider>
      <BaseToaster>
        <PreviewScreen {...props} />
      </BaseToaster>
      <PortalHost />
      <Toaster />
    </SafeAreaProvider>
  );
}

export { Preview };
export type { PreviewProps };
