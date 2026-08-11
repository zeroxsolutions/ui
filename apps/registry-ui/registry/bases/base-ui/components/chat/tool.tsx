import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  type LucideIcon,
  Wrench,
  XCircle,
} from 'lucide-react';
import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/bases/base-ui/ui/collapsible';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { cn } from '@/registry/bases/base-ui/lib/utils';

import { CodeBlock } from '@/registry/bases/base-ui/components/code-block';

/**
 * Tool — a tool-invocation card built on the SDK `Collapsible` + `Badge`. One
 * card with a header row (icon · title · status badge · chevron) and a content
 * area separated by a top `Separator`; `ToolInput`/`ToolOutput` render JSON via
 * `CodeBlock`. Presentational — the host maps its dispatcher lifecycle onto
 * `ToolState` (pending → running → completed → error) and supplies title/icon/
 * input/output.
 *
 *   <Tool>
 *     <ToolHeader state={state} title="search" subtitle={summary} icon={Icon} />
 *     <ToolContent>
 *       <ToolInput input={params} />
 *       <ToolOutput output={result} errorText={error} />
 *     </ToolContent>
 *   </Tool>
 */
export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

export type ToolPart = { state: ToolState };

export function Tool({
  className,
  ...props
}: ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible
      className={cn(
        'my-2 w-full overflow-hidden rounded-md bg-muted',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Per-state status cue (icon + tone) and the default visible word. The icon and
 * tone are fixed; the word is overridable per call-site via `ToolHeader.statusLabel`.
 */
const STATUS: Record<ToolState, { label: string; icon: ReactNode }> = {
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

export interface ToolHeaderProps {
  /** Display title; falls back to `toolName`, then a derived `type`. */
  title?: string;
  /** Human-readable one-line summary of the call, shown muted after the name. */
  subtitle?: string;
  /** Leading glyph; the host resolves it (e.g. via a `toolIcon` map). Defaults to `Wrench`. */
  icon?: LucideIcon;
  state: ToolState;
  toolName?: string;
  type?: string;
  /** Visible word in the status badge; defaults to the per-state `STATUS` label. */
  statusLabel?: ReactNode;
  /** Visible fallback name when none of title/toolName/type resolve one. Defaults to `'tool'`. */
  fallbackLabel?: ReactNode;
  className?: string;
}

export function ToolHeader({
  title,
  subtitle,
  icon,
  state,
  toolName,
  type,
  statusLabel,
  fallbackLabel = 'tool',
  className,
}: ToolHeaderProps) {
  const name =
    title ??
    toolName ??
    (type ? type.split('-').slice(1).join('-') : fallbackLabel);
  const status = STATUS[state];
  const Icon = icon ?? Wrench;
  return (
    <CollapsibleTrigger
      className={cn(
        'group/tool flex w-full items-center gap-2 px-3 py-2 text-left',
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-sm font-medium">{name}</span>
      {subtitle ? (
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      ) : (
        <span className="flex-1" />
      )}
      <Badge
        variant="secondary"
        className="shrink-0 gap-1 rounded-full text-[10px]"
      >
        {status.icon}
        {statusLabel ?? status.label}
      </Badge>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded/tool:rotate-180" />
    </CollapsibleTrigger>
  );
}

export function ToolContent({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent {...props}>
      <Separator />
      <div
        className={cn('space-y-3 px-3 py-3 text-popover-foreground', className)}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

function ToolLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-xs font-medium text-muted-foreground">{children}</h4>
  );
}

export function ToolInput({
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
      <ToolLabel>{label}</ToolLabel>
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  );
}

export function ToolOutput({
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
      body = (
        <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
      );
    } else {
      body = <CodeBlock code={String(output)} language="json" />;
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <ToolLabel>{errorText ? errorLabel : resultLabel}</ToolLabel>
      {errorText ? (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorText}
        </div>
      ) : (
        body
      )}
    </div>
  );
}
