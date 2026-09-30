'use client';

import { useRef, type ReactNode } from 'react';

import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from '@/registry/bases/base-ui/components/layout/panel-header';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { PanelLeftCloseIcon, type PanelLeftCloseIconHandle } from '@/registry/bases/base-ui/ui/panel-left-close';

/** A single-row panel header: a title beside a trailing collapse action. */
function PanelHeaderDemo(): ReactNode {
  const iconRef = useRef<PanelLeftCloseIconHandle>(null);

  return (
    <PanelHeader className="bg-card w-full max-w-sm">
      <PanelHeaderRow>
        <PanelHeaderTitle>Properties</PanelHeaderTitle>
        <PanelHeaderActions>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse panel"
            onMouseEnter={() => iconRef.current?.startAnimation()}
            onMouseLeave={() => iconRef.current?.stopAnimation()}
            onFocus={() => iconRef.current?.startAnimation()}
            onBlur={() => iconRef.current?.stopAnimation()}
          >
            <PanelLeftCloseIcon ref={iconRef} aria-hidden />
          </Button>
        </PanelHeaderActions>
      </PanelHeaderRow>
    </PanelHeader>
  );
}

export { PanelHeaderDemo };
