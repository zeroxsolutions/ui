import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { asText, textOf } from './text-children';

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
});
