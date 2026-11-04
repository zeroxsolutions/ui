import { fireEvent, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar';
import { Text } from './text';

const PHOTO = { uri: 'https://example.com/jane.png' };

function renderAvatar(props: { source?: typeof PHOTO; size?: 'default' | 'sm' | 'lg' } = {}) {
  return render(
    <Avatar alt="Jane Doe" size={props.size} testID="avatar">
      {props.source ? <AvatarImage source={props.source} testID="photo" /> : null}
      <AvatarFallback testID="fallback">
        <Text>JD</Text>
      </AvatarFallback>
    </Avatar>,
  );
}

describe('Avatar', () => {
  it('shows the fallback, named by the avatar alt, when it has no image', async () => {
    await renderAvatar();

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(screen.getByTestId('fallback'));
    expect(screen.getByText('JD')).toBeOnTheScreen();
  });

  it('keeps the fallback on screen while the image is loading, and names the avatar once', async () => {
    await renderAvatar({ source: PHOTO });

    expect(screen.getByTestId('fallback', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getAllByLabelText('Jane Doe')).toHaveLength(1);
  });

  it('names the avatar through the fallback again once the image fails to load', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'error');

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(screen.getByTestId('fallback'));
  });

  it('shows the image and no fallback once the image has loaded', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'load');

    expect(screen.getByTestId('photo')).toBeOnTheScreen();
    expect(screen.queryByTestId('fallback')).not.toBeOnTheScreen();
  });

  it('shows the fallback when the image fails to load', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'error');

    expect(screen.queryByTestId('photo')).not.toBeOnTheScreen();
    expect(screen.getByTestId('fallback')).toBeOnTheScreen();
  });

  it('shows the fallback again once a loaded image is taken away', async () => {
    await renderAvatar({ source: PHOTO });
    await fireEvent(screen.getByTestId('photo'), 'load');

    await screen.rerender(
      <Avatar alt="Jane Doe" testID="avatar">
        <AvatarFallback testID="fallback">
          <Text>JD</Text>
        </AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(screen.getByTestId('fallback'));
  });

  it('shows the fallback again when the image source changes after a load', async () => {
    await renderAvatar({ source: PHOTO });
    await fireEvent(screen.getByTestId('photo'), 'load');

    await screen.rerender(
      <Avatar alt="Jane Doe" testID="avatar">
        <AvatarImage source={{ uri: 'https://example.com/other.png' }} testID="photo" />
        <AvatarFallback testID="fallback">
          <Text>JD</Text>
        </AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByTestId('fallback', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('draws a 32px circle by default', async () => {
    await renderAvatar();
    const classes = emittedClasses(screen.getByTestId('avatar').props.className);

    expect(classes).toEqual(expect.arrayContaining(['size-8', 'rounded-full']));
  });

  it.each([
    ['sm', 'size-6', 'size-8'],
    ['lg', 'size-10', 'size-8'],
  ] as const)("takes Vega's %s size", async (size, drawn, replaced) => {
    await renderAvatar({ size });
    const classes = emittedClasses(screen.getByTestId('avatar').props.className);

    expect(classes).toContain(drawn);
    expect(classes).not.toContain(replaced);
  });

  it('draws the fallback on the muted colours', async () => {
    await renderAvatar();

    expect(emittedClasses(screen.getByTestId('fallback').props.className)).toContain('bg-muted');
    expect(emittedClasses(screen.getByText('JD').props.className)).toContain('text-muted-foreground');
  });

  it('shrinks the fallback text at the sm size', async () => {
    await renderAvatar({ size: 'sm' });

    expect(emittedClasses(screen.getByText('JD').props.className)).toContain('text-xs');
  });
});

describe('AvatarBadge', () => {
  function renderBadged(size?: 'default' | 'sm' | 'lg') {
    return render(
      <Avatar alt="Jane Doe, online" size={size}>
        <AvatarFallback>
          <Text>JD</Text>
        </AvatarFallback>
        <AvatarBadge testID="badge" />
      </Avatar>,
    );
  }

  it('draws on the avatar without being announced, leaving the name to the alt', async () => {
    await renderBadged();

    expect(screen.getByTestId('badge', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByTestId('badge')).not.toBeOnTheScreen();
    expect(screen.getByRole('img', { name: 'Jane Doe, online' })).toBeOnTheScreen();
  });

  it("draws Vega's primary dot, edged in the background colour", async () => {
    await renderBadged();
    const classes = emittedClasses(screen.getByTestId('badge', { includeHiddenElements: true }).props.className);

    expect(classes).toEqual(expect.arrayContaining(['bg-primary', 'border-2', 'border-background', 'rounded-full']));
  });

  it.each([
    ['sm', 'size-3'],
    ['default', 'size-3.5'],
    ['lg', 'size-4'],
  ] as const)('grows with the avatar, drawing a %s avatar a %s dot', async (size, drawn) => {
    await renderBadged(size);

    expect(screen.getByTestId('badge', { includeHiddenElements: true }).props.className).toContain(drawn);
  });
});

describe('AvatarGroup', () => {
  function renderGroup(size?: 'default' | 'sm' | 'lg') {
    return render(
      <AvatarGroup>
        <Avatar alt="Jane Doe" size={size} testID="first">
          <AvatarFallback>
            <Text>JD</Text>
          </AvatarFallback>
        </Avatar>
        <Avatar alt="Max Leiter" size={size}>
          <AvatarFallback>
            <Text>ML</Text>
          </AvatarFallback>
        </Avatar>
        <AvatarGroupCount testID="count">
          <Text>+3</Text>
        </AvatarGroupCount>
      </AvatarGroup>,
    );
  }

  it('names each avatar and reads the count after them', async () => {
    await renderGroup();

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeOnTheScreen();
    expect(screen.getByRole('img', { name: 'Max Leiter' })).toBeOnTheScreen();
    expect(screen.getByText('+3')).toBeOnTheScreen();
  });

  it('overlaps each avatar on the one before, edged in the background colour', async () => {
    await renderGroup();

    expect(screen.getByTestId('first').props.className).toEqual(
      expect.stringContaining('-ml-2 border-2 border-background'),
    );
  });

  it('leaves an avatar outside a group where it is', async () => {
    await renderAvatar();

    expect(screen.getByTestId('avatar').props.className).not.toContain('-ml-2');
  });

  it.each([
    ['sm', 'size-6'],
    ['default', 'size-8'],
    ['lg', 'size-10'],
  ] as const)("draws the count as large as the group's %s avatars, %s, on the muted colours", async (size, drawn) => {
    await renderGroup(size);
    const classes = emittedClasses(screen.getByTestId('count').props.className);

    expect(classes).toEqual(expect.arrayContaining([drawn, 'rounded-full', 'bg-muted']));
    expect(emittedClasses(screen.getByText('+3').props.className)).toContain('text-muted-foreground');
  });
});
