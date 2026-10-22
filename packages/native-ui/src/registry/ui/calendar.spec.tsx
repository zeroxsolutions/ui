import { fireEvent, render, screen } from '@testing-library/react-native';
import { es } from 'date-fns/locale/es';
import { useState, type ReactNode } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Calendar, type DateRange } from './calendar';

/** A Thursday, so October 2026 opens on today's weekday. */
const TODAY = new Date(2026, 9, 22);

function day(name: string): ReturnType<typeof screen.getByRole> {
  return screen.getByRole('button', { name });
}

async function press(name: string): Promise<void> {
  await fireEvent.press(day(name));
}

function Range(): ReactNode {
  const [range, setRange] = useState<DateRange | undefined>();
  return <Calendar mode="range" today={TODAY} selected={range} onSelect={setRange} />;
}

describe('Calendar', () => {
  it("draws the month's caption, its weekdays and its days, with the days either side of it", async () => {
    await render(<Calendar mode="single" today={TODAY} />);

    expect(screen.getByText('October 2026')).toBeOnTheScreen();
    expect(screen.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/).map((weekday) => weekday.props.children)).toEqual([
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
    ]);
    expect(day('Wednesday, September 30th, 2026')).toBeOnTheScreen();
    expect(day('Saturday, October 31st, 2026')).toBeOnTheScreen();
  });

  it('draws six weeks with fixedWeeks', async () => {
    await render(<Calendar mode="single" today={TODAY} fixedWeeks />);

    expect(day('Saturday, November 7th, 2026')).toBeOnTheScreen();
  });

  it('marks today', async () => {
    await render(<Calendar mode="single" today={TODAY} />);

    expect(day('Today, Thursday, October 22nd, 2026')).toBeOnTheScreen();
  });

  it('selects a pressed day and reports it, and a second press clears it', async () => {
    const onSelect = jest.fn();
    function Single(): ReactNode {
      const [date, setDate] = useState<Date | undefined>();
      return (
        <Calendar
          mode="single"
          today={TODAY}
          selected={date}
          onSelect={(next, trigger) => {
            onSelect(next, trigger);
            setDate(next);
          }}
        />
      );
    }
    await render(<Single />);

    await press('Monday, October 12th, 2026');
    expect(onSelect).toHaveBeenLastCalledWith(new Date(2026, 9, 12), new Date(2026, 9, 12));
    expect(day('Monday, October 12th, 2026, selected')).toBeSelected();

    await press('Monday, October 12th, 2026, selected');
    expect(onSelect).toHaveBeenLastCalledWith(undefined, new Date(2026, 9, 12));
    expect(day('Monday, October 12th, 2026')).not.toBeSelected();
  });

  it('holds its own selection without onSelect, and keeps a required one', async () => {
    await render(<Calendar mode="single" required today={TODAY} />);

    await press('Monday, October 12th, 2026');
    await press('Monday, October 12th, 2026, selected');

    expect(day('Monday, October 12th, 2026, selected')).toBeSelected();
  });

  it('selects and clears several days in multiple mode', async () => {
    await render(<Calendar mode="multiple" today={TODAY} />);

    await press('Monday, October 12th, 2026');
    await press('Friday, October 16th, 2026');
    await press('Monday, October 12th, 2026, selected');

    expect(day('Monday, October 12th, 2026')).not.toBeSelected();
    expect(day('Friday, October 16th, 2026, selected')).toBeSelected();
  });

  it('selects a range from two presses, the days between it marked', async () => {
    await render(<Range />);

    await press('Monday, October 12th, 2026');
    await press('Friday, October 16th, 2026');

    for (const name of ['Monday, October 12th', 'Wednesday, October 14th', 'Friday, October 16th']) {
      expect(day(`${name}, 2026, selected`)).toBeSelected();
    }
    expect(day('Saturday, October 17th, 2026')).not.toBeSelected();

    await press('Thursday, October 8th, 2026');
    expect(day('Thursday, October 8th, 2026, selected')).toBeSelected();
    expect(day('Friday, October 16th, 2026, selected')).toBeSelected();
  });

  it('moves a month with its named buttons and reports it', async () => {
    const onMonthChange = jest.fn();
    await render(<Calendar mode="single" today={TODAY} onMonthChange={onMonthChange} />);

    await press('Go to the Next Month');
    expect(screen.getByText('November 2026')).toBeOnTheScreen();
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 10, 1));

    await press('Go to the Previous Month');
    await press('Go to the Previous Month');
    expect(screen.getByText('September 2026')).toBeOnTheScreen();
  });

  it('stops at its end month', async () => {
    await render(<Calendar mode="single" today={TODAY} endMonth={new Date(2026, 10, 1)} />);

    await press('Go to the Next Month');

    expect(screen.getByText('November 2026')).toBeOnTheScreen();
    expect(day('Go to the Next Month')).toBeDisabled();
  });

  it('draws several months, the caption of each', async () => {
    await render(<Calendar mode="range" today={TODAY} numberOfMonths={2} />);

    expect(screen.getByText('October 2026')).toBeOnTheScreen();
    expect(screen.getByText('November 2026')).toBeOnTheScreen();
  });

  it('takes no press on a disabled day and says so', async () => {
    const onSelect = jest.fn();
    await render(<Calendar mode="single" today={TODAY} onSelect={onSelect} disabled={{ before: TODAY }} />);

    await press('Monday, October 12th, 2026');

    expect(onSelect).not.toHaveBeenCalled();
    expect(day('Monday, October 12th, 2026')).toBeDisabled();
    expect(day('Friday, October 23rd, 2026')).toBeEnabled();
  });

  it('leaves out the days of other months when asked', async () => {
    await render(<Calendar mode="single" today={TODAY} showOutsideDays={false} />);

    expect(screen.queryByRole('button', { name: 'Wednesday, September 30th, 2026' })).toBeNull();
  });

  it('writes the caption, the weekdays and the labels in the locale, from its first day of the week', async () => {
    await render(<Calendar mode="single" today={TODAY} locale={es} />);

    expect(screen.getByText('octubre 2026')).toBeOnTheScreen();
    expect(screen.getAllByText(/^(lu|ma|mi|ju|vi|s\u00e1|do)$/).map((weekday) => weekday.props.children)[0]).toBe('lu');
  });

  it('numbers the weeks when asked', async () => {
    await render(<Calendar mode="single" today={TODAY} showWeekNumber />);

    expect(screen.getByText('43')).toBeOnTheScreen();
  });

  it('moves with the keyboard, into the next month past the last day', async () => {
    await render(<Calendar mode="single" today={TODAY} />);

    await fireEvent(day('Saturday, October 31st, 2026'), 'keyDown', {
      nativeEvent: { key: 'ArrowRight' },
      preventDefault: jest.fn(),
    });

    expect(screen.getByText('November 2026')).toBeOnTheScreen();
  });

  it('picks the month and the year from dropdowns in the dropdown caption', async () => {
    await render(<Calendar mode="single" today={TODAY} captionLayout="dropdown" />);

    expect(screen.getByRole('combobox', { name: 'Choose the Month' })).toHaveTextContent('Oct');
    expect(screen.getByRole('combobox', { name: 'Choose the Year' })).toHaveTextContent('2026');
  });

  it("draws Vega's cells and the selected day in the primary colour", async () => {
    await render(<Calendar mode="single" today={TODAY} selected={new Date(2026, 9, 12)} onSelect={jest.fn()} />);

    const selected = day('Monday, October 12th, 2026, selected');
    expect(emittedClasses(selected.props.className)).toContain('bg-primary');
    const cell = selected.parent;
    expect(emittedClasses(cell?.props.className)).toContain('size-8');
  });
});
