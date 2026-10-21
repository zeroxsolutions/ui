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

  it('draws a caller weight class in the matching Geist family', async () => {
    await render(<Text className="font-semibold">Save</Text>);

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toContain('font-sans-semibold');
    expect(classes).not.toContain('font-semibold');
    expect(classes).not.toContain('font-sans');
  });

  it('draws a weight class under a variant in the matching Geist family', async () => {
    await render(<Text className="dark:font-bold">Save</Text>);

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toContain('dark:font-sans-bold');
    expect(classes).not.toContain('dark:font-bold');
  });

  it.each([
    ['!font-bold', '!font-sans-bold'],
    ['font-bold!', 'font-sans-bold!'],
    ['dark:!font-medium', 'dark:!font-sans-medium'],
  ])('draws the important form %s in the matching Geist family', async (given, drawn) => {
    await render(<Text className={given}>Save</Text>);

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toContain(drawn);
    expect(classes).not.toContain(given);
  });
});
