import { CheckCircle2, ChevronDown, Circle, Clock, type LucideIcon, Wrench, XCircle } from 'lucide-react';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { cn } from '@/registry/bases/base-ui/lib/utils';

import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';

/**
 * ToolCallCard — a tool-invocation card built on the SDK `Collapsible` + `Badge`. One
 * card with a header row (icon · title · status badge · chevron) and a content
 * area separated by a top `Separator`; `ToolCallCardInput`/`ToolCallCardOutput` render JSON via
 * `CodeBlock`. Presentational — the host maps its dispatcher lifecycle onto
 * `ToolCallCardState` (pending → running → completed → error) and supplies title/icon/
 * input/output.
 *
 *   <ToolCallCard>
 *     <ToolCallCardHeader state={state} title="search" subtitle={summary} icon={Icon} />
 *     <ToolCallCardContent>
 *       <ToolCallCardInput input={params} />
 *       <ToolCallCardOutput output={result} errorText={error} />
 *     </ToolCallCardContent>
 *   </ToolCallCard>
 */
type ToolCallCardState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

type ToolCallCardPart = { state: ToolCallCardState };

function ToolCallCard({ className, ...props }: ComponentProps<typeof Collapsible>) {
  return <Collapsible className={cn('bg-muted my-2 w-full overflow-hidden rounded-md', className)} {...props} />;
}

/**
 * Per-state status cue (icon + tone) and the default visible word. The icon and
 * tone are fixed; the word is overridable per call-site via `ToolCallCardHeader.statusLabel`.
 */
const STATUS: Record<ToolCallCardState, { label: string; icon: ReactNode }> = {
  'input-streaming': { label: 'Pending', icon: <Circle /> },
  'input-available': {
    label: 'Running',
    icon: <Clock className="animate-pulse" />,
  },
  'output-available': {
    label: 'Completed',
    icon: <CheckCircle2 className="text-success" />,
  },
  'output-error': {
    label: 'Error',
    icon: <XCircle className="text-destructive" />,
  },
};

interface ToolCallCardHeaderProps {
  /** Display title; falls back to `toolName`, then a derived `type`. */
  title?: string;
  /** Human-readable one-line summary of the call, shown muted after the name. */
  subtitle?: string;
  /** Leading glyph; the host resolves it (e.g. via a `toolIcon` map). Defaults to `Wrench`. */
  icon?: LucideIcon;
  state: ToolCallCardState;
  toolName?: string;
  type?: string;
  /** Visible word in the status badge; defaults to the per-state `STATUS` label. */
  statusLabel?: ReactNode;
  /** Visible fallback name when none of title/toolName/type resolve one. Defaults to `'tool'`. */
  fallbackLabel?: ReactNode;
  className?: string;
}

function ToolCallCardHeader({
  title,
  subtitle,
  icon,
  state,
  toolName,
  type,
  statusLabel,
  fallbackLabel = 'tool',
  className,
}: ToolCallCardHeaderProps) {
  const name = title ?? toolName ?? (type ? type.split('-').slice(1).join('-') : fallbackLabel);
  const status = STATUS[state];
  const Icon = icon ?? Wrench;
  return (
    <CollapsibleTrigger
      className={cn('group/tool-call-card flex w-full items-center gap-2 px-3 py-2 text-left', className)}
    >
      <Icon className="text-muted-foreground size-3.5 shrink-0" />
      <span className="shrink-0 text-sm font-medium">{name}</span>
      {subtitle ? (
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{subtitle}</span>
      ) : (
        <span className="flex-1" />
      )}
      <Badge variant="secondary" className="shrink-0 gap-1 rounded-full text-[10px]">
        {status.icon}
        {statusLabel ?? status.label}
      </Badge>
      <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-aria-expanded/tool-call-card:rotate-180" />
    </CollapsibleTrigger>
  );
}

function ToolCallCardContent({ className, children, ...props }: ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent {...props}>
      <Separator />
      <div className={cn('text-popover-foreground space-y-3 px-3 py-3', className)}>{children}</div>
    </CollapsibleContent>
  );
}

function ToolCallCardLabel({ children }: { children: ReactNode }) {
  return <h4 className="text-muted-foreground text-xs font-medium">{children}</h4>;
}

function ToolCallCardInput({
  input,
  label = 'Parameters',
  className,
}: {
  input: unknown;
  /** Section heading; defaults to `'Parameters'`. */
  label?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5 overflow-hidden', className)}>
      <ToolCallCardLabel>{label}</ToolCallCardLabel>
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  );
}

function ToolCallCardOutput({
  output,
  errorText,
  resultLabel = 'Result',
  errorLabel = 'Error',
  className,
}: {
  output: unknown;
  errorText?: string;
  /** Section heading for a successful result; defaults to `'Result'`. */
  resultLabel?: ReactNode;
  /** Section heading for an error; defaults to `'Error'`. */
  errorLabel?: ReactNode;
  className?: string;
}) {
  if (!output && !errorText) return null;

  let body: ReactNode = null;
  if (!errorText) {
    if (typeof output === 'string') {
      body = <CodeBlock code={output} language="json" />;
    } else if (isValidElement(output)) {
      body = output;
    } else if (output && typeof output === 'object') {
      body = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />;
    } else {
      body = <CodeBlock code={String(output)} language="json" />;
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <ToolCallCardLabel>{errorText ? errorLabel : resultLabel}</ToolCallCardLabel>
      {errorText ? (
        <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs">{errorText}</div>
      ) : (
        body
      )}
    </div>
  );
}

export { ToolCallCard, ToolCallCardHeader, ToolCallCardContent, ToolCallCardInput, ToolCallCardOutput };
export type { ToolCallCardState, ToolCallCardPart, ToolCallCardHeaderProps };
