import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from './item';

describe('Item', () => {
  it('renders its child in its place with asChild, so the whole item takes a press', async () => {
    const onPress = jest.fn();
    await render(
      <Item asChild variant="outline" testID="item">
        <Pressable role="button" onPress={onPress}>
          <ItemContent>
            <ItemTitle>Settings</ItemTitle>
          </ItemContent>
        </Pressable>
      </Item>,
    );

    const item = screen.getByRole('button', { name: 'Settings' });
    await userEvent.setup().press(item);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('item')).toBe(item);
  });
});

describe('ItemGroup', () => {
  it('is a list', async () => {
    await render(
      <ItemGroup testID="group">
        <Item size="sm" />
        <ItemSeparator />
        <Item size="sm" />
      </ItemGroup>,
    );

    expect(screen.getByTestId('group')).toHaveProp('role', 'list');
  });
});
