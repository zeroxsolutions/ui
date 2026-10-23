import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { asText, isText, textOf } from './text-children';

describe('textOf', () => {
  it('reads the text of nested elements, joined by nothing unless given a separator', () => {
    const node = [
      <Text key="name">Ada</Text>,
      <View key="body">
        <Text>Sent 2 files</Text>
      </View>,
    ];

    expect(textOf(node)).toBe('AdaSent 2 files');
    expect(textOf(node, ' ')).toBe('Ada Sent 2 files');
  });
});

describe('asText', () => {
  it('sets bare strings and numbers in one Text, and leaves elements as given', async () => {
    await render(
      <View>
        <View testID="bare">{asText(['Step ', 3])}</View>
        <View testID="element">{asText(<Text>Done</Text>)}</View>
      </View>,
    );

    expect(screen.getByTestId('bare')).toHaveTextContent('Step 3');
    expect(screen.getByText('Done')).toBeOnTheScreen();
  });

  it('gives the Text it sets them in the props it is passed', async () => {
    await render(<View>{asText(['Projects (', 3, ')'], { numberOfLines: 1, testID: 'label' })}</View>);

    expect(screen.getByTestId('label')).toHaveTextContent('Projects (3)');
    expect(screen.getByTestId('label').props.numberOfLines).toBe(1);
  });
});

describe('isText', () => {
  it('holds for strings and numbers alone, mixed or single, and not for an element or nothing', () => {
    expect(isText('Docs')).toBe(true);
    expect(isText(['Step ', 3])).toBe(true);
    expect(isText(<Text>Done</Text>)).toBe(false);
    expect(isText(['Step ', <Text key="n">3</Text>])).toBe(false);
    expect(isText(undefined)).toBe(false);
  });
});
