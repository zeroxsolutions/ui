import * as React from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/registry/bases/base-ui/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item'
import { Switch } from '@/registry/bases/base-ui/ui/switch'
import { cn } from '@/registry/bases/base-ui/lib/utils'

export interface ModelListItemProps
  extends Omit<React.ComponentProps<'div'>, 'id' | 'title'> {
  /** Primary line - the model display name. */
  name: React.ReactNode
  /** Secondary line under the name - the model id. */
  modelId?: React.ReactNode
  /** Leading logo slot, rendered verbatim (e.g. an `AiProviderIcon`). */
  media?: React.ReactNode
  /** Meta region before the controls - capability / token chips. */
  meta?: React.ReactNode
  /** Enable toggle state. Provide to render a `Switch`; omit `onEnabledChange`
   *  to render it read-only. */
  enabled?: boolean
  /** Called with the next enabled state when the toggle is activated. */
  onEnabledChange?: (enabled: boolean) => void
  /** Show a trailing remove control when provided. */
  onRemove?: () => void
  /** Extra trailing content, before the toggle (escape hatch). */
  action?: React.ReactNode
  /** Dim the item and disable the toggle - listed but unusable. */
  unavailable?: boolean
}

/**
 * One model as a horizontal list item, built on the shipped `Item`: a leading
 * media slot (the provider logo, e.g. an `AiProviderIcon`), the model name over
 * its id, a meta slot for capability / token chips, and trailing controls - an
 * optional enable `Switch` (from `enabled` / `onEnabledChange`) and remove
 * `Button` (from `onRemove`), plus an `action` escape hatch. Domain-free: it
 * imports no model or capability type; every value is a prop or a slot. An
 * `unavailable` model stays listed but is dimmed and its toggle disabled.
 * @example <ModelListItem name="GPT-4o" modelId="gpt-4o" media={<AiProviderIcon provider="openai" />} enabled onEnabledChange={setOn} />
 */
function ModelListItem({
  name,
  modelId,
  media,
  meta,
  enabled,
  onEnabledChange,
  onRemove,
  action,
  unavailable = false,
  className,
  ...props
}: ModelListItemProps) {
  return (
    <Item
      data-slot="model-list-item"
      size="sm"
      className={cn(unavailable && 'opacity-55', className)}
      {...props}
    >
      {media != null && <ItemMedia>{media}</ItemMedia>}
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        {modelId != null && <ItemDescription>{modelId}</ItemDescription>}
      </ItemContent>
      <ItemActions>
        {meta}
        {action}
        {enabled !== undefined && (
          <Switch
            checked={enabled}
            disabled={!onEnabledChange || unavailable}
            onCheckedChange={
              onEnabledChange
                ? (checked) => onEnabledChange(checked)
                : undefined
            }
          />
        )}
        {onRemove && (
          <Button
            aria-label="Remove model"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </ItemActions>
    </Item>
  )
}

export { ModelListItem }
