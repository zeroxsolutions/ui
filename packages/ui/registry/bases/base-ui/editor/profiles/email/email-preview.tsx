'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { ProfileEditorMessages } from '../messages';

type EmailPreviewScheme = 'light' | 'dark';

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

/**
 * The scheme of the theme `element` sits in: dark inside a `.dark` scope, else light. It follows a theme
 * switched later, as a class on any ancestor; light until the element mounts.
 */
function useSchemeAround(element: HTMLElement | null): EmailPreviewScheme {
  const [scheme, setScheme] = useState<EmailPreviewScheme>('light');
  useEffect(() => {
    if (!element) return;
    const read = () => setScheme(element.closest('.dark') ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    for (let node = element.parentElement; node; node = node.parentElement) {
      observer.observe(node, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, [element]);
  return scheme;
}

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

/**
 * The rendered email as an inbox shows it: the sender, subject and preheader over the email, on a muted canvas.
 * The email is drawn at the canvas's own width, so its narrow-screen rules apply wherever the preview is
 * narrow, and in the scheme of the theme around it. The frame is as tall as the email, so the page scrolls
 * rather than the frame.
 */
function EmailPreview({ html, subject, preheader, sender, messages, className }: EmailPreviewProps): ReactNode {
  const [canvas, setCanvas] = useState<HTMLDivElement | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const scheme = useSchemeAround(canvas);

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

  return (
    <div
      ref={setCanvas}
      data-slot="email-preview-canvas"
      className={cn('cn-editor-page bg-muted flex flex-col gap-3 p-4', className)}
    >
      <div data-slot="email-preview-inbox" className="flex min-w-0 flex-col gap-0.5">
        {sender && <p className="text-muted-foreground truncate text-xs">{sender}</p>}
        <p className="truncate text-sm font-medium">{subject}</p>
        {preheader && <p className="text-muted-foreground truncate text-xs">{preheader}</p>}
      </div>
      {/* A new frame per scheme: Chromium kept the first document when `srcdoc` changed before it loaded. */}
      <iframe
        ref={frame}
        key={scheme}
        data-slot="email-preview"
        data-scheme={scheme}
        title={messages.emailPreview}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        className={cn('block w-full', height === null && 'h-96')}
        style={{ colorScheme: scheme, height: height ?? undefined }}
      />
    </div>
  );
}

export { EmailPreview };
export type { EmailPreviewProps };
