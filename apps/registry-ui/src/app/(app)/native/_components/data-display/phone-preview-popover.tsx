'use client';

import { SmartphoneIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Suspense, type ReactNode } from 'react';

import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { EXPO_GO_SDK } from '@/constants/native-preview-device';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { expoGoUrl } from '@/lib/native-preview';
import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import type { PlatformStyle } from '@/types/platform';

interface PhonePreviewPopoverProps {
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
  /** The EAS project the preview's updates are published to; `null` renders nothing. */
  projectId: string | null;
}

/**
 * A button that opens a QR code and a link which open `demo` in Expo Go, in the style the page shows,
 * with a line on which Expo Go to install and how to scan.
 */
function PhonePreviewPopover({ demo, projectId }: PhonePreviewPopoverProps): ReactNode {
  if (projectId === null) return null;

  return (
    // Until the search params are read on the client, a statically rendered page links the default style.
    <Suspense
      fallback={<PhonePreviewPopoverBody demo={demo} projectId={projectId} style={DEFAULT_PLATFORM_STYLE.native} />}
    >
      <PhonePreviewPopoverFromUrl demo={demo} projectId={projectId} />
    </Suspense>
  );
}

function PhonePreviewPopoverFromUrl(props: { demo: string; projectId: string }): ReactNode {
  return <PhonePreviewPopoverBody {...props} style={useCurrentStyle('native')} />;
}

interface PhonePreviewPopoverBodyProps {
  demo: string;
  projectId: string;
  style: PlatformStyle<'native'>;
}

function PhonePreviewPopoverBody({ demo, projectId, style }: PhonePreviewPopoverBodyProps): ReactNode {
  const url = expoGoUrl({ projectId, style, demo });

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <SmartphoneIcon aria-hidden />
        Open on your phone
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Open on your phone</PopoverTitle>
          <PopoverDescription>
            Install Expo Go for SDK {EXPO_GO_SDK}, then scan the code with the iPhone camera, or from Expo Go on
            Android.
          </PopoverDescription>
        </PopoverHeader>
        {/* Dark on light in either site mode: a phone's camera reads a light-on-dark code less reliably. */}
        <QRCodeSVG
          value={url}
          size={176}
          marginSize={4}
          title="QR code that opens this demo in Expo Go"
          className="self-center rounded-md"
        />
        <div className="flex items-start gap-1">
          <a href={url} className="min-w-0 flex-1 font-mono text-xs break-all underline-offset-4 hover:underline">
            {url}
          </a>
          <CopyButton value={url} label="Copy the link" copiedLabel="Copied the link" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { PhonePreviewPopover };
