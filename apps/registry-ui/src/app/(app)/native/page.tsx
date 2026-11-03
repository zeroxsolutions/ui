import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { NativeHomePage } from '@zeroxsolutions/native-ui-docs-web/pages/native-home-page';
import { canonicalNativeComponentsSource } from '@/lib/native-source';
import { registryHomepage } from '@/lib/registry';

export const metadata: Metadata = {
  title: 'Native',
  description: 'Composed React Native components for shadcn, on NativeWind or Uniwind.',
};

/** The title and the URL of the item `name`'s native page under the default engine. */
function nativeComponentPage(name: string): { title: string; url: string } | undefined {
  const page = canonicalNativeComponentsSource.getPage([name]);
  return page && { title: page.data.title, url: page.url };
}

export default function Page(): ReactNode {
  return <NativeHomePage componentPage={nativeComponentPage} origin={registryHomepage} />;
}
