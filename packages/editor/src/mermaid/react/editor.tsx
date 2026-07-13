'use client';

import { useState } from 'react';
import { CodeEditorPane } from '@zeroxsolutions/ui/components/code-editor-pane';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@zeroxsolutions/ui/components/ui/resizable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@zeroxsolutions/ui/components/ui/tabs';
import { useIsMobile } from '@zeroxsolutions/ui/hooks/use-mobile';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import type { MermaidEditorProps } from '../core/types.js';
import { DiagramCanvas } from './preview.js';
import { MermaidToolbar } from './toolbar.js';
import { useMermaidRender } from './use-mermaid-render.js';

/**
 * `<MermaidEditor>` — the standalone Mermaid authoring surface: a source pane
 * (the design system's `CodeEditorPane`) beside a live pan/zoom preview, with a
 * toolbar for the diagram type, templates, and export. Controlled the same way as
 * `CodeEditorPane` (`value`/`defaultValue`/`onValueChange`), so any host can own
 * the source. `layout='auto'` splits side-by-side on wide viewports and switches
 * to tabs on narrow ones. Everything but the pan/zoom viewport is composed from
 * `@zeroxsolutions/ui`; the Mermaid engine is loaded lazily by the render hook.
 */
export function MermaidEditor({
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  layout = 'auto',
  toolbar = true,
  className,
}: MermaidEditorProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const source = isControlled ? value : internal;

  const setSource = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  const state = useMermaidRender(source);
  const isMobile = useIsMobile();
  const useTabs = layout === 'tabs' || (layout === 'auto' && isMobile);

  const codePane = (
    <CodeEditorPane
      value={source}
      onValueChange={setSource}
      readOnly={readOnly}
      language="mermaid"
      placeholder="Write Mermaid source…"
      className="h-full"
    />
  );
  const canvas = <DiagramCanvas state={state} className="h-full rounded-none border-0" />;

  return (
    <div
      data-slot="mermaid-editor"
      className={cn(
        'flex h-[28rem] flex-col overflow-hidden rounded-lg border bg-card',
        className,
      )}
    >
      {toolbar && (
        <MermaidToolbar source={source} svg={state.svg} onPickTemplate={setSource} />
      )}

      {useTabs ? (
        <Tabs defaultValue="code" className="min-h-0 flex-1">
          <TabsList className="mx-2 mt-2">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="min-h-0 flex-1 p-2 pt-0">
            {codePane}
          </TabsContent>
          <TabsContent value="preview" className="min-h-0 flex-1 p-2 pt-0">
            {canvas}
          </TabsContent>
        </Tabs>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize={45} minSize={20}>
            {codePane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={20}>
            {canvas}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
