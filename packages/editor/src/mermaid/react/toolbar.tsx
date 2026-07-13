'use client';

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
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@zeroxsolutions/ui/components/ui/combobox';
import {
  DisclosureActions,
  DisclosureHeader,
  DisclosureTitle,
} from '@zeroxsolutions/ui/components/disclosure';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/dropdown-menu';
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Workflow,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { detectDiagramType, DIAGRAM_TYPE_LABEL } from '../core/detect.js';
import { copySvg, copyText, downloadPng, downloadSvg } from '../core/export.js';
import { DIAGRAM_TEMPLATES } from '../core/templates.js';
import type { DiagramTemplate } from '../core/types.js';

export interface MermaidToolbarProps {
  source: string;
  /** The current rendered SVG, for export (empty until the first render). */
  svg: string;
  /** Replace the source with a chosen template. */
  onPickTemplate: (source: string) => void;
  className?: string;
}

/** Mutable copy of the readonly template list — the `Combobox` `items` prop. */
const TEMPLATE_ITEMS: DiagramTemplate[] = [...DIAGRAM_TEMPLATES];

/**
 * The standalone surface's header — the house `DisclosureHeader` compound, not a
 * bespoke bar: a stateful `Combobox` type/template switcher (the
 * `LanguageSwitcher` pattern — it *displays* the active diagram type, unlike a
 * fire-and-forget menu) fills the title; the export menu fills the actions.
 * Choosing a template while the source is non-empty asks for confirmation (a
 * design-system `AlertDialog`) before replacing it. Export feedback is inline (a
 * transient check), so no toast dependency is added. Renders the header parts
 * only; `MermaidEditor` owns the enclosing `Disclosure` and its body.
 */
export function MermaidToolbar({
  source,
  svg,
  onPickTemplate,
  className,
}: MermaidToolbarProps) {
  const type = detectDiagramType(source);
  // The displayed selection: the template matching the detected type, or a
  // display-only option carrying the type's label when no template exists for it
  // (journey/timeline/quadrant/unknown) — so the switcher always shows the type.
  const current: DiagramTemplate =
    TEMPLATE_ITEMS.find((template) => template.type === type) ?? {
      type,
      label: DIAGRAM_TYPE_LABEL[type],
      source: '',
    };
  const hasContent = source.trim().length > 0;
  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

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
    <>
      <DisclosureHeader className={className}>
        <DisclosureTitle>
          <Combobox
            items={TEMPLATE_ITEMS}
            value={current}
            onValueChange={(template: DiagramTemplate | null) => {
              if (template) pickTemplate(template.source);
            }}
            itemToStringLabel={(template: DiagramTemplate) => template.label}
            isItemEqualToValue={(a: DiagramTemplate, b: DiagramTemplate) =>
              a?.type === b?.type
            }
          >
            <ComboboxTrigger
              render={<Button variant="ghost" size="sm" />}
              aria-label="Diagram type"
            >
              <Workflow />
              <span>{current.label}</span>
            </ComboboxTrigger>
            <ComboboxContent className="min-w-56">
              <ComboboxEmpty>No templates.</ComboboxEmpty>
              <ComboboxList>
                {(template: DiagramTemplate) => (
                  <ComboboxItem key={template.type} value={template}>
                    <span>{template.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </DisclosureTitle>

        <DisclosureActions>
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
        </DisclosureActions>
      </DisclosureHeader>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              Inserting this template will overwrite the diagram source you
              already have.
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
    </>
  );
}
