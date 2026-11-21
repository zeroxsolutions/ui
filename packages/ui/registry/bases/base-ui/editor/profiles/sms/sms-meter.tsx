import { measureSmsBody, type EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { problemMessage } from '../problem-messages';

const ENCODING_LABELS = { gsm7: 'GSM-7', ucs2: 'UCS-2' } as const;

/**
 * What `body` costs a carrier: the units used of a segment's limit in its encoding, and, past the limit the
 * profile allows, the message of the `sms-segment-exceeded` problem. A polite live region, so a screen reader
 * hears the count change.
 */
export function SmsMeter({ body, profile, className }: { body: string; profile: EditorProfile; className?: string }) {
  const { units, limit, encoding, segments } = measureSmsBody(body);
  const cap = profile.maxSegments ?? 1;
  const exceeded = units > limit && segments > cap;
  return (
    <p
      data-slot="sms-meter"
      data-problem={exceeded ? 'sms-segment-exceeded' : undefined}
      aria-live="polite"
      className={cn('text-muted-foreground text-sm tabular-nums', exceeded && 'text-destructive', className)}
    >
      <span data-slot="sms-meter-count">{`${units} / ${limit} ${ENCODING_LABELS[encoding]}${cap > 1 ? ` - ${segments} of ${cap} segments` : ''}`}</span>
      {exceeded && (
        <span data-slot="sms-meter-message"> {problemMessage({ kind: 'sms-segment-exceeded', block: null })}</span>
      )}
    </p>
  );
}
