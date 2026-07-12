'use client';

import { useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Download, Image as ImageIcon, Workflow } from 'lucide-react';
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@zeroxsolutions/ui/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/dropdown-menu';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import { detectDiagramType, DIAGRAM_TYPE_LABEL } from '../core/detect.js';
import { copySvg, copyText, downloadPng, downloadSvg } from '../core/export.js';
import { DIAGRAM_TEMPLATES } from '../core/templates.js';

export interface MermaidToolbarProps {
  source: string;
  /** The current rendered SVG, for export (empty until the first render). */
  svg: string;
  /** Replace the source with a chosen template. */
  onPickTemplate: (source: string) => void;
  className?: string;
}

/**
 * The standalone surface's toolbar: the detected diagram type + a template
 * picker on the left, an export menu on the right — all composed from
 * `@zeroxsolutions/ui`. Choosing a template while the source is non-empty asks
 * for confirmation (a design-system `AlertDialog`) before replacing it. Export
 * feedback is inline (a transient check), so no toast dependency is added.
 */
export function MermaidToolbar({ source, svg, onPickTemplate, className }: MermaidToolbarProps) {
  const type = detectDiagramType(source);
  const hasContent = source.trim().length > 0;
  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pickTemplate = (templateSource: string) => {
    if (hasContent) setPending(templateSource);
    else onPickTemplate(templateSource);
  };

  const runExport = (action: () => void | Promise<void>) => {
    void Promise.resolve(action())
      .then(() => {
        setDone(true);
        clearTimeout(doneTimer.current);
        doneTimer.current = setTimeout(() => setDone(false), 1500);
      })
      .catch(() => {
        /* best-effort — clipboard/download may be denied */
      });
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b bg-card px-2 py-1.5',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Workflow className="size-4" />
        <span>{DIAGRAM_TYPE_LABEL[type]}</span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="xs">
                Templates
                <ChevronDown />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Insert a starter diagram</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DIAGRAM_TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.type}
                onClick={() => pickTemplate(template.source)}
              >
                {template.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={!svg}>
              {done ? <Check /> : <Download />}
              Export
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => runExport(() => copyText(source))}>
            <Copy />
            Copy source
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runExport(() => copySvg(svg))}>
            <Copy />
            Copy SVG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => runExport(() => downloadSvg(svg))}>
            <Download />
            Download SVG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runExport(() => downloadPng(svg))}>
            <ImageIcon />
            Download PNG
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              Inserting this template will overwrite the diagram source you already have.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending !== null) onPickTemplate(pending);
                setPending(null);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
