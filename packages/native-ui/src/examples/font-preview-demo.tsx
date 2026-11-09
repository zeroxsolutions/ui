import type { ReactNode } from 'react';
import { View } from 'react-native';

import { FontPreview } from '@/components/data-display/font-preview';

/**
 * Inter's regular face as a TrueType file, as Expo Google Fonts publishes it: a device loads TrueType and
 * OpenType, where the web demo's file is a WOFF2 only a browser reads.
 */
const INTER_URL = 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.1/400Regular/Inter_400Regular.ttf';

/**
 * A specimen of a sans-serif at its four default sizes, in the width a caller gives it. Narrower than other
 * demos' usual `max-w-sm`, because a truncated line never shrinks on its own, so the width here must already
 * clear a phone-width preview stage.
 */
function FontPreviewDemo(): ReactNode {
  return (
    <View className="w-full max-w-72">
      <FontPreview src={INTER_URL} />
    </View>
  );
}

export { FontPreviewDemo };
