import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { Center, centerVariants } from './center';

describe('Center', () => {
  it('centres its children on both axes, in a row as the web flex box lays them', async () => {
    await render(
      <Center testID="center">
        <Text>Centered content</Text>
      </Center>,
    );

    expect(screen.getByText('Centered content')).toBeOnTheScreen();
    expect(emittedClasses(screen.getByTestId('center').props.className)).toEqual(
      expect.arrayContaining(['flex', 'flex-row', 'items-center', 'justify-center']),
    );
  });

  it('keeps the box to its content when inline', async () => {
    await render(<Center testID="center" inline />);

    expect(emittedClasses(screen.getByTestId('center').props.className)).toContain('self-start');
  });

  it("takes size and spacing from the caller's classes", async () => {
    await render(<Center testID="center" className="h-32 gap-2" />);

    expect(emittedClasses(screen.getByTestId('center').props.className)).toEqual(
      expect.arrayContaining(['h-32', 'gap-2', 'items-center']),
    );
  });

  it('draws the render element in place of the View, with its props and the centring', async () => {
    const onPress = jest.fn();
    await render(
      <Center render={<Pressable role="button" aria-label="Retry" onPress={onPress} className="p-2" />}>
        <Text>Retry</Text>
      </Center>,
    );

    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toBeOnTheScreen();
    expect(screen.getByText('Retry')).toBeOnTheScreen();
    expect(emittedClasses(button.props.className)).toEqual(expect.arrayContaining(['items-center', 'p-2']));
  });

  it('calls a render function with the merged props and its slot', async () => {
    const renderCenter = jest.fn((props: object) => <Pressable role="button" aria-label="Open" {...props} />);
    await render(<Center render={renderCenter} className="h-8" />);

    expect(screen.getByRole('button', { name: 'Open' })).toBeOnTheScreen();
    expect(renderCenter).toHaveBeenCalledWith(expect.objectContaining({ className: expect.stringContaining('h-8') }), {
      slot: 'center',
    });
  });

  it('exports its variants', () => {
    expect(centerVariants({ inline: true })).toContain('self-start');
    expect(centerVariants()).not.toContain('self-start');
  });
});
