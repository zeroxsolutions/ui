'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Suspense, type ReactNode } from 'react';

import { EXPO_GO_SDK } from '@/constants/native-preview-device';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { expoGoUrl } from '@/lib/native-preview';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import type { PlatformStyle } from '@/types/platform';

interface NativePreviewQrCodeProps {
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
  /** The EAS project the preview's updates are published to. */
  projectId: string;
}

/**
 * A QR code that opens `demo` in Expo Go, in the style the page shows, and under it the same link as
 * text to copy, with the Expo Go release a phone has to have.
 */
function NativePreviewQrCode({ demo, projectId }: NativePreviewQrCodeProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page links the default style.
    <Suspense
      fallback={<NativePreviewQrCodeBody demo={demo} projectId={projectId} style={DEFAULT_PLATFORM_STYLE.native} />}
    >
      <NativePreviewQrCodeFromUrl demo={demo} projectId={projectId} />
    </Suspense>
  );
}

function NativePreviewQrCodeFromUrl(props: NativePreviewQrCodeProps): ReactNode {
  return <NativePreviewQrCodeBody {...props} style={useCurrentStyle('native')} />;
}

function NativePreviewQrCodeBody({
  demo,
  projectId,
  style,
}: NativePreviewQrCodeProps & { style: PlatformStyle<'native'> }): ReactNode {
  const url = expoGoUrl({ projectId, style, demo });

  return (
    <div data-slot="native-preview-qr-code" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <QRCodeSVG
        value={url}
        size={160}
        // The modules take the page's text colour on a clear ground: light on the frame in dark mode,
        // dark in light mode. A white ground would show as a light square on the dark frame.
        fgColor="currentColor"
        bgColor="transparent"
        title="QR code that opens this demo in Expo Go"
        className="text-foreground"
      />
      <p className="font-mono text-sm">Scan to preview.</p>
      <div className="text-muted-foreground flex w-full max-w-sm flex-col items-center gap-1 text-xs">
        <div className="flex w-full items-center justify-center gap-1">
          <a href={url} className="min-w-0 truncate font-mono underline-offset-4 hover:underline">
            {url}
          </a>
          <CopyButton value={url} label="Copy the link" copiedLabel="Copied the link" />
        </div>
        <p>Install Expo Go for SDK {EXPO_GO_SDK}; on Android, scan from inside Expo Go.</p>
      </div>
    </div>
  );
}

export { NativePreviewQrCode };
