'use client';

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@/registry/bases/base-ui/components/layout/split-button';

/** A divided control - primary action plus a caret menu - the SplitButton hero. */
export function SplitButtonHero() {
  return (
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
  );
}
