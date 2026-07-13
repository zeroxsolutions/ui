import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  FileContentRouter,
  type RoutedFile,
} from '@zeroxsolutions/editor/code/file-content-router';

// A self-contained SVG asset (no network) for the image route.
const SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" rx="12" fill="%236366f1"/><circle cx="80" cy="60" r="34" fill="white" opacity="0.85"/></svg>',
)}`;

const FILES: RoutedFile[] = [
  {
    path: 'scripts/run.py',
    view: 'code',
    language: 'python',
    text: 'def main():\n    print("hello from a routed code file")\n\n\nmain()\n',
  },
  {
    path: 'README.md',
    view: 'markdown',
    text: '# Routed Markdown\n\nThe router sends `.md` here when you ask for the **preview** view.\n\n- one\n- two\n',
  },
  { path: 'assets/logo.svg', view: 'image', src: SVG, alt: 'Logo' },
  {
    path: 'assets/Inter.woff2',
    view: 'font',
    src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2',
  },
  { path: 'data/model.bin', view: 'binary' },
];

/**
 * `FileContentRouter` picks the right viewer for an already-classified
 * `RoutedFile`, switching on its `view` discriminant: code to an editor pane,
 * markdown to a rendered preview, images and fonts to their previews, and
 * everything else to a binary fallback card. It carries no app knowledge and
 * fills the space it is given, so the stories supply a fixed-size frame and a set
 * of sample files. Use it as the content area of a file browser once upstream
 * code has decided how each file should be shown.
 */
const meta: Meta<typeof FileContentRouter> = {
  title: 'Code Editor/FileContentRouter',
  component: FileContentRouter,
};
export default meta;

type Story = StoryObj<typeof FileContentRouter>;

/**
 * Routes one sample file per `view` kind — code, markdown, image, font, and
 * binary — switched live via the path buttons to show each viewer in turn.
 */
export const ByType: Story = {
  render: () => {
    const [active, setActive] = React.useState(0);
    return (
      <div className="flex w-[640px] flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {FILES.map((file, i) => (
            <Button
              key={file.path}
              size="sm"
              variant={i === active ? 'default' : 'outline'}
              onClick={() => setActive(i)}
            >
              {file.path}
            </Button>
          ))}
        </div>
        <div className="h-[360px] overflow-hidden rounded-lg border border-border">
          <FileContentRouter file={FILES[active]} />
        </div>
      </div>
    );
  },
};
