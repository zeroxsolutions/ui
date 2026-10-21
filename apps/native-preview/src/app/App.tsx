import '@/global.css';

import { demos } from '@zeroxsolutions/native-ui/examples';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { zuiFonts } from '@/lib/fonts';

import { pinColorScheme } from './color-scheme';
import { DemoBoundary } from './demo-boundary';
import { findDemo } from './find-demo';
import { postHeightToHost } from './frame-height';
import { demoNameFromDeepLink, demoNameFromSearch, initialDemoName, themeFromSearch } from './preview-url';

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
      {Object.keys(demos).map((name) => (
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
 * Draws the demo the address names, such as `/native-preview/vega/index.html?demo=button-demo` on web or
 * `exp://u.expo.dev/<project>/--/button-demo` in Expo Go, in the colour scheme `?theme=light|dark` asks
 * for on web, or the system's without one; a name no demo has says so above the list of demos, and no
 * name lists them. In a frame, it posts the drawn content's height to the page framing it each time
 * that height changes.
 */
function Preview(): ReactNode {
  const [loaded, error] = useFonts(zuiFonts);
  const [name, open] = useDemoName();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    const scheme = location ? themeFromSearch(location.search) : undefined;
    if (scheme === undefined) return;
    pinColorScheme(document.styleSheets, scheme);
    colorScheme.set(scheme);
  }, []);

  const ready = (loaded || error !== null) && name !== LINK_UNREAD;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  const Demo = name === undefined ? undefined : findDemo(name);

  return (
    <ScrollView
      className="flex-1 bg-background"
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

/** The preview, inside the provider that reports the device's safe area; on web the insets are zero. */
function App(): ReactNode {
  return (
    <SafeAreaProvider>
      <Preview />
    </SafeAreaProvider>
  );
}

export { App };
