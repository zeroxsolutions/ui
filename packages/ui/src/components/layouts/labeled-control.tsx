import type { ReactNode } from 'react';

/**
 * A label above a full-width control — the row layout for inputs that don't
 * carry their own inline label (a colour swatch, a custom picker). Pairs with
 * inline-labeled fields so a property section can mix both and stay aligned.
 */
export function LabeledControl({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
