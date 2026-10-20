import { render, screen } from '@testing-library/react-native';
import { Text, TextClassContext } from './text';

describe('Text', () => {
  it('reads its class from TextClassContext', async () => {
    await render(
      <TextClassContext.Provider value="text-primary-foreground">
        <Text>Save</Text>
      </TextClassContext.Provider>,
    );

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toContain('text-primary-foreground');
    expect(classes).not.toContain('text-foreground');
  });
});
