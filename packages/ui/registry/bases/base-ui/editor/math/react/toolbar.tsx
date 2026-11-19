'use client';

import { useRef, useState } from 'react';
import { Sigma } from 'lucide-react';
import { CheckIcon } from '@/registry/bases/base-ui/icons/lucide/check-icon';
import { CopyIcon } from '@/registry/bases/base-ui/icons/lucide/copy-icon';
import { DownloadIcon } from '@/registry/bases/base-ui/icons/lucide/download-icon';
import { OmegaIcon } from '@/registry/bases/base-ui/icons/lucide/omega-icon';
import { usePlayWhile, useAnimatedIcon } from '@/registry/bases/base-ui/hooks/use-animated-icon';
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
  const insertPlay = useAnimatedIcon();
  const exportPlay = useAnimatedIcon();
  const copyLatexPlay = useAnimatedIcon();
  const copyMathMLPlay = useAnimatedIcon();
  const [done, setDone] = useState(false);
  // The check that replaces the download plays once as the export finishes.
  usePlayWhile(exportPlay.ref, done);
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
            <Button variant="ghost" size="sm" {...insertPlay.handlers}>
              <OmegaIcon ref={insertPlay.ref} aria-hidden />
              Insert
            </Button>
          }
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" disabled={!source.trim()} {...exportPlay.handlers}>
                {done ? (
                  <CheckIcon ref={exportPlay.ref} aria-hidden />
                ) : (
                  <DownloadIcon ref={exportPlay.ref} aria-hidden />
                )}
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
