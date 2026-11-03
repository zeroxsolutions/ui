import { createContext, useContext } from 'react';

interface ReasoningCollapsibleContextValue {
  streaming: boolean;
  isOpen: boolean;
  /** Whole seconds the last stream lasted, rounded up; undefined until a stream has ended. */
  duration: number | undefined;
}

const ReasoningCollapsibleContext = createContext<ReasoningCollapsibleContextValue | null>(null);

/**
 * Read the live reasoning state (`streaming`, `isOpen`, `duration`) from inside a
 * `<ReasoningCollapsible>`, for example to word the trigger's label. Throws when
 * used outside `<ReasoningCollapsible>`.
 */
function useReasoningCollapsible(): ReasoningCollapsibleContextValue {
  const ctx = useContext(ReasoningCollapsibleContext);
  if (!ctx) throw new Error('ReasoningCollapsible parts must be used within <ReasoningCollapsible>');
  return ctx;
}

export { ReasoningCollapsibleContext, useReasoningCollapsible };
export type { ReasoningCollapsibleContextValue };
