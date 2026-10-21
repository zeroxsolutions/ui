import '@/global.css';

import { demos } from '@zeroxsolutions/native-ui/examples';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { zuiFonts } from '@/lib/fonts';

import { pinColorScheme } from './color-scheme';
import { DemoBoundary } from './demo-boundary';
import { demoNameFromPath, themeFromSearch } from './preview-url';

void SplashScreen.preventAutoHideAsync();

/** The page's location on web; native has none, so it opens on the list of demos. */
const location = Platform.OS === 'web' ? window.location : undefined;

function DemoList({ missing }: { missing: string | undefined }): ReactNode {
  return (
    <View className="gap-2">
      {missing !== undefined && <Text className="text-destructive">No demo is named {missing}.</Text>}
      {Object.keys(demos).map((name) => (
        <Text key={name} role="link" className="text-primary underline" onPress={() => location?.assign(name)}>
          {name}
        </Text>
      ))}
    </View>
  );
}

/**
 * Draws the demo the path names, such as `/native-preview/vega/button-demo`, in the colour scheme
 * `?theme=light|dark` asks for, or the system's without one; any other path lists the demos.
 */
function App(): ReactNode {
  const [loaded, error] = useFonts(zuiFonts);
  const name = location ? demoNameFromPath(location.pathname, process.env.EXPO_BASE_URL ?? '') : undefined;
  const Demo = name === undefined ? undefined : demos[name];

  useLayoutEffect(() => {
    const scheme = location ? themeFromSearch(location.search) : undefined;
    if (scheme === undefined) return;
    pinColorScheme(document.styleSheets, scheme);
    colorScheme.set(scheme);
  }, []);

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6">
      {Demo !== undefined && name !== undefined ? (
        <DemoBoundary name={name}>
          <Demo />
        </DemoBoundary>
      ) : (
        <DemoList missing={name} />
      )}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

export { App };
