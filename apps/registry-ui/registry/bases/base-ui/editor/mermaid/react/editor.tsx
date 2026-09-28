'use client';

import { useState } from 'react';
import { Disclosure } from '@/registry/bases/base-ui/components/layout/disclosure';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/registry/bases/base-ui/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { useIsMobile } from '@/registry/bases/base-ui/hooks/use-mobile';
import { CodeMirrorPane } from '../../shared/code-mirror/index.js';
import type { MermaidEditorProps } from '@zeroxsolutions/editor-core/mermaid/core/types';
import { DiagramCanvas } from './preview.js';
import { MermaidToolbar } from './toolbar.js';
import { useMermaidRender } from './use-mermaid-render.js';

/**
 * `<MermaidEditor>` — the standalone Mermaid authoring surface: a source pane
 * (the in-package `CodeMirrorPane`) beside a live pan/zoom preview, inside the
 * house `Disclosure` compound in its `muted` variant — the same borderless muted
 * chrome the in-document code-block and Mermaid block compose, so this surface
 * reads identically to them: a header (a type/template switcher + export) over the
 * body. A Mermaid block never collapses, so `Disclosure` supplies the header
 * structure and the surface container, not a collapse toggle. Controlled the same way as
 * `CodeMirrorPane` (`value`/`defaultValue`/`onValueChange`), so any host can own
 * the source. `layout='auto'` splits side-by-side on wide viewports and switches
 * to tabs on narrow ones. Everything but the pan/zoom viewport is composed from
 * `the ui registry`; the Mermaid engine is loaded lazily by the render hook.
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
    <CodeMirrorPane
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
    <Disclosure variant="muted" data-slot="mermaid-editor" className={className}>
      {toolbar && <MermaidToolbar source={source} svg={state.svg} onPickTemplate={setSource} />}

      <div className="flex h-[28rem] min-h-0 flex-col overflow-hidden">
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
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
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
    </Disclosure>
  );
}
