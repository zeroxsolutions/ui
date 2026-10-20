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

  it('starts from the regular Geist family', async () => {
    await render(<Text>Save</Text>);

    expect(screen.getByText('Save').props.className.split(' ')).toContain('font-sans');
  });
});
