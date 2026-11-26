import { fireEvent, render, screen } from '@testing-library/react-native';
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar';
import { Text } from './text';

const PHOTO = { uri: 'https://example.com/jane.png' };

function renderAvatar(props: { source?: typeof PHOTO } = {}) {
  return render(
    <Avatar alt="Jane Doe">
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

  it('names the avatar through the fallback again once a simulated image load fails', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'error');

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(screen.getByTestId('fallback'));
  });

  it('shows the image and no fallback once a simulated image load completes', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'load');

    expect(screen.getByTestId('photo')).toBeOnTheScreen();
    expect(screen.queryByTestId('fallback')).not.toBeOnTheScreen();
  });

  it('shows the fallback when a simulated image load fails', async () => {
    await renderAvatar({ source: PHOTO });

    await fireEvent(screen.getByTestId('photo'), 'error');

    expect(screen.queryByTestId('photo')).not.toBeOnTheScreen();
    expect(screen.getByTestId('fallback')).toBeOnTheScreen();
  });

  it('shows the fallback again once an image a simulated load completed is taken away', async () => {
    await renderAvatar({ source: PHOTO });
    await fireEvent(screen.getByTestId('photo'), 'load');

    await screen.rerender(
      <Avatar alt="Jane Doe">
        <AvatarFallback testID="fallback">
          <Text>JD</Text>
        </AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBe(screen.getByTestId('fallback'));
  });

  it('shows the fallback again when the image source changes after a simulated load', async () => {
    await renderAvatar({ source: PHOTO });
    await fireEvent(screen.getByTestId('photo'), 'load');

    await screen.rerender(
      <Avatar alt="Jane Doe">
        <AvatarImage source={{ uri: 'https://example.com/other.png' }} testID="photo" />
        <AvatarFallback testID="fallback">
          <Text>JD</Text>
        </AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByTestId('fallback', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});

describe('AvatarBadge', () => {
  function renderBadged() {
    return render(
      <Avatar alt="Jane Doe, online">
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
});

describe('AvatarGroup', () => {
  function renderGroup() {
    return render(
      <AvatarGroup>
        <Avatar alt="Jane Doe">
          <AvatarFallback>
            <Text>JD</Text>
          </AvatarFallback>
        </Avatar>
        <Avatar alt="Max Leiter">
          <AvatarFallback>
            <Text>ML</Text>
          </AvatarFallback>
        </Avatar>
        <AvatarGroupCount>
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
});
