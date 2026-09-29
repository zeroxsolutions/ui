import type { ComponentType, ReactNode } from 'react';

/** One empty-state suggestion card. `prompt` is reported back when the card is picked; the rest is display. */
interface ChatSuggestion {
  /** Leading glyph (a lucide icon component, or any icon taking `className`). */
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  prompt: string;
}

export type { ChatSuggestion };
