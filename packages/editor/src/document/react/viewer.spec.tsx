import { render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { defineFeature } from '../core/index.js';
import type { DocJSON } from '../core/index.js';
import { useEditorTheme } from '../../shared/theme/editor-theme-context.js';
import { Viewer } from './viewer.js';
import { ViewerLive } from './viewer-live.js';

const badge = defineFeature({
  id: 'badge',
  nodes: [
    { name: 'badge', group: 'block', atom: true, attrs: z.object({ label: z.string() }) },
  ],
  codecs: [
    {
      node: 'badge',
      toReact: (node) => <span className="badge">{String(node.attrs?.label)}</span>,
    },
  ],
});

const doc: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
    { type: 'badge', attrs: { label: 'NEW' } },
  ],
};

function ModeLabel() {
  const { mode } = useEditorTheme();
  return <span data-mode={mode}>{mode}</span>;
}
const modeFeature = defineFeature({
  id: 'mode',
  nodes: [{ name: 'mode', group: 'block', atom: true }],
  codecs: [{ node: 'mode', toReact: () => <ModeLabel /> }],
});

describe('editor viewers', () => {
  it('static Viewer renders JSON to HTML server-side, via feature codecs, no engine', () => {
    const html = renderToStaticMarkup(<Viewer doc={doc} features={[badge]} />);
    expect(html).toContain('hi');
    expect(html).toContain('class="badge"');
    expect(html).toContain('NEW');
  });

  it('themes the Viewer independently of any editing surface', () => {
    const modeDoc: DocJSON = { type: 'doc', content: [{ type: 'mode' }] };
    const html = renderToStaticMarkup(
      <Viewer doc={modeDoc} features={[modeFeature]} forcedMode="dark" />,
    );
    expect(html).toContain('data-mode="dark"');
  });

  it('read-only live Viewer mounts a non-editable engine surface', async () => {
    const { container } = render(
      <ViewerLive
        content={{
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'readonly' }] }],
        }}
      />,
    );
    await waitFor(() => {
      expect(container.querySelector('[contenteditable="false"]')).not.toBeNull();
    });
    expect(container.textContent).toContain('readonly');
  });
});
