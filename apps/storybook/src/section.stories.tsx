import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Section } from '@chiselart/ui/section';

const meta: Meta<typeof Section> = {
  title: 'Layouts/Section',
  component: Section,
};
export default meta;

type Story = StoryObj<typeof Section>;

export const Collapsible: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="w-72 rounded-md bg-card ring-1 ring-foreground/10">
        <Section
          title="Effects"
          count={2}
          open={open}
          onToggle={() => setOpen((v) => !v)}
          onAdd={() => {}}
        >
          <div className="rounded bg-muted/60 px-2 py-1.5 text-sm">
            Drop shadow
          </div>
          <div className="rounded bg-muted/60 px-2 py-1.5 text-sm">
            Layer blur
          </div>
        </Section>
      </div>
    );
  },
};

export const Static: Story = {
  render: () => (
    <div className="w-72 rounded-md bg-card ring-1 ring-foreground/10">
      <Section title="Export">
        <div className="rounded bg-muted/60 px-2 py-1.5 text-sm">PNG · 2x</div>
      </Section>
    </div>
  ),
};

/** `addLabel` overrides the add button's tooltip (defaults to `Add {title}`). */
export const CustomAddLabel: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="w-72 rounded-md bg-card ring-1 ring-foreground/10">
        <Section
          title="Variables"
          count={1}
          open={open}
          onToggle={() => setOpen((v) => !v)}
          onAdd={() => {}}
          addLabel="New variable"
        >
          <div className="rounded bg-muted/60 px-2 py-1.5 text-sm">
            primary-color
          </div>
        </Section>
      </div>
    );
  },
};
