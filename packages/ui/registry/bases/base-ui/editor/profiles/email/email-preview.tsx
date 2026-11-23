'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MonitorIcon, SmartphoneIcon } from 'lucide-react';
import { MoonIcon } from '@/registry/bases/base-ui/icons/lucide/moon-icon';
import { SunIcon } from '@/registry/bases/base-ui/icons/lucide/sun-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { CHROME_ICON_CLASS, ChromeControl } from '../../document/ui/chrome-icon';
import type { ProfileEditorMessages } from '../messages';

export type EmailPreviewDevice = 'desktop' | 'mobile';
export type EmailPreviewScheme = 'light' | 'dark';

/**
 * The desktop frame's width, past the 600px at which the default layout's narrow-screen rules apply, and the
 * card's width inside it, which the inbox lines line up with.
 */
const DESKTOP_WIDTH = 640;
const CARD_WIDTH = 600;
/** The phone column's width at most. */
const PHONE_WIDTH = 375;

interface EmailPreviewBarProps {
  device: EmailPreviewDevice;
  scheme: EmailPreviewScheme;
  onDeviceChange(device: EmailPreviewDevice): void;
  onSchemeChange(scheme: EmailPreviewScheme): void;
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

/** A single choice: pressing the pressed toggle keeps it, so one is always chosen. */
function pick<Value extends string>(current: Value, set: (value: Value) => void) {
  return (values: string[]) => {
    const picked = values.find((value) => value !== current);
    if (picked) set(picked as Value);
  };
}

/** The preview's controls, drawn as the editor's toolbar is: the device, then the color scheme. */
function EmailPreviewBar({
  device,
  scheme,
  onDeviceChange,
  onSchemeChange,
  messages,
  className,
}: EmailPreviewBarProps) {
  return (
    <TooltipProvider>
      <div
        data-slot="email-preview-bar"
        className={cn('cn-editor-toolbar bg-popover flex flex-wrap items-center gap-0.5', className)}
      >
        <ToggleGroup
          aria-label={messages.previewDevice}
          spacing={0.5}
          value={[device]}
          onValueChange={pick(device, onDeviceChange)}
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
          onValueChange={pick(scheme, onSchemeChange)}
        >
          <EmailPreviewToggle value="light" label={messages.lightPreview} icon={SunIcon} />
          <EmailPreviewToggle value="dark" label={messages.darkPreview} icon={MoonIcon} />
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}

const SCHEME_QUERY = /@media\s*\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)/gi;
const HEIGHT_MESSAGE = 'email-preview-height';

function randomNonce(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * `html` as the frame loads it. Each `prefers-color-scheme` query is answered for `scheme`, since a frame's
 * query follows the viewer's system, or an emulator's scheme, whatever the frame's own `color-scheme` says.
 * A script reports the body's height to the parent; the policy lets only that script run, by its `nonce`, so
 * a script or a handler in the email's own markup stays inert as in a frame that runs none.
 */
function framed(html: string, scheme: EmailPreviewScheme, nonce: string): string {
  const answered = html.replace(SCHEME_QUERY, (_query, asked: string) =>
    asked.toLowerCase() === scheme ? '@media all' : '@media not all',
  );
  const policy = `<meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}'">`;
  const report =
    `<script nonce="${nonce}">(function(){var last=-1;function send(){` +
    'var h=Math.ceil(document.body.getBoundingClientRect().height);' +
    `if(h!==last){last=h;parent.postMessage({type:'${HEIGHT_MESSAGE}',height:h},'*');}}` +
    "new ResizeObserver(send).observe(document.body);addEventListener('load',send);send();})();</script>";
  const head = /<head[^>]*>/i.exec(answered);
  const withPolicy = head
    ? answered.slice(0, head.index + head[0].length) + policy + answered.slice(head.index + head[0].length)
    : policy + answered;
  const end = withPolicy.toLowerCase().lastIndexOf('</body>');
  return end < 0 ? withPolicy + report : withPolicy.slice(0, end) + report + withPolicy.slice(end);
}

interface EmailPreviewProps {
  /** The rendered email's document. */
  html: string;
  /** The subject and preheader as rendered, variables filled; an empty preheader draws no line. */
  subject: string;
  preheader: string;
  /** The sender's name the inbox line shows; none draws no line. */
  sender?: string;
  device: EmailPreviewDevice;
  scheme: EmailPreviewScheme;
  messages: ProfileEditorMessages;
  className?: string;
}

/**
 * The rendered email as an inbox shows it: the sender, subject and preheader over the email, on a muted canvas.
 * On desktop the email is drawn at a desktop width, scaled down to fit a narrower canvas, past the width its
 * narrow-screen rules apply at; on mobile, in a phone-wide column, never scaled, where they do. The frame is as
 * tall as the email, so the page scrolls rather than the frame.
 */
function EmailPreview({
  html,
  subject,
  preheader,
  sender,
  device,
  scheme,
  messages,
  className,
}: EmailPreviewProps): ReactNode {
  const room = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState(DESKTOP_WIDTH);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = room.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const read = (event: MessageEvent) => {
      if (event.source === null || event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown } | null;
      if (data?.type !== HEIGHT_MESSAGE || typeof data.height !== 'number' || !Number.isFinite(data.height)) return;
      setHeight(Math.max(0, data.height));
    };
    window.addEventListener('message', read);
    return () => window.removeEventListener('message', read);
  }, []);

  const srcDoc = useMemo(() => framed(html, scheme, randomNonce()), [html, scheme]);
  const desktop = device === 'desktop';
  // A hidden tab measures no width, and its frame keeps the last scale until it shows.
  const scale = desktop && width > 0 ? Math.min(1, width / DESKTOP_WIDTH) : 1;
  const tall = height === null ? undefined : height * scale;
  // Centred by a whole-pixel inset: an odd width centred by auto margins sits on a half pixel, which draws a seam.
  const phone = { maxWidth: PHONE_WIDTH, marginLeft: Math.floor(Math.max(0, width - PHONE_WIDTH) / 2) };

  // A new frame per scheme: Chromium kept the first document when `srcdoc` changed before it loaded.
  const email = (
    <iframe
      ref={frame}
      key={scheme}
      data-slot="email-preview"
      data-scheme={scheme}
      title={messages.emailPreview}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className={cn('block origin-top-left', height === null && 'h-96', !desktop && 'w-full')}
      style={{
        colorScheme: scheme,
        width: desktop ? DESKTOP_WIDTH : undefined,
        height: height ?? undefined,
        transform: scale < 1 ? `scale(${scale})` : undefined,
      }}
    />
  );

  return (
    <div data-slot="email-preview-canvas" className={cn('cn-editor-page bg-muted p-4', className)}>
      <div ref={room} data-slot="email-preview-device" data-device={device} className="flex flex-col gap-3">
        <div
          data-slot="email-preview-inbox"
          className={cn('flex w-full min-w-0 flex-col gap-0.5', desktop && 'mx-auto')}
          style={desktop ? { maxWidth: CARD_WIDTH * scale } : phone}
        >
          {sender && <p className="text-muted-foreground truncate text-xs">{sender}</p>}
          <p className="truncate text-sm font-medium">{subject}</p>
          {preheader && <p className="text-muted-foreground truncate text-xs">{preheader}</p>}
        </div>
        {desktop ? (
          // The email's own background is the page: no frame around it.
          <div
            data-slot="email-preview-page"
            className="mx-auto overflow-hidden"
            style={{ width: DESKTOP_WIDTH * scale, height: tall }}
          >
            {email}
          </div>
        ) : (
          <div data-slot="email-preview-page" className="cn-editor-page w-full overflow-hidden" style={phone}>
            {email}
          </div>
        )}
      </div>
    </div>
  );
}

export { EmailPreview, EmailPreviewBar };
export type { EmailPreviewBarProps, EmailPreviewProps };
