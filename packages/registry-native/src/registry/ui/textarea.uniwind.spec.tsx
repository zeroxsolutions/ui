import { render, screen } from '@testing-library/react-native';
import { Textarea } from './textarea.uniwind';

describe('Textarea on Uniwind', () => {
  it("colours its placeholder through Uniwind's placeholderTextColorClassName", async () => {
    await render(<Textarea testID="field" />);

    expect(screen.getByTestId('field').props.placeholderTextColorClassName).toBe('accent-muted-foreground');
    expect(screen.getByTestId('field').props.multiline).toBe(true);
  });
});
