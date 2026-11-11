import { render, screen, userEvent } from '@testing-library/react-native';
import { Item, ItemContent, ItemGroup, ItemTitle } from '../../ui/item';
import { Text } from '../../ui/text';
import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListRemoveButton,
  ModelListSkeleton,
  ModelListTitle,
} from './model-list';

describe('ModelList', () => {
  it('announces its title as a heading, over the controls and the models it holds', async () => {
    await render(
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <Text>3 models</Text>
          </ModelListAction>
        </ModelListHeader>
        <ModelListContent>
          <ItemGroup>
            <Item>
              <ItemContent>
                <ItemTitle>GPT-4o</ItemTitle>
              </ItemContent>
            </Item>
            <Item>
              <ItemContent>
                <ItemTitle>Claude Opus</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>
        </ModelListContent>
      </ModelList>,
    );

    expect(screen.getByRole('heading', { name: 'Model list' })).toBeOnTheScreen();
    expect(screen.getByText('3 models')).toBeOnTheScreen();
    expect(screen.getAllByText(/GPT-4o|Claude Opus/).map((title) => title.props.children)).toEqual([
      'GPT-4o',
      'Claude Opus',
    ]);
  });
});

describe('ModelListRemoveButton', () => {
  it('is a button named "Remove model" that calls its onPress', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ModelListRemoveButton onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Remove model' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("takes the consumer's name in place of its own", async () => {
    await render(<ModelListRemoveButton aria-label="Remove GPT-4o" />);

    expect(screen.getByRole('button', { name: 'Remove GPT-4o' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Remove model' })).toBeNull();
  });
});

describe('ModelListSkeleton', () => {
  it('draws six placeholder models by default', async () => {
    await render(<ModelListSkeleton testID="loading" />);

    expect(screen.getByTestId('loading').children).toHaveLength(6);
  });

  it('draws as many placeholder models as it is asked for', async () => {
    await render(<ModelListSkeleton testID="loading" count={2} />);

    expect(screen.getByTestId('loading').children).toHaveLength(2);
  });
});
