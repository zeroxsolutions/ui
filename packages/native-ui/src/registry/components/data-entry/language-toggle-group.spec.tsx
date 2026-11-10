import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from '../../ui/text';
import { ToggleGroupItem } from '../../ui/toggle-group';
import { LanguageToggleGroup } from './language-toggle-group';

function Example({ onValueChange = jest.fn() }: { onValueChange?: (value: string) => void }) {
  return (
    <LanguageToggleGroup value="en" onValueChange={onValueChange} aria-label="Language">
      <ToggleGroupItem value="en">
        <Text>English</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="vi">
        <Text>Vietnamese</Text>
      </ToggleGroupItem>
    </LanguageToggleGroup>
  );
}

describe('LanguageToggleGroup', () => {
  it('checks the item carrying the current value', async () => {
    await render(<Example />);

    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Vietnamese' })).not.toBeChecked();
  });

  it("reports a newly pressed item's value", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Example onValueChange={onValueChange} />);

    await user.press(screen.getByRole('radio', { name: 'Vietnamese' }));

    expect(onValueChange).toHaveBeenCalledWith('vi');
  });

  it('reports nothing when the current item is pressed, so a language stays chosen', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Example onValueChange={onValueChange} />);

    await user.press(screen.getByRole('radio', { name: 'English' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('is a radio group named by its aria-label', async () => {
    await render(<Example />);

    // Testing Library finds a View by its role only when it is one accessibility element, which a group is not.
    expect(screen.getByLabelText('Language').props.role).toBe('radiogroup');
  });
});
