import { render, screen, userEvent } from '@testing-library/react-native';
import { useState, type ComponentProps } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Text } from './text';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

type GroupLayoutProps = Pick<
  ComponentProps<typeof ToggleGroup>,
  'variant' | 'size' | 'spacing' | 'orientation' | 'disabled'
>;

/** A single-choice group of three alignments whose value follows its own presses. */
function AlignmentGroup(props: GroupLayoutProps) {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue} testID="group" {...props}>
      <ToggleGroupItem value="left">
        <Text>Left</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <Text>Center</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <Text>Right</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/** A multiple-choice group of two text styles whose value follows its own presses. */
function StyleGroup() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ToggleGroup type="multiple" value={value} onValueChange={setValue}>
      <ToggleGroupItem value="bold">
        <Text>Bold</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Text>Italic</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function classesOf(role: 'radio' | 'checkbox', name: string): string[] {
  return emittedClasses(screen.getByRole(role, { name }).props.className);
}

describe('ToggleGroup', () => {
  it('keeps one item pressed in single mode', async () => {
    const user = userEvent.setup();
    await render(<AlignmentGroup />);

    await user.press(screen.getByRole('radio', { name: 'Left' }));
    await user.press(screen.getByRole('radio', { name: 'Center' }));

    expect(screen.getByRole('radio', { name: 'Left' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Center' })).toBeChecked();
    expect(classesOf('radio', 'Center')).toContain('bg-muted');
    expect(classesOf('radio', 'Left')).not.toContain('bg-muted');
  });

  it('keeps every pressed item pressed in multiple mode', async () => {
    const user = userEvent.setup();
    await render(<StyleGroup />);

    await user.press(screen.getByRole('checkbox', { name: 'Bold' }));
    await user.press(screen.getByRole('checkbox', { name: 'Italic' }));

    expect(screen.getByRole('checkbox', { name: 'Bold' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Italic' })).toBeChecked();
  });

  it("draws every item in the group's variant and size", async () => {
    await render(<AlignmentGroup variant="outline" size="sm" />);

    expect(classesOf('radio', 'Center')).toEqual(expect.arrayContaining(['border', 'border-input', 'h-8']));
  });

  it('spaces its items two steps apart by default', async () => {
    await render(<AlignmentGroup />);

    const group = emittedClasses(screen.getByTestId('group').props.className);

    expect(group).toContain('gap-2');
    expect(classesOf('radio', 'Left')).toContain('rounded-md');
  });

  it('joins its items at spacing 0, rounding only the outer corners of a row', async () => {
    await render(<AlignmentGroup variant="outline" spacing={0} />);

    expect(emittedClasses(screen.getByTestId('group').props.className)).toEqual(
      expect.arrayContaining(['gap-0', 'shadow-sm']),
    );
    expect(classesOf('radio', 'Left')).toEqual(expect.arrayContaining(['rounded-none', 'rounded-l-md']));
    expect(classesOf('radio', 'Left')).not.toContain('border-l-0');
    expect(classesOf('radio', 'Center')).toEqual(expect.arrayContaining(['rounded-none', 'border-l-0']));
    expect(classesOf('radio', 'Center')).not.toContain('rounded-l-md');
    expect(classesOf('radio', 'Right')).toEqual(expect.arrayContaining(['rounded-none', 'rounded-r-md']));
  });

  it('rounds the top and bottom corners of a joined column', async () => {
    await render(<AlignmentGroup variant="outline" spacing={0} orientation="vertical" />);

    expect(emittedClasses(screen.getByTestId('group').props.className)).toContain('flex-col');
    expect(classesOf('radio', 'Left')).toContain('rounded-t-md');
    expect(classesOf('radio', 'Center')).toContain('border-t-0');
    expect(classesOf('radio', 'Right')).toContain('rounded-b-md');
  });

  it('rounds all four corners of a lone item at spacing 0', async () => {
    await render(
      <ToggleGroup type="single" value={undefined} onValueChange={() => {}} spacing={0}>
        <ToggleGroupItem value="bold">
          <Text>Bold</Text>
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(classesOf('radio', 'Bold')).toEqual(expect.arrayContaining(['rounded-l-md', 'rounded-r-md']));
  });

  it('finds the first and last of items rendered from a list', async () => {
    await render(
      <ToggleGroup type="single" value={undefined} onValueChange={() => {}} spacing={0}>
        {['Left', 'Center', 'Right'].map((name) => (
          <ToggleGroupItem key={name} value={name}>
            <Text>{name}</Text>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>,
    );

    expect(classesOf('radio', 'Left')).toContain('rounded-l-md');
    expect(classesOf('radio', 'Center')).not.toContain('rounded-l-md');
    expect(classesOf('radio', 'Center')).not.toContain('rounded-r-md');
    expect(classesOf('radio', 'Right')).toContain('rounded-r-md');
  });

  it('disables every item when disabled', async () => {
    const user = userEvent.setup();
    await render(<AlignmentGroup disabled />);

    await user.press(screen.getByRole('radio', { name: 'Left' }));

    expect(screen.getByRole('radio', { name: 'Left' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Left' })).not.toBeChecked();
  });
});
