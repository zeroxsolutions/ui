import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface ModelInfoCardProps extends React.ComponentProps<'div'> {
  /** Leading logo slot, rendered verbatim (e.g. an `AiProviderIcon`). */
  media?: React.ReactNode;
  /** Model display name. */
  name: React.ReactNode;
  /** Model vendor / maker. */
  vendor?: React.ReactNode;
  /** The model id, shown mono under the identity. */
  modelId?: React.ReactNode;
}

/**
 * The detail panel for one model, meant for the shipped `HoverCardContent`: an
 * identity header (a logo slot, the model name over its vendor, and the mono
 * `modelId`) over a `children` body of `ModelInfoCardSection`s. Domain-free -
 * every value is a prop, slot, or child; the hover mechanism is the shipped
 * `HoverCard`, not a wrapper of its own.
 * @example <ModelInfoCard media={<AiProviderIcon provider="openai" />} name="GPT-4o" vendor="OpenAI" modelId="gpt-4o">{sections}</ModelInfoCard>
 */
function ModelInfoCard({ media, name, vendor, modelId, children, className, ...props }: ModelInfoCardProps) {
  return (
    <div data-slot="model-info-card" className={cn('flex flex-col gap-3', className)} {...props}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {media != null && <span className="flex shrink-0 items-center">{media}</span>}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            {vendor != null && <p className="text-muted-foreground truncate text-xs">{vendor}</p>}
          </div>
        </div>
        {modelId != null && <p className="text-muted-foreground truncate font-mono text-[11px]">{modelId}</p>}
      </div>
      {children}
    </div>
  );
}

interface ModelInfoCardSectionProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** Consumer class for the accent bar (background colour). The DS ships none. */
  accent?: string;
  /** Section title. */
  title: React.ReactNode;
  /** Optional trailing value (e.g. a context length). */
  value?: React.ReactNode;
}

/**
 * A titled section inside a `ModelInfoCard`: an accent bar (a consumer-classed
 * pill) and a `title` with an optional trailing `value`, over its `children`
 * (detail lines composed from the shipped `Item` + `IconChip`). The accent
 * colour is a consumer class, so the design system itself stays monochrome.
 */
function ModelInfoCardSection({ accent, title, value, children, className, ...props }: ModelInfoCardSectionProps) {
  return (
    <div data-slot="model-info-card-section" className={cn('flex flex-col gap-1.5', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className={cn('bg-muted-foreground h-3.5 w-1 rounded-full', accent)} />
          <span className="text-xs font-medium">{title}</span>
        </span>
        {value != null && <span className="text-muted-foreground text-xs tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export { ModelInfoCard, ModelInfoCardSection };
export type { ModelInfoCardProps, ModelInfoCardSectionProps };
