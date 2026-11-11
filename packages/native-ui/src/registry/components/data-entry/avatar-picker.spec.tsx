import { PortalHost } from '@rn-primitives/portal';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { launchImageLibraryAsync, type ImagePickerAsset, type ImagePickerResult } from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Text } from '../../ui/text';
import {
  AvatarPicker,
  AvatarPickerColorContent,
  AvatarPickerColorField,
  AvatarPickerColorGroup,
  AvatarPickerContent,
  AvatarPickerEmojiContent,
  AvatarPickerRemoveButton,
  AvatarPickerTrigger,
  AvatarPickerUploadContent,
  AvatarPickerUploadPreview,
  AvatarPickerUploadTrigger,
  useAvatarPickerUpload,
  type AvatarPickerValue,
} from './avatar-picker';
import { EmojiPickerContent, EmojiPickerSearch } from './emoji-picker';

// The photo library is a native module Jest has no device for; the spec answers what the system picker would.
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const PHOTO: ImagePickerAsset = { uri: 'file:///photos/me.jpg', width: 640, height: 640 };
const picked = (asset: ImagePickerAsset): ImagePickerResult => ({ canceled: false, assets: [asset] });
const CANCELLED: ImagePickerResult = { canceled: true, assets: null };

/** The upload pane's state as a child reads it: the copy the demo swaps while an upload is pending. */
function UploadTitle(): ReactNode {
  const { uploading } = useAvatarPickerUpload();
  return <Text>{uploading ? 'Uploading...' : 'Upload an image'}</Text>;
}

interface EditorProps {
  initial: AvatarPickerValue;
  onValueChange?: (value: AvatarPickerValue) => void;
  onUpload?: (asset: ImagePickerAsset) => string | null | Promise<string | null>;
  tab: 'emoji' | 'upload' | 'color';
}

/** The three panes as the demo composes them, holding the value as an app does. */
function Editor({ initial, onValueChange, onUpload, tab }: EditorProps): ReactNode {
  const [value, setValue] = useState(initial);
  const [shown, setShown] = useState<string>(tab);
  return (
    <AvatarPicker
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next);
        setValue(next);
      }}
    >
      <Tabs value={shown} onValueChange={setShown}>
        <View className="flex-row">
          <TabsList variant="line">
            <TabsTrigger value="emoji">
              <Text>Emoji</Text>
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Text>Upload</Text>
            </TabsTrigger>
            <TabsTrigger value="color">
              <Text>Color</Text>
            </TabsTrigger>
          </TabsList>
          <AvatarPickerRemoveButton />
        </View>
        <AvatarPickerEmojiContent>
          <EmojiPickerSearch />
          <EmojiPickerContent />
        </AvatarPickerEmojiContent>
        <AvatarPickerUploadContent onUpload={onUpload} testID="upload-pane">
          <AvatarPickerUploadPreview alt="Current avatar" />
          <UploadTitle />
          <AvatarPickerUploadTrigger>
            <Text>Choose image</Text>
          </AvatarPickerUploadTrigger>
        </AvatarPickerUploadContent>
        <AvatarPickerColorContent>
          <AvatarPickerColorGroup aria-label="Colors" />
          <AvatarPickerColorField>Custom</AvatarPickerColorField>
        </AvatarPickerColorContent>
      </Tabs>
    </AvatarPicker>
  );
}

/** The upload pane, which is no accessibility element of its own so a screen reader reaches each control in it. */
const uploadPane = () => screen.getByTestId('upload-pane');
const chooseImage = () => screen.getByRole('button', { name: 'Choose image' });

/** A promise the spec settles itself, standing in for an upload still on its way. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

describe('AvatarPicker', () => {
  beforeEach(() => launch.mockReset());

  it('opens its editor from the trigger, named Edit avatar, around the avatar the caller draws', async () => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    // The primitive places the content once it has measured the trigger, which Jest lays out nowhere.
    jest
      .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
      .mockImplementation((callback) => callback(0, 0, 40, 40, 16, 16));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(
      <>
        <AvatarPicker value={{ color: '#6366f1' }} onValueChange={jest.fn()}>
          <AvatarPickerTrigger>
            <Avatar alt="">
              <AvatarFallback />
            </Avatar>
          </AvatarPickerTrigger>
          <AvatarPickerContent>
            <Tabs value="color" onValueChange={jest.fn()}>
              <AvatarPickerRemoveButton />
              <AvatarPickerColorContent>
                <AvatarPickerColorGroup aria-label="Colors" />
              </AvatarPickerColorContent>
            </Tabs>
          </AvatarPickerContent>
        </AvatarPicker>
        <PortalHost />
      </>,
    );
    expect(screen.queryByRole('button', { name: 'Remove avatar' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Edit avatar' }));
    await act(() => jest.advanceTimersByTimeAsync(300));

    expect(screen.getByRole('button', { name: 'Remove avatar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeSelected();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('makes a picked emoji the avatar in place of its image, keeping its colour', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor
        initial={{ imageUrl: 'https://cdn.test/me.png', color: '#6366f1' }}
        onValueChange={onValueChange}
        tab="emoji"
      />,
    );

    await user.press(screen.getByRole('button', { name: 'grinning face' }));

    expect(onValueChange.mock.calls).toEqual([[{ emoji: '\u{1F600}', imageUrl: null, color: '#6366f1' }]]);
  });

  it('removes the emoji and the image with the remove button, keeping the colour', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor
        initial={{ emoji: '\u{1F600}', imageUrl: 'https://cdn.test/me.png', color: '#6366f1' }}
        onValueChange={onValueChange}
        tab="color"
      />,
    );

    await user.press(screen.getByRole('button', { name: 'Remove avatar' }));

    expect(onValueChange.mock.calls).toEqual([[{ emoji: null, imageUrl: null, color: '#6366f1' }]]);
  });

  it('sets the colour from a swatch, named by its colour and selected while it is the colour', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor initial={{ emoji: '\u{1F600}', color: '#6366f1' }} onValueChange={onValueChange} tab="color" />,
    );
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeSelected();

    await user.press(screen.getByRole('button', { name: '#ec4899' }));

    expect(onValueChange.mock.calls).toEqual([[{ emoji: '\u{1F600}', color: '#ec4899' }]]);
    expect(screen.getByRole('button', { name: '#ec4899' })).toBeSelected();
    expect(screen.getByRole('button', { name: '#6366f1' })).not.toBeSelected();
  });

  it('sets the colour from the hex field once it holds six hex digits, in lowercase, with or without #', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Editor initial={{ color: '#6366f1' }} onValueChange={onValueChange} tab="color" />);
    const field = screen.getByLabelText('Custom');
    expect(field).toHaveDisplayValue('#6366f1');

    await user.clear(field);
    await user.type(field, '#ABCDE');
    expect(onValueChange).not.toHaveBeenCalled();
    await user.type(field, 'F');
    expect(onValueChange.mock.calls).toEqual([[{ color: '#abcdef' }]]);
    expect(screen.getByLabelText('Custom')).toHaveDisplayValue('#ABCDEF');

    await user.clear(field);
    await user.type(field, '12345g');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await user.clear(field);
    await user.type(field, '0ea5e9');
    expect(onValueChange.mock.lastCall).toEqual([{ color: '#0ea5e9' }]);
    expect(screen.getByRole('button', { name: '#0ea5e9' })).toBeSelected();
  });

  it('shows in the hex field the colour a swatch sets', async () => {
    const user = userEvent.setup();
    await render(<Editor initial={{}} tab="color" />);
    expect(screen.getByLabelText('Custom')).toHaveDisplayValue('');

    await user.press(screen.getByRole('button', { name: '#ec4899' }));

    expect(screen.getByLabelText('Custom')).toHaveDisplayValue('#ec4899');
  });

  it("makes the picked photo's own uri the image without onUpload, in place of the emoji", async () => {
    launch.mockResolvedValue(picked(PHOTO));
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor initial={{ emoji: '\u{1F600}', color: '#6366f1' }} onValueChange={onValueChange} tab="upload" />,
    );
    expect(screen.queryByLabelText('Current avatar')).toBeNull();

    await user.press(chooseImage());

    expect(launch).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls).toEqual([[{ emoji: null, imageUrl: PHOTO.uri, color: '#6366f1' }]]);
    expect(screen.getByLabelText('Current avatar')).toBeOnTheScreen();
  });

  it('hands the picked photo to onUpload and makes the URL it resolves the image, uploading meanwhile', async () => {
    launch.mockResolvedValue(picked(PHOTO));
    const upload = deferred<string | null>();
    const onUpload = jest.fn(() => upload.promise);
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Editor initial={{}} onValueChange={onValueChange} onUpload={onUpload} tab="upload" />);

    await user.press(chooseImage());

    expect(onUpload.mock.calls).toEqual([[PHOTO]]);
    expect(screen.getByText('Uploading...')).toBeOnTheScreen();
    expect(uploadPane()).toBeBusy();
    expect(chooseImage()).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();

    await act(async () => upload.resolve('https://cdn.test/me.png'));

    expect(onValueChange.mock.calls).toEqual([[{ emoji: null, imageUrl: 'https://cdn.test/me.png' }]]);
    expect(screen.getByText('Upload an image')).toBeOnTheScreen();
    expect(uploadPane()).not.toBeBusy();
    expect(chooseImage()).toBeEnabled();
  });

  it('keeps a colour picked while an upload runs once the upload resolves', async () => {
    launch.mockResolvedValue(picked(PHOTO));
    const upload = deferred<string | null>();
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor
        initial={{ color: '#6366f1' }}
        onValueChange={onValueChange}
        onUpload={() => upload.promise}
        tab="upload"
      />,
    );

    await user.press(chooseImage());
    await user.press(screen.getByRole('tab', { name: 'Color' }));
    await user.press(screen.getByRole('button', { name: '#ec4899' }));
    await act(async () => upload.resolve('https://cdn.test/me.png'));

    expect(onValueChange.mock.lastCall).toEqual([
      { color: '#ec4899', emoji: null, imageUrl: 'https://cdn.test/me.png' },
    ]);
  });

  it.each([
    ['resolves null', () => Promise.resolve(null)],
    ['returns null', () => null],
    ['rejects', () => Promise.reject(new Error('upload failed'))],
    [
      'throws',
      () => {
        throw new Error('upload failed');
      },
    ],
  ])('keeps the avatar and stops uploading when onUpload %s', async (_how, onUpload) => {
    launch.mockResolvedValue(picked(PHOTO));
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor initial={{ color: '#6366f1' }} onValueChange={onValueChange} onUpload={onUpload} tab="upload" />,
    );

    await user.press(chooseImage());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText('Upload an image')).toBeOnTheScreen();
    expect(uploadPane()).not.toBeBusy();
    expect(chooseImage()).toBeEnabled();
  });

  it('changes nothing when the photo library is closed without a pick', async () => {
    launch.mockResolvedValue(CANCELLED);
    const onUpload = jest.fn(() => 'https://cdn.test/me.png');
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(
      <Editor initial={{ emoji: '\u{1F600}' }} onValueChange={onValueChange} onUpload={onUpload} tab="upload" />,
    );

    await user.press(chooseImage());

    expect(launch).toHaveBeenCalledTimes(1);
    expect(onUpload).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(chooseImage()).toBeEnabled();
  });
});
