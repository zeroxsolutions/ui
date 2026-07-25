'use client';

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@zeroxsolutions/ui/components/split-button';

import { ComponentPreview } from '@/components/component-preview';

/**
 * Isolated preview for `SplitButton`. Used by `registry-e2e` to verify - in a
 * real browser - that the ButtonGroup radius seam is intact: the action's
 * RIGHT corners and the caret's LEFT corners should be square (0px) while the
 * outer corners stay rounded. The seam relies on the Root retaining
 * `data-slot="button-group"` (the ButtonGroup primitive's slot), so the
 * descendant `in-data-[slot=button-group]` hooks match.
 */
export default function SplitButtonPreviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">SplitButton</h1>
      <ComponentPreview>
        <div className="flex flex-col items-start gap-6">
          <SplitButton aria-label="Allow">
            <SplitButtonAction>Action</SplitButtonAction>
            <SplitButtonMenu>
              <SplitButtonTrigger aria-label="More action options" />
              <SplitButtonContent>
                <SplitButtonItem onClick={() => {}}>Second</SplitButtonItem>
                <SplitButtonItem onClick={() => {}}>Third</SplitButtonItem>
              </SplitButtonContent>
            </SplitButtonMenu>
          </SplitButton>
        </div>
      </ComponentPreview>
    </main>
  );
}
