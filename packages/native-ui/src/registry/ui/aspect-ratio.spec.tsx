import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { AspectRatio } from './aspect-ratio';
import { Text } from './text';

describe('AspectRatio', () => {
  it('keeps its height to its width at the given ratio', async () => {
    await render(
      <AspectRatio ratio={16 / 9} testID="frame">
        <Text>Video</Text>
      </AspectRatio>,
    );

    expect(StyleSheet.flatten(screen.getByTestId('frame').props.style)).toMatchObject({ aspectRatio: 16 / 9 });
    expect(screen.getByTestId('frame')).toContainElement(screen.getByText('Video'));
  });

  it('keeps a style the caller passes beside the ratio', async () => {
    await render(<AspectRatio ratio={1} testID="frame" style={{ opacity: 0.5 }} />);

    expect(StyleSheet.flatten(screen.getByTestId('frame').props.style)).toMatchObject({ aspectRatio: 1, opacity: 0.5 });
  });
});
