'use client';

import { useRef, useState } from 'react';
import { Check, Copy, Download, Omega, Sigma } from 'lucide-react';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  DisclosureActions,
  DisclosureHeader,
  DisclosureTitle,
} from '@zeroxsolutions/ui/components/disclosure';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/dropdown-menu';
import { copyLatex, copyMathML } from '../core/export.js';
import { MathPalette } from './palette.js';

export interface MathToolbarProps {
  /** The current LaTeX source, for export. */
  source: string;
  /** Insert a snippet at the caret (the palette). */
  onInsert: (snippet: string, caretOffset?: number) => void;
  className?: string;
}

/**
 * The standalone surface's header - the house `DisclosureHeader` compound, not a
 * bespoke bar. Where the mermaid toolbar puts a diagram-type `Combobox` in the
 * title, math has no "type": the title is a static `Math` label and the palette is
 * the star, so the palette (a `Popover` + `Command` inserter) and the export menu
 * fill the actions. Export feedback is inline (a transient check), so no toast
 * dependency is added. Renders the header parts only; `MathEditor` owns the
 * enclosing `Disclosure` and its body.
 */
export function MathToolbar({ source, onInsert, className }: MathToolbarProps) {
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
    <DisclosureHeader className={className}>
      <DisclosureTitle>
        <Sigma className="shrink-0" />
        <span>Math</span>
      </DisclosureTitle>

      <DisclosureActions>
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
              <Button variant="outline" size="sm" disabled={!source.trim()}>
                {done ? <Check /> : <Download />}
                Export
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => runExport(() => copyLatex(source))}>
              <Copy />
              Copy LaTeX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runExport(() => copyMathML(source))}>
              <Copy />
              Copy MathML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DisclosureActions>
    </DisclosureHeader>
  );
}
