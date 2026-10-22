import { render, screen } from '@testing-library/react-native';
import { Inbox } from 'lucide-react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty';
import { Icon } from './icon';
import { Text } from './text';

function renderEmpty() {
  return render(
    <Empty testID="empty">
      <EmptyHeader testID="header">
        <EmptyMedia variant="icon" testID="media">
          <Icon as={Inbox} accessible role="img" aria-label="Inbox" />
        </EmptyMedia>
        <EmptyTitle>No messages</EmptyTitle>
        <EmptyDescription>New messages land here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent testID="content">
        <Button>
          <Text>Compose</Text>
        </Button>
      </EmptyContent>
    </Empty>,
  );
}

function classesOf(testID: string, style: 'vega' | 'nova' = 'vega'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

describe('Empty', () => {
  it("centres its content with the style's padding and spacing", async () => {
    await renderEmpty();

    expect(classesOf('empty')).toEqual(expect.arrayContaining(['items-center', 'justify-center', 'p-12', 'gap-4']));
    expect(classesOf('empty', 'nova')).toEqual(expect.arrayContaining(['p-6', 'rounded-xl']));
    expect(classesOf('header')).toEqual(expect.arrayContaining(['items-center', 'gap-2']));
    expect(classesOf('content')).toEqual(expect.arrayContaining(['items-center', 'gap-4']));
  });

  it('draws the title and the muted description centred', async () => {
    await renderEmpty();

    const title = emittedClasses(screen.getByText('No messages').props.className);
    expect(title).toEqual(expect.arrayContaining(['text-lg', 'font-sans-medium', 'tracking-tight', 'text-center']));
    expect(emittedClasses(screen.getByText('No messages').props.className, 'nova')).toContain('text-sm');
    expect(emittedClasses(screen.getByText('New messages land here.').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm/relaxed', 'text-center']),
    );
  });

  it('draws icon media as a muted tile with the icon at the style size', async () => {
    expect(emittedClasses('cn-empty-media-icon/icon')).toEqual(['size-6']);
    expect(emittedClasses('cn-empty-media-icon/icon', 'nova')).toEqual(['size-4']);
    // The spec renders the source, whose icon class is still the slot token, so the token is
    // registered with the size the build translates it to.
    registerCSS('.cn-empty-media-icon\\/icon { width: 24px; height: 24px; }');
    await renderEmpty();

    expect(classesOf('media')).toEqual(expect.arrayContaining(['bg-muted', 'size-10', 'rounded-lg', 'mb-2']));
    const { width, height } = screen.getByRole('img', { name: 'Inbox' }).props;
    expect({ width, height }).toEqual({ width: 24, height: 24 });
  });

  it('draws default media with no tile', async () => {
    await render(
      <EmptyMedia testID="media">
        <Text>Art</Text>
      </EmptyMedia>,
    );

    expect(classesOf('media')).toContain('bg-transparent');
    expect(classesOf('media')).not.toContain('bg-muted');
  });
});
