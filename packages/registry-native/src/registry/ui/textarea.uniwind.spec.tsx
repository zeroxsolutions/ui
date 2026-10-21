import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Textarea } from './textarea.uniwind';

describe('Textarea on Uniwind', () => {
  it("colours its placeholder through Uniwind's placeholderTextColorClassName", async () => {
    await render(<Textarea testID="field" />);

    expect(screen.getByTestId('field').props.placeholderTextColorClassName).toBe('accent-muted-foreground');
    expect(screen.getByTestId('field').props.multiline).toBe(true);
  });

  it("tints Nova's read-only field in the input colour, light and dark, and leaves an editable one clear", async () => {
    await render(<Textarea testID="read-only" editable={false} />);
    const readOnly = emittedClasses(screen.getByTestId('read-only').props.className, 'nova');

    expect(readOnly).toEqual(expect.arrayContaining(['bg-input/50', 'dark:bg-input/80']));
    expect(readOnly.filter((cls) => cls.includes('disabled:'))).toEqual([]);

    await render(<Textarea testID="editable" />);
    expect(emittedClasses(screen.getByTestId('editable').props.className, 'nova')).not.toContain('bg-input/50');
  });
});
