import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/bases/base-ui/ui/card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '../feedback/status-indicator';

/** Footer status colour by tone - semantic tokens only, mirroring `StatusIndicator`. */
const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  online: 'text-success',
  offline: 'text-muted-foreground',
  busy: 'text-destructive',
  idle: 'text-warning',
};

interface AiProviderCardProps extends Omit<React.ComponentProps<'div'>, 'onSelect' | 'onClick'> {
  /** Provider display name. */
  name: string;
  /** Brand mark node - consumer-supplied (e.g. a `@zeroxsolutions/icons` mark).
   *  The card renders it verbatim and applies no fallback. */
  icon?: React.ReactNode;
  /** Short blurb - clamps to two lines with reserved height so grid rows align. */
  description?: React.ReactNode;
  /** Muted footer note (e.g. "12 models"), shown when no `status` is set. */
  meta?: React.ReactNode;
  /** Attention note; replaces `meta` and is styled by tone. */
  status?: { tone: StatusTone; text: string };
  /** Trailing control at the footer's right edge (e.g. a `Switch`). Interacting
   *  with it does not select the card - its click propagation is stopped. */
  action?: React.ReactNode;
  /** Select the card - the whole-card click target. */
  onSelect?: () => void;
}

/**
 * A tile for one AI provider in an overview grid: a leading brand-mark slot with
 * the provider name, a two-line description (reserved height so rows align), and
 * a footer carrying a muted meta note (or a tone-styled status) on the left and a
 * consumer-supplied control on the right. The whole card selects on click; the
 * trailing `action` sits in an island that stops propagation, so toggling it
 * doesn't also select. Domain-free: the consumer supplies the mark and control.
 */
function AiProviderCard({
  name,
  icon,
  description,
  meta,
  status,
  action,
  onSelect,
  className,
  ...props
}: AiProviderCardProps) {
  return (
    <Card
      size="sm"
      data-slot="ai-provider-card"
      onClick={onSelect}
      className={cn('hover:ring-foreground/20 h-full cursor-pointer transition-shadow', className)}
      {...props}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          {icon}
          <span className="min-w-0 flex-1 truncate">{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 min-h-11">{description}</CardDescription>
      </CardContent>
      <CardFooter className="mt-auto justify-between gap-2">
        {status ? (
          <span className={cn('truncate text-xs', STATUS_TONE_CLASS[status.tone])}>{status.text}</span>
        ) : (
          <span className="text-muted-foreground truncate text-xs">{meta}</span>
        )}
        {action != null && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
      </CardFooter>
    </Card>
  );
}

export { AiProviderCard };
export type { AiProviderCardProps };
