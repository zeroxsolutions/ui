import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePulse } from '../../lib/motion';
import { cn } from '../../lib/utils';

/**
 * A semantic status, read the same way on every surface. online: connected, enabled, active. offline:
 * disconnected, disabled. busy: an error, unavailable. idle: pending, away.
 */
type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

/**
 * The dot each tone draws. Offline is a hollow ring, drawn as a border, which a view draws inside its
 * box as the web's inset ring is.
 */
const STATUS_TONE_CLASSES: Readonly<Record<StatusTone, string>> = {
  online: 'bg-success',
  offline: 'border border-muted-foreground',
  busy: 'bg-destructive',
  idle: 'bg-warning',
};

type StatusIndicatorProps = ComponentProps<typeof View> & {
  /** The status the dot's colour reports. */
  tone: StatusTone;
  /** Animate the dot, for a state still in progress such as connecting or live. */
  pulse?: boolean;
};

/**
 * A small presence dot coloured by a semantic tone, so every surface reads a status the same way.
 * Decorative: it is hidden from a screen reader, and the text beside it carries the status. Not for an
 * identity colour, and not for a modified flag, which is `UnsavedIndicator`. Offline draws as a hollow
 * ring, so it reads as a shape where a faint fill would vanish. `pulse` fades it to half opacity and back
 * unless the system asks for reduced motion, as the web's `motion-safe:animate-pulse` does.
 */
function StatusIndicator({ tone, pulse = false, className, ...props }: StatusIndicatorProps): ReactNode {
  const pulseStyle = usePulse(pulse);

  return (
    // The pulse runs on a layer around the dot, as Attachment's title pulses, so the dot stays a plain View
    // that both engines style.
    <Animated.View aria-hidden style={pulseStyle}>
      <View className={cn('size-2 shrink-0 rounded-full', STATUS_TONE_CLASSES[tone], className)} {...props} />
    </Animated.View>
  );
}

export { StatusIndicator };
export type { StatusIndicatorProps, StatusTone };
