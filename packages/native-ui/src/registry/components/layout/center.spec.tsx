import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { Center } from './center';

describe('Center', () => {
  it('draws its children', async () => {
    await render(
      <Center>
        <Text>Centered content</Text>
      </Center>,
    );

    expect(screen.getByText('Centered content')).toBeOnTheScreen();
  });

  it('draws the render element in place of the View, with its props', async () => {
    const onPress = jest.fn();
    await render(
      <Center render={<Pressable role="button" aria-label="Retry" onPress={onPress} />}>
        <Text>Retry</Text>
      </Center>,
    );

    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toBeOnTheScreen();
    expect(screen.getByText('Retry')).toBeOnTheScreen();
  });

  it('calls a render function with the merged props and its slot', async () => {
    const renderCenter = jest.fn((props: object) => <Pressable role="button" aria-label="Open" {...props} />);
    await render(<Center render={renderCenter} className="h-8" />);

    expect(screen.getByRole('button', { name: 'Open' })).toBeOnTheScreen();
    expect(renderCenter).toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('h-8') }), {
      slot: 'center',
    });
  });
});
