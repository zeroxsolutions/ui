'use client';

import { useState } from 'react';
import { Disclosure } from '@/registry/bases/base-ui/components/disclosure';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/registry/bases/base-ui/ui/resizable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/registry/bases/base-ui/ui/tabs';
import { useIsMobile } from '@/registry/bases/base-ui/hooks/use-mobile';
import { CodeMirrorPane } from '../../shared/code-mirror/index.js';
import type { MathEditorProps } from '@zeroxsolutions/editor-core/math/core/types';
import { FormulaPreview } from './preview.js';
import { MathToolbar } from './toolbar.js';

/**
 * `<MathEditor>` - the standalone KaTeX authoring surface: a LaTeX source pane
 * (the in-package `CodeMirrorPane`, `language="latex"`) beside a live formula
 * preview, inside the house `Disclosure` compound in its `muted` variant - the
 * same borderless muted chrome the in-document code-block and mermaid block
 * compose, so this surface reads identically to them. Controlled the same way as
 * `CodeMirrorPane` (`value`/`defaultValue`/`onValueChange`), so any host can own
 * the source. `layout='auto'` splits side-by-side on wide viewports and switches
 * to tabs on narrow ones. Every part is composed from `the ui registry`; there
 * is no bespoke surface (a formula is static). KaTeX renders synchronously, so the
 * preview updates on each edit with no manual render step.
 *
 * NOTE - the palette inserts by appending to the source: `CodeMirrorPane` exposes
 * no imperative caret API, so caret-in-hole insertion is honored by the inline
 * in-flow editor (a native input) rather than here.
 */
export function MathEditor({
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  layout = 'auto',
  toolbar = true,
  className,
}: MathEditorProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const source = isControlled ? value : internal;

  const setSource = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };
  const insert = (snippet: string) => setSource(source + snippet);

  const isMobile = useIsMobile();
  const useTabs = layout === 'tabs' || (layout === 'auto' && isMobile);

  const codePane = (
    <CodeMirrorPane
      value={source}
      onValueChange={setSource}
      readOnly={readOnly}
      language="latex"
      placeholder="Write LaTeX source..."
      className="h-full"
    />
  );
  const preview = <FormulaPreview source={source} className="h-full" />;

  return (
    <Disclosure variant="muted" data-slot="math-editor" className={className}>
      {toolbar && <MathToolbar source={source} onInsert={insert} />}

      <div className="flex h-[28rem] min-h-0 flex-col overflow-hidden">
        {useTabs ? (
          <Tabs defaultValue="source" className="min-h-0 flex-1">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="source" className="min-h-0 flex-1 p-2 pt-0">
              {codePane}
            </TabsContent>
            <TabsContent value="preview" className="min-h-0 flex-1 p-2 pt-0">
              {preview}
            </TabsContent>
          </Tabs>
        ) : (
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel defaultSize={45} minSize={20}>
              {codePane}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55} minSize={20}>
              {preview}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </Disclosure>
  );
}
