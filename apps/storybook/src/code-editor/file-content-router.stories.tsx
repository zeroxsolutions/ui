import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  FileContentRouter,
  type RoutedFile,
} from '@chiselart/ui/file-content-router';
import { Button } from '@chiselart/ui/button';

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

const meta: Meta<typeof FileContentRouter> = {
  title: 'Code Editor/FileContentRouter',
  component: FileContentRouter,
};
export default meta;

type Story = StoryObj<typeof FileContentRouter>;

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
