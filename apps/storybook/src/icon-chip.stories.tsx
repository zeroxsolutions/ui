import type { Meta, StoryObj } from '@storybook/react-vite';
import { Atom, AudioLines, Eye, Image as ImageIcon, Wrench } from 'lucide-react';

import { IconChip } from '@zeroxsolutions/ui/components/icon-chip';

/**
 * `IconChip` is a generic tinted-icon-plus-tooltip chip: a small square holding
 * a consumer-supplied `icon`, coloured by a consumer `tint` class, with `label`
 * shown on hover (and used as the accessible name). It ships no capability
 * taxonomy - the caller decides what each chip means, so one visual serves
 * model abilities, generation types, or any icon/label/tint triple.
 */
const meta: Meta<typeof IconChip> = {
  title: 'Components/IconChip',
  component: IconChip,
};
export default meta;

type Story = StoryObj<typeof IconChip>;

/** A row of tinted chips - the consumer owns the icon, label, and tint. */
export const Gallery: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconChip
        icon={<Eye className="size-3" />}
        label="Vision input"
        tint="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      />
      <IconChip
        icon={<Atom className="size-3" />}
        label="Reasoning"
        tint="bg-violet-500/15 text-violet-600 dark:text-violet-400"
      />
      <IconChip
        icon={<Wrench className="size-3" />}
        label="Function calling"
        tint="bg-blue-500/15 text-blue-600 dark:text-blue-400"
      />
      <IconChip
        icon={<AudioLines className="size-3" />}
        label="Audio input"
        tint="bg-amber-500/15 text-amber-600 dark:text-amber-400"
      />
      <IconChip
        icon={<ImageIcon className="size-3" />}
        label="Image output"
        tint="bg-pink-500/15 text-pink-600 dark:text-pink-400"
      />
    </div>
  ),
};
