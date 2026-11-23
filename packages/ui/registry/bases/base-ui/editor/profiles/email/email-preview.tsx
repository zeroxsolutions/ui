'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MonitorIcon, SmartphoneIcon } from 'lucide-react';
import { MoonIcon } from '@/registry/bases/base-ui/icons/lucide/moon-icon';
import { SunIcon } from '@/registry/bases/base-ui/icons/lucide/sun-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { CHROME_ICON_CLASS, ChromeControl } from '../../document/ui/chrome-icon';
import type { ProfileEditorMessages } from '../messages';

type EmailPreviewDevice = 'desktop' | 'mobile';
type EmailPreviewScheme = 'light' | 'dark';

interface EmailPreviewProps {
  /** The rendered email's document. */
  html: string;
  /** The subject and preheader as rendered, variables filled; an empty preheader draws no line. */
  subject: string;
  preheader: string;
  /** The sender's name the inbox line shows; none draws no line. */
  sender?: string;
  messages: ProfileEditorMessages;
  className?: string;
}

interface EmailPreviewToggleProps {
  value: string;
  label: string;
  /** An animated icon component, which plays while the toggle holds the pointer or the focus, or an element. */
  icon: unknown;
}

/** One choice of the preview bar: an icon toggle named and tipped by `label`. */
function EmailPreviewToggle({ value, label, icon }: EmailPreviewToggleProps) {
  return (
    <ChromeControl
      icon={icon}
      iconClassName={CHROME_ICON_CLASS}
      render={(control) => (
        <Tooltip>
          <TooltipTrigger render={<ToggleGroupItem value={value} size="sm" aria-label={label} {...control} />} />
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}

const SCHEME_QUERY = /@media\s*\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)/gi;

/**
 * `html` with each `prefers-color-scheme` query answered for `scheme`: a frame's query follows the viewer's
 * system, or the scheme an emulator forces on every frame, whatever the frame's own `color-scheme` says.
 */
function inScheme(html: string, scheme: EmailPreviewScheme): string {
  return html.replace(SCHEME_QUERY, (_query, asked: string) =>
    asked.toLowerCase() === scheme ? '@media all' : '@media not all',
  );
}

/** A single choice: pressing the pressed toggle keeps it, so one is always chosen. */
function pick<Value extends string>(current: Value, set: (value: Value) => void) {
  return (values: string[]) => {
    const picked = values.find((value) => value !== current);
    if (picked) set(picked as Value);
  };
}

/**
 * The rendered email as an inbox shows it: the sender, subject and preheader over the page, on a canvas at a
 * desktop or a phone's width, in a light or a dark scheme. The frame is sized, not scaled, so the email's own
 * narrow-screen rules apply on the phone; the scheme answers the email's `prefers-color-scheme` rules and sets
 * the frame's `color-scheme`. The scheme opens on the page's own.
 */
function EmailPreview({ html, subject, preheader, sender, messages, className }: EmailPreviewProps): ReactNode {
  const root = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<EmailPreviewDevice>('desktop');
  const [scheme, setScheme] = useState<EmailPreviewScheme>('light');
  // The page's theme is a class on an ancestor, which only the browser reads.
  useLayoutEffect(() => {
    if (root.current?.closest('.dark')) setScheme('dark');
  }, []);

  return (
    <div
      ref={root}
      data-slot="email-preview-canvas"
      className={cn('cn-editor-page bg-muted flex flex-col gap-4 py-4', className)}
    >
      <TooltipProvider>
        <div
          data-slot="email-preview-bar"
          className="cn-editor-toolbar bg-popover flex items-center gap-0.5 self-center"
        >
          <ToggleGroup
            aria-label={messages.previewDevice}
            spacing={0.5}
            value={[device]}
            onValueChange={pick(device, setDevice)}
          >
            <EmailPreviewToggle
              value="desktop"
              label={messages.desktopPreview}
              icon={<MonitorIcon aria-hidden className={CHROME_ICON_CLASS} />}
            />
            <EmailPreviewToggle
              value="mobile"
              label={messages.mobilePreview}
              icon={<SmartphoneIcon aria-hidden className={CHROME_ICON_CLASS} />}
            />
          </ToggleGroup>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <ToggleGroup
            aria-label={messages.previewScheme}
            spacing={0.5}
            value={[scheme]}
            onValueChange={pick(scheme, setScheme)}
          >
            <EmailPreviewToggle value="light" label={messages.lightPreview} icon={SunIcon} />
            <EmailPreviewToggle value="dark" label={messages.darkPreview} icon={MoonIcon} />
          </ToggleGroup>
        </div>
      </TooltipProvider>
      {/* A desktop wider than the canvas scrolls rather than shrinks, which would cross the narrow-screen rules. */}
      <div className="overflow-x-auto px-4">
        <div
          data-slot="email-preview-device"
          data-device={device}
          className={cn('mx-auto flex flex-col gap-3', device === 'desktop' ? 'w-160' : 'w-full max-w-93.75')}
        >
          <div data-slot="email-preview-inbox" className="flex min-w-0 flex-col gap-0.5 px-1">
            {sender && <p className="text-muted-foreground truncate text-xs">{sender}</p>}
            <p className="truncate text-sm font-medium">{subject}</p>
            {preheader && <p className="text-muted-foreground truncate text-xs">{preheader}</p>}
          </div>
          <div data-slot="email-preview-page" className="cn-editor-page bg-background h-128 overflow-hidden">
            {/* A new frame per scheme: Chromium kept the first document when `srcdoc` changed before it loaded. */}
            <iframe
              key={scheme}
              data-slot="email-preview"
              data-scheme={scheme}
              title={messages.emailPreview}
              sandbox=""
              srcDoc={inScheme(html, scheme)}
              style={{ colorScheme: scheme }}
              className="size-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { EmailPreview };
export type { EmailPreviewProps };
