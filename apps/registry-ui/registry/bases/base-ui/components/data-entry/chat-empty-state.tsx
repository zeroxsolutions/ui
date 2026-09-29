import { type ReactNode } from 'react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/registry/bases/base-ui/ui/empty';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { ChatSuggestion } from '@/registry/bases/base-ui/types/chat-suggestion';

/**
 * ChatEmptyState — the starter shown in an empty conversation: a centered
 * header (icon + title + description) over an optional column of clickable
 * suggestion cards. Picking a card reports its `prompt` through
 * `onSelectPrompt`; when no handler is given the cards render disabled (a
 * read-only preview).
 *
 * All copy is the consumer's — `icon`, `title`, `description`, and the
 * `suggestions` set come in as props (no baked strings). Internal centering +
 * padding is the component's identity; place it with the surrounding container.
 */
interface ChatEmptyStateProps {
  /** Leading glyph for the header (e.g. a lucide icon element). */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  suggestions?: readonly ChatSuggestion[];
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
}

function ChatEmptyState({ icon, title, description, suggestions, onSelectPrompt, className }: ChatEmptyStateProps) {
  const disabled = !onSelectPrompt;
  return (
    <Empty className={cn('p-6', className)}>
      <EmptyHeader>
        {icon && <EmptyMedia variant="icon">{icon}</EmptyMedia>}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {suggestions && suggestions.length > 0 && (
        <EmptyContent>
          <ItemGroup className="w-full gap-0.5">
            {suggestions.map(({ icon: Icon, title: t, description: d, prompt }) => (
              <Item
                key={prompt}
                size="sm"
                render={
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectPrompt?.(prompt)}
                    className="hover:bg-muted w-full cursor-pointer text-left disabled:cursor-default disabled:opacity-60"
                  />
                }
              >
                {Icon && (
                  <ItemMedia>
                    <Icon className="text-muted-foreground size-4" aria-hidden />
                  </ItemMedia>
                )}
                <ItemContent>
                  <ItemTitle>{t}</ItemTitle>
                  {d && <ItemDescription>{d}</ItemDescription>}
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </EmptyContent>
      )}
    </Empty>
  );
}

export { ChatEmptyState };
export type { ChatEmptyStateProps };
