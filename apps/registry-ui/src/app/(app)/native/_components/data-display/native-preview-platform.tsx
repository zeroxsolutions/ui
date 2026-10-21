'use client';

import { useId, type ReactNode } from 'react';

import { EXPO_PROJECT_IDS } from '@/constants/native-preview-device';
import { PREVIEW_PLATFORM_LABELS, PREVIEW_PLATFORMS } from '@/constants/preview-platforms';
import { rememberPreviewPlatform, useRememberedPreviewPlatform } from '@/hooks/use-remembered-choice';
import type { NativeEngine } from '@/types/native-engine';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/bases/base-ui/ui/select';

import { NativePreviewFrame } from './native-preview-frame';
import { NativePreviewQrCode } from './native-preview-qr-code';

const PLATFORM_ITEMS = PREVIEW_PLATFORMS.map((platform) => ({
  value: platform,
  label: PREVIEW_PLATFORM_LABELS[platform],
}));

interface NativePreviewPlatformProps {
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
  /** The engine of the page; while its preview app has no EAS project the demo is only ever shown on the web. */
  engine: NativeEngine;
}

/**
 * `demo` on the platform the reader picked in a `NativePreviewPlatformSelect`: drawn in a frame on the
 * web, or as a QR code that opens it in Expo Go. The pick is remembered in the browser rather than in the
 * URL, so every native page shows the same platform and a shared link opens on the web.
 */
function NativePreviewPlatform({ demo, engine }: NativePreviewPlatformProps): ReactNode {
  const platform = useRememberedPreviewPlatform();

  if (platform === 'native' && EXPO_PROJECT_IDS[engine] !== null)
    return <NativePreviewQrCode demo={demo} engine={engine} />;
  return <NativePreviewFrame demo={demo} engine={engine} />;
}

/** The picker between the platforms a `NativePreviewPlatform` shows its demo on, named Platform. */
function NativePreviewPlatformSelect(): ReactNode {
  const id = useId();
  const platform = useRememberedPreviewPlatform();

  return (
    <div data-slot="native-preview-platform-select">
      <label htmlFor={id} className="sr-only">
        Platform
      </label>
      <Select
        items={PLATFORM_ITEMS}
        value={platform}
        onValueChange={(picked) => {
          if (picked !== null) rememberPreviewPlatform(picked);
        }}
      >
        <SelectTrigger id={id} size="sm">
          <span aria-hidden className="text-muted-foreground">
            Platform:
          </span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {PLATFORM_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { NativePreviewPlatform, NativePreviewPlatformSelect };
