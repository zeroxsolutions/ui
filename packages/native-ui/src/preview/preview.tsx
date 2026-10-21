import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { zuiFonts } from '@/lib/fonts';

import { DemoBoundary } from './demo-boundary';
import { DEMO_NAMES, findDemo } from './find-demo';
import { postHeightToHost } from './frame-height';
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

function PreviewScreen({ bundledStyle, applyColorScheme }: PreviewProps): ReactNode {
  const style: PreviewStyle = (location ? styleFromSearch(location.search) : styleOf(bundledStyle)) ?? 'vega';
  const [loaded, error] = useFonts(zuiFonts);
  const [name, open] = useDemoName();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    const scheme = location ? themeFromSearch(location.search) : undefined;
    if (scheme !== undefined) applyColorScheme(scheme);
  }, [applyColorScheme]);

  const ready = (loaded || error !== null) && name !== LINK_UNREAD;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  const Demo = name === undefined ? undefined : findDemo(style, name);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="p-6"
      onContentSizeChange={(_width, height) => {
        if (Platform.OS === 'web') postHeightToHost(window, height);
      }}
    >
      <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
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
 * that height changes. The splash screen stays up until the fonts and, on native, the link are read.
 *
 * A preview app renders it as its root, after importing its engine's stylesheet; `@/` in this module and
 * the demos' `@/` resolve to that app's emitted sources. It holds the app's `PortalHost`, so the app adds none
 * of its own; a demo's overlay draws there, above the demo and inside the safe area's provider.
 */
function Preview(props: PreviewProps): ReactNode {
  return (
    <SafeAreaProvider>
      <PreviewScreen {...props} />
      <PortalHost />
    </SafeAreaProvider>
  );
}

export { Preview };
export type { PreviewProps };
