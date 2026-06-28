import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileTypeIcon } from '@zeroxsolutions/ui/components/file-type-icon';

/**
 * `FileTypeIcon` renders a lucide icon chosen from a file name's extension
 * (`run.py` → code, `logo.png` → image, `Inter.woff2` → type, unknown → a generic
 * file). It is decorative, so pair it with the visible file name that supplies the
 * accessible label, or pass `aria-label` when it stands alone; all `LucideProps`
 * (`size`, `className`, `aria-*`) pass through. The story enumerates
 * representative names to show the extension-to-icon mapping.
 */
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

/**
 * A grid of representative file names, each beside the icon its extension resolves
 * to — code, structured data, image, font, audio, video, archive, and binary.
 */
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
