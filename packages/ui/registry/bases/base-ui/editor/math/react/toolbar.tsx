'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Omega, Sigma } from 'lucide-react';
import { CheckIcon } from '@/registry/bases/base-ui/icons/check-icon';
import { CopyIcon } from '@/registry/bases/base-ui/icons/copy-icon';
import { DownloadIcon } from '@/registry/bases/base-ui/icons/download-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
import { copyLatex, copyMathML } from '@zeroxsolutions/editor-core/math/core/export';
import { MathPalette } from './palette';

/** The handle every animated icon exposes. */
interface IconHandle {
  startAnimation(): void;
  stopAnimation(): void;
}

/** A control's ref to its icon, and the pointer and focus handlers that play it. */
function useIconPlay() {
  const ref = useRef<IconHandle>(null);
  return {
    ref,
    handlers: {
      onPointerEnter: () => ref.current?.startAnimation(),
      onPointerLeave: () => ref.current?.stopAnimation(),
      onFocus: () => ref.current?.startAnimation(),
      onBlur: () => ref.current?.stopAnimation(),
    },
  };
}

/** The icon of an Export button: a download, then a check that plays once as the export finishes. */
function ExportIcon({ done, iconRef }: { done: boolean; iconRef: RefObject<IconHandle | null> }) {
  useEffect(() => {
    if (done) iconRef.current?.startAnimation();
  }, [done, iconRef]);
  return done ? <CheckIcon ref={iconRef} aria-hidden /> : <DownloadIcon ref={iconRef} aria-hidden />;
}

export interface MathToolbarProps {
  /** The current LaTeX source, for export. */
  source: string;
  /** Insert a snippet at the caret (the palette). */
  onInsert: (snippet: string, caretOffset?: number) => void;
  className?: string;
}

/**
 * The standalone surface's header - the house `CollapsibleCardHeader` compound, not a
 * bespoke bar. Where the mermaid toolbar puts a diagram-type `Combobox` in the
 * title, math has no "type": the title is a static `Math` label and the palette is
 * the star, so the palette (a `Popover` + `Command` inserter) and the export menu
 * fill the actions. Export feedback is inline (a transient check), so no toast
 * dependency is added. Renders the header parts only; `MathEditor` owns the
 * enclosing `CollapsibleCard` and its body.
 */
export function MathToolbar({ source, onInsert, className }: MathToolbarProps) {
  const exportPlay = useIconPlay();
  const copyLatexPlay = useIconPlay();
  const copyMathMLPlay = useIconPlay();
  const [done, setDone] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runExport = (action: () => Promise<void>) => {
    void action()
      .then(() => {
        setDone(true);
        clearTimeout(doneTimer.current);
        doneTimer.current = setTimeout(() => setDone(false), 1500);
      })
      .catch(() => {
        /* best-effort - clipboard may be denied */
      });
  };

  return (
    <CollapsibleCardHeader className={className}>
      <CollapsibleCardTitle>
        <Sigma className="shrink-0" />
        <span>Math</span>
      </CollapsibleCardTitle>

      <CollapsibleCardActions>
        <MathPalette
          onInsert={onInsert}
          trigger={
            <Button variant="ghost" size="sm">
              <Omega />
              Insert
            </Button>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" disabled={!source.trim()} {...exportPlay.handlers}>
                <ExportIcon done={done} iconRef={exportPlay.ref} />
                Export
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => runExport(() => copyLatex(source))} {...copyLatexPlay.handlers}>
                <CopyIcon ref={copyLatexPlay.ref} aria-hidden />
                Copy LaTeX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => runExport(() => copyMathML(source))} {...copyMathMLPlay.handlers}>
                <CopyIcon ref={copyMathMLPlay.ref} aria-hidden />
                Copy MathML
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CollapsibleCardActions>
    </CollapsibleCardHeader>
  );
}
