import { render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
  type UnsavedChangesToolbarSide,
  type UnsavedChangesToolbarState,
} from './unsaved-changes-toolbar';

type ExampleProps = {
  side?: UnsavedChangesToolbarSide;
  state?: UnsavedChangesToolbarState;
  message?: string;
  onReset?: () => void;
  onSave?: () => void;
};

function Example({ side, state, message = 'You have unsaved changes.', onReset, onSave }: ExampleProps) {
  return (
    <UnsavedChangesToolbar side={side} state={state} testID="toolbar">
      <UnsavedChangesToolbarMessage>{message}</UnsavedChangesToolbarMessage>
      <UnsavedChangesToolbarActions>
        <UnsavedChangesToolbarReset onPress={onReset}>Reset</UnsavedChangesToolbarReset>
        <UnsavedChangesToolbarSave onPress={onSave}>
          {state === 'saving' ? 'Saving...' : 'Save changes'}
        </UnsavedChangesToolbarSave>
      </UnsavedChangesToolbarActions>
    </UnsavedChangesToolbar>
  );
}

// The name of a hidden spinner's label still reaches the name Testing Library computes, so match the label as a part of it.
const SAVING = /Saving\.\.\./;

function toolbarClasses(): string[] {
  return emittedClasses(screen.getByTestId('toolbar').props.className);
}

function messageClasses(): string[] {
  return emittedClasses(screen.getByText('You have unsaved changes.').props.className);
}

let announce: jest.SpyInstance;

beforeEach(() => {
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
});

// React Native's jest mock makes announceForAccessibility one shared mock, so its calls carry over between tests.
const initialPlatform = Platform.OS;

afterEach(() => {
  Platform.OS = initialPlatform;
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('UnsavedChangesToolbar', () => {
  it('floats 16px from the bottom edge by default', async () => {
    await render(<Example />);

    expect(toolbarClasses()).toEqual(expect.arrayContaining(['absolute', 'bottom-4', 'inset-x-4']));
    expect(toolbarClasses()).not.toContain('top-4');
  });

  it('floats 16px from the top edge for side "top"', async () => {
    await render(<Example side="top" />);

    expect(toolbarClasses()).toEqual(expect.arrayContaining(['absolute', 'top-4']));
    expect(toolbarClasses()).not.toContain('bottom-4');
  });

  it('is a group for a screen reader', async () => {
    await render(<Example />);

    expect(screen.getByTestId('toolbar').props.role).toBe('group');
  });

  it('keeps the default message tone while state is default', async () => {
    await render(<Example state="default" />);

    expect(messageClasses()).not.toContain('text-destructive');
    expect(toolbarClasses()).not.toContain('border-destructive');
  });

  it('keeps the default message tone while saving', async () => {
    await render(<Example state="saving" />);

    expect(messageClasses()).not.toContain('text-destructive');
  });

  it('turns the message destructive for error, and leaves the border', async () => {
    await render(<Example state="error" />);

    expect(messageClasses()).toContain('text-destructive');
    expect(toolbarClasses()).not.toContain('border-destructive');
  });

  it('turns the message and the border destructive for attention', async () => {
    await render(<Example state="attention" />);

    expect(messageClasses()).toContain('text-destructive');
    expect(toolbarClasses()).toContain('border-destructive');
  });

  it('throws when a part is rendered outside the toolbar', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<UnsavedChangesToolbarMessage>Hi</UnsavedChangesToolbarMessage>)).rejects.toThrow(
      'UnsavedChangesToolbar parts must be used within <UnsavedChangesToolbar>',
    );
  });
});

describe('UnsavedChangesToolbarReset and UnsavedChangesToolbarSave', () => {
  it('call their handlers when pressed outside saving', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    const onSave = jest.fn();
    await render(<Example onReset={onReset} onSave={onSave} />);

    await user.press(screen.getByRole('button', { name: 'Reset' }));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disable both buttons while saving, so a press does nothing', async () => {
    const user = userEvent.setup();
    const onReset = jest.fn();
    const onSave = jest.fn();
    await render(<Example state="saving" onReset={onReset} onSave={onSave} />);

    await user.press(screen.getByRole('button', { name: 'Reset' }));
    await user.press(screen.getByRole('button', { name: SAVING }));

    expect(onReset).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByRole('button', { name: SAVING })).toBeDisabled();
  });

  it('keep Save in the accessibility tree while saving, marked disabled, so a screen reader stays on it', async () => {
    await render(<Example state="saving" />);

    const save = screen.getByRole('button', { name: SAVING });
    expect(save.props.accessibilityState).toMatchObject({ disabled: true });
    expect(save.props.accessible).not.toBe(false);
  });

  it('show a spinner in Save only while saving, hidden from a screen reader', async () => {
    const { rerender } = await render(<Example state="default" />);
    expect(screen.queryByRole('progressbar', { includeHiddenElements: true })).toBeNull();

    await rerender(<Example state="saving" />);

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('progressbar', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('keep a button disabled that the caller disables outside saving', async () => {
    await render(
      <UnsavedChangesToolbar>
        <UnsavedChangesToolbarReset disabled>Reset</UnsavedChangesToolbarReset>
      </UnsavedChangesToolbar>,
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });
});

describe('UnsavedChangesToolbarMessage', () => {
  it('is a polite live region', async () => {
    await render(<Example />);

    expect(screen.getByText('You have unsaved changes.').props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces a changed message on iOS, and not the first render', async () => {
    Platform.OS = 'ios';
    const { rerender } = await render(<Example message="You have unsaved changes." />);
    expect(announce).not.toHaveBeenCalled();

    await rerender(<Example message="Could not save." state="error" />);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith('Could not save.');

    await rerender(<Example message="Could not save." state="error" />);
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('leaves the announcing to the live region on Android, so the change is spoken once', async () => {
    Platform.OS = 'android';
    const { rerender } = await render(<Example />);

    await rerender(<Example message="Could not save." state="error" />);

    expect(announce).not.toHaveBeenCalled();
    expect(screen.getByText('Could not save.').props.accessibilityLiveRegion).toBe('polite');
  });
});
