import type { ReactNode } from 'react';

/**
 * Renders a single component in isolation - centered, framed, apart from page
 * chrome - so a docs page and the `registry-e2e` suite can exercise it on its
 * own. This is the sandbox that replaces Storybook's isolated canvas.
 */
export function ComponentPreview({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="component-preview"
      className="flex min-h-64 w-full items-center justify-center rounded-lg border bg-background p-10"
    >
      {children}
    </div>
  );
}
