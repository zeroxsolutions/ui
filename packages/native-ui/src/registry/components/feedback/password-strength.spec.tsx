import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  PasswordStrength,
  PasswordStrengthMeter,
  PasswordStrengthRequirement,
  PasswordStrengthRequirements,
  type PasswordStrengthValue,
} from './password-strength';

beforeEach(() => {
  jest.clearAllMocks();
});

function Example({ strength }: { strength: PasswordStrengthValue }) {
  return (
    <PasswordStrength strength={strength}>
      <PasswordStrengthMeter valueText={strength}>Password strength</PasswordStrengthMeter>
    </PasswordStrength>
  );
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

describe('PasswordStrengthMeter', () => {
  it.each([
    ['weak', 33],
    ['fair', 67],
    ['strong', 100],
  ] as const)('reads a %s password as %s on the bar, with its text', async (strength, now) => {
    await render(<Example strength={strength} />);

    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 100, now, text: strength });
    expect(screen.getByText(strength)).toBeOnTheScreen();
    expect(screen.getByText('Password strength')).toBeOnTheScreen();
  });

  it('follows the strength when it changes', async () => {
    const { rerender } = await render(<Example strength="weak" />);

    await rerender(<Example strength="strong" />);

    expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 100, text: 'strong' });
  });

  it('labels the bar with the meter name', async () => {
    await render(<Example strength="weak" />);

    expect(screen.getByRole('progressbar', { name: 'Password strength' })).toBeOnTheScreen();
  });

  it('marks the strength text as a polite live region', async () => {
    await render(<Example strength="weak" />);

    expect(screen.getByText('weak').props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces the strength on iOS when it changes, and not on the first render', async () => {
    Platform.OS = 'ios';
    const { rerender } = await render(<Example strength="weak" />);
    expect(announce).not.toHaveBeenCalled();

    await rerender(<Example strength="fair" />);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenLastCalledWith('fair');

    await rerender(<Example strength="fair" />);
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('leaves the announcing to the live region on Android, so the change is spoken once', async () => {
    Platform.OS = 'android';
    const { rerender } = await render(<Example strength="weak" />);

    await rerender(<Example strength="fair" />);

    expect(announce).not.toHaveBeenCalled();
    expect(screen.getByText('fair').props.accessibilityLiveRegion).toBe('polite');
  });

  it('throws when a part is rendered outside PasswordStrength', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      render(<PasswordStrengthMeter valueText="weak">Password strength</PasswordStrengthMeter>),
    ).rejects.toThrow('PasswordStrength parts must be used within <PasswordStrength>');
  });
});

describe('PasswordStrengthRequirement', () => {
  it('says Met while met', async () => {
    await render(
      <PasswordStrengthRequirement met testID="row">
        At least 15 characters
      </PasswordStrengthRequirement>,
    );

    expect(screen.getByTestId('row').props.accessibilityValue).toEqual({ text: 'Met' });
  });

  it('says Not met while unmet', async () => {
    await render(<PasswordStrengthRequirement testID="row">At least 15 characters</PasswordStrengthRequirement>);

    expect(screen.getByTestId('row').props.accessibilityValue).toEqual({ text: 'Not met' });
  });

  it("says the caller's words for each state", async () => {
    const { rerender } = await render(
      <PasswordStrengthRequirement met metLabel="Rempli" unmetLabel="Non rempli" testID="row">
        Au moins 15 caracteres
      </PasswordStrengthRequirement>,
    );
    expect(screen.getByTestId('row').props.accessibilityValue).toEqual({ text: 'Rempli' });

    await rerender(
      <PasswordStrengthRequirement metLabel="Rempli" unmetLabel="Non rempli" testID="row">
        Au moins 15 caracteres
      </PasswordStrengthRequirement>,
    );
    expect(screen.getByTestId('row').props.accessibilityValue).toEqual({ text: 'Non rempli' });
  });

  it('is one element for a screen reader, so the text and its state are read together', async () => {
    await render(
      <PasswordStrength strength="weak">
        <PasswordStrengthRequirements>
          <PasswordStrengthRequirement testID="row">At least 15 characters</PasswordStrengthRequirement>
        </PasswordStrengthRequirements>
      </PasswordStrength>,
    );

    expect(screen.getByTestId('row').props.accessible).toBe(true);
  });
});
