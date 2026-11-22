import { measureSmsBody, type EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';

/**
 * What `body` costs a carrier: the units used of a segment's limit in its encoding, and, past the limit the
 * profile allows, the message of the `sms-segment-exceeded` problem, both in `messages`' words. A polite live
 * region, so a screen reader hears the count change.
 */
export function SmsMeter({
  body,
  profile,
  messages = DEFAULT_PROFILE_MESSAGES,
  className,
}: {
  body: string;
  profile: EditorProfile;
  messages?: ProfileEditorMessages;
  className?: string;
}) {
  const { units, limit, encoding, segments } = measureSmsBody(body);
  const maxSegments = profile.maxSegments ?? 1;
  const exceeded = units > limit && segments > maxSegments;
  return (
    <p
      data-slot="sms-meter"
      data-problem={exceeded ? 'sms-segment-exceeded' : undefined}
      aria-live="polite"
      className={cn('text-muted-foreground text-sm tabular-nums', exceeded && 'text-destructive', className)}
    >
      <span data-slot="sms-meter-count">{messages.smsMeter({ units, limit, encoding, segments, maxSegments })}</span>
      {exceeded && (
        <span data-slot="sms-meter-message"> {messages.problem({ kind: 'sms-segment-exceeded', block: null })}</span>
      )}
    </p>
  );
}
