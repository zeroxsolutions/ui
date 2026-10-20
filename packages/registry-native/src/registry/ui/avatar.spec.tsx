import { fireEvent, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
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

  it('shows the fallback while the image is still loading', async () => {
    await renderAvatar({ source: PHOTO });

    expect(screen.getByTestId('fallback')).toBeOnTheScreen();
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
