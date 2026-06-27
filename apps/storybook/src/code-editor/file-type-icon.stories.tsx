import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileTypeIcon } from '@zeroxsolutions/ui/file-type-icon';

const meta: Meta<typeof FileTypeIcon> = {
  title: 'Code Editor/FileTypeIcon',
  component: FileTypeIcon,
};
export default meta;

type Story = StoryObj<typeof FileTypeIcon>;

const NAMES = [
  'SKILL.md',
  'manifest.json',
  'config.yaml',
  'run.py',
  'app.tsx',
  'styles.css',
  'logo.png',
  'diagram.svg',
  'Inter.woff2',
  'intro.mp3',
  'demo.mp4',
  'bundle.zip',
  'dataset.bin',
];

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
      {NAMES.map((name) => (
        <div key={name} className="flex items-center gap-2">
          <FileTypeIcon name={name} className="size-4 text-muted-foreground" />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};
