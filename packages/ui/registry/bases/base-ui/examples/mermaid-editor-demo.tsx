'use client';

import type { ReactNode } from 'react';

import { MermaidEditor } from '@/registry/bases/base-ui/editor/mermaid/react/editor';

const source = `flowchart LR
  Hanoi --> Ninh_Binh --> Hue --> Hoi_An --> Saigon`;

/** The standalone Mermaid surface: a source pane beside the drawn diagram, under a template menu. */
function MermaidEditorDemo(): ReactNode {
  return (
    <div className="w-full max-w-2xl">
      <MermaidEditor defaultValue={source} />
    </div>
  );
}

export { MermaidEditorDemo };
