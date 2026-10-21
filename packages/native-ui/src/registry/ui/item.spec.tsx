import { render, screen, userEvent } from '@testing-library/react-native';
import { Inbox } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import { Icon } from './icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item';
import { Text } from './text';

function classesOf(testID: string, style: 'vega' | 'nova' = 'vega'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

describe('Item', () => {
  it("lays its parts out in a wrapping row with the style's default spacing", async () => {
    await render(
      <Item testID="item">
        <ItemContent testID="content">
          <ItemTitle>Inbox</ItemTitle>
        </ItemContent>
        <ItemActions testID="actions">
          <Button size="sm">
            <Text>Open</Text>
          </Button>
        </ItemActions>
      </Item>,
    );

    expect(classesOf('item')).toEqual(
      expect.arrayContaining(['flex-row', 'flex-wrap', 'items-center', 'rounded-md', 'border', 'border-transparent']),
    );
    expect(classesOf('item')).toEqual(expect.arrayContaining(['gap-3.5', 'px-4', 'py-3.5']));
    expect(classesOf('item', 'nova')).toEqual(expect.arrayContaining(['gap-2.5', 'px-3', 'py-2.5', 'rounded-lg']));
    expect(classesOf('content')).toEqual(expect.arrayContaining(['flex-1', 'gap-1']));
    expect(classesOf('actions')).toEqual(expect.arrayContaining(['flex-row', 'gap-2']));
  });

  it.each([
    ['outline', 'border-border'],
    ['muted', 'bg-muted/50'],
  ] as const)('draws the %s variant with %s', async (variant, background) => {
    await render(<Item variant={variant} testID="item" />);

    expect(classesOf('item')).toContain(background);
  });

  it('draws the title on one line and the description muted on two', async () => {
    await render(
      <Item>
        <ItemContent>
          <ItemTitle>Weekly report</ItemTitle>
          <ItemDescription>Sent every Monday to the whole team.</ItemDescription>
        </ItemContent>
      </Item>,
    );

    const title = screen.getByText('Weekly report');
    const description = screen.getByText('Sent every Monday to the whole team.');
    expect(title.props.numberOfLines).toBe(1);
    expect(description.props.numberOfLines).toBe(2);
    expect(emittedClasses(title.props.className)).toEqual(expect.arrayContaining(['font-sans-medium', 'text-sm']));
    expect(emittedClasses(description.props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm']),
    );
  });

  it('tightens a size xs item, dropping the gap in its content and shrinking its description', async () => {
    await render(
      <Item size="xs" testID="item">
        <ItemContent testID="content">
          <ItemTitle>Draft</ItemTitle>
          <ItemDescription>Edited now</ItemDescription>
        </ItemContent>
      </Item>,
    );

    expect(classesOf('item')).toEqual(expect.arrayContaining(['gap-2', 'px-2.5', 'py-2']));
    expect(classesOf('content')).toContain('gap-0');
    expect(emittedClasses(screen.getByText('Edited now').props.className)).toContain('text-xs');
  });

  it('aligns its media to the top while it holds a description', async () => {
    await render(
      <Item>
        <ItemMedia variant="icon" testID="media">
          <Icon as={Inbox} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Inbox</ItemTitle>
          <ItemDescription>3 unread</ItemDescription>
        </ItemContent>
      </Item>,
    );

    expect(classesOf('media')).toEqual(expect.arrayContaining(['self-start', 'translate-y-0.5']));
  });

  it('centres its media with no description', async () => {
    await render(
      <Item>
        <ItemMedia testID="media" />
        <ItemContent>
          <ItemTitle>Inbox</ItemTitle>
        </ItemContent>
      </Item>,
    );

    expect(classesOf('media')).not.toContain('self-start');
  });

  it("sizes image media to the item's size", async () => {
    await render(
      <>
        <Item>
          <ItemMedia variant="image" testID="default" />
        </Item>
        <Item size="sm">
          <ItemMedia variant="image" testID="sm" />
        </Item>
      </>,
    );

    expect(classesOf('default')).toEqual(expect.arrayContaining(['size-10', 'overflow-hidden', 'rounded-sm']));
    expect(classesOf('sm')).toContain('size-8');
    expect(classesOf('sm')).not.toContain('size-10');
  });

  it('puts a header and a footer on lines of their own', async () => {
    await render(
      <Item>
        <ItemHeader testID="header" />
        <ItemFooter testID="footer" />
      </Item>,
    );

    for (const part of ['header', 'footer']) {
      expect(classesOf(part)).toEqual(expect.arrayContaining(['basis-full', 'justify-between', 'gap-2']));
    }
  });

  it('renders its child in its place with asChild, so the whole item takes a press', async () => {
    const onPress = jest.fn();
    await render(
      <Item asChild variant="outline">
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
    expect(emittedClasses(item.props.className)).toContain('border-border');
  });
});

describe('ItemGroup', () => {
  it('is a list spaced by the size of its items', async () => {
    await render(
      <>
        <ItemGroup testID="default">
          <Item />
        </ItemGroup>
        <ItemGroup testID="sm">
          <Item size="sm" />
          <ItemSeparator testID="separator" />
          <Item size="sm" />
        </ItemGroup>
      </>,
    );

    expect(screen.getByTestId('default').props.role).toBe('list');
    expect(classesOf('default')).toContain('gap-4');
    expect(classesOf('sm')).toContain('gap-2.5');
    expect(classesOf('sm')).not.toContain('gap-4');
    expect(emittedClasses(screen.getByTestId('separator', { includeHiddenElements: true }).props.className)).toContain(
      'my-2',
    );
  });
});
