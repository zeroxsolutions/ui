import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Calendar } from '@zeroxsolutions/ui/calendar';

/**
 * `Calendar` is a date-selection grid built on react-day-picker's `DayPicker`,
 * styled to match the design system. Selection is controlled through `selected`
 * and `onSelect`, while `captionLayout` switches month/year navigation between a
 * static label and interactive dropdowns. The stories keep the selected date in
 * local state to drive the controlled grid.
 */
const meta: Meta<typeof Calendar> = {
  title: 'Primitives/Calendar',
  component: Calendar,
};
export default meta;

type Story = StoryObj<typeof Calendar>;

/** Single-date selection with the default label caption, driven by local state. */
export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md"
      />
    );
  },
};

/** Uses `captionLayout="dropdown"` to expose month and year as selectable dropdowns. */
export const WithDropdownCaption: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        captionLayout="dropdown"
        selected={date}
        onSelect={setDate}
        className="rounded-md"
      />
    );
  },
};
