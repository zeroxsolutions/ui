import { render, screen, userEvent } from '@testing-library/react-native';
import { fluentEmojiUrl, type FluentEmojiStyle } from '../../lib/fluent-emoji';
import { Text } from '../../ui/text';
import { EmojiAppearanceToggleGroup, EmojiAppearanceToggleGroupItem } from './emoji-appearance-toggle-group';

function Example({
  value,
  onValueChange = jest.fn(),
}: {
  value: FluentEmojiStyle;
  onValueChange?: (style: FluentEmojiStyle) => void;
}) {
  return (
    <EmojiAppearanceToggleGroup value={value} onValueChange={onValueChange}>
      <EmojiAppearanceToggleGroupItem value="3d">
        <Text>3D</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">
        <Text>Flat</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">
        <Text>Modern</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">
        <Text>Mono</Text>
      </EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">
        <Text>Animated</Text>
      </EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>
  );
}

type Node = ReturnType<typeof screen.getByRole>;

/** The face every swatch previews. */
const GRINNING = '\u{1F600}';

/** The image sources drawn inside a node, outermost first. */
function sourcesIn(node: Node): string[] {
  const own = Array.isArray(node.props.source) ? (node.props.source as { uri: string }[]).map(({ uri }) => uri) : [];
  return [...own, ...node.children.flatMap((child) => (typeof child === 'string' ? [] : sourcesIn(child)))];
}

/** The URL of the artwork a swatch previews, which a screen reader does not reach. */
function artworkOf(label: string): string[] {
  return sourcesIn(screen.getByRole('radio', { name: label }));
}

describe('EmojiAppearanceToggleGroup', () => {
  it('offers one swatch per composed item, named by its label alone', async () => {
    await render(<Example value="3d" />);

    for (const label of ['3D', 'Flat', 'Modern', 'Mono', 'Animated']) {
      expect(screen.getByRole('radio', { name: label })).toBeOnTheScreen();
    }
  });

  it('previews the grinning face in each swatch in its own style, whichever is chosen', async () => {
    await render(<Example value="3d" />);

    for (const [label, style] of [
      ['3D', '3d'],
      ['Flat', 'flat'],
      ['Modern', 'modern'],
      ['Mono', 'mono'],
      ['Animated', 'anim'],
    ] as const) {
      expect(artworkOf(label)).toEqual([fluentEmojiUrl(GRINNING, { style })]);
    }
  });

  it('checks the chosen style', async () => {
    await render(<Example value="modern" />);

    expect(screen.getByRole('radio', { name: 'Modern' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '3D' })).not.toBeChecked();
  });

  it('reports a newly chosen style, and nothing when the chosen one is pressed again', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Example value="3d" onValueChange={onValueChange} />);

    await user.press(screen.getByRole('radio', { name: '3D' }));
    expect(onValueChange).not.toHaveBeenCalled();

    await user.press(screen.getByRole('radio', { name: 'Flat' }));
    expect(onValueChange).toHaveBeenCalledWith('flat');
  });

  it('names its group Emoji style unless given a label', async () => {
    await render(<Example value="3d" />);

    expect(screen.getByLabelText('Emoji style').props.role).toBe('radiogroup');
  });
});
