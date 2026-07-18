import { Button } from '@zeroxsolutions/ui/components/ui/button';

import { ComponentPreview } from '@/components/component-preview';

/** Isolated preview page for the `Button` primitive - the first registry sample
 *  and the surface `registry-e2e` drives to cover interaction/visual. */
export default function ButtonPreviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">Button</h1>
      <ComponentPreview>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </ComponentPreview>
    </main>
  );
}
