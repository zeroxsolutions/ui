import { render, screen, userEvent } from '@testing-library/react-native';
import { InputGroupAddon } from '../../ui/input-group';
import { PasswordInput, PasswordInputInput, PasswordInputToggle } from './password-input';
import { focus, handleOf } from '../../icons/animated-icon.testing';
import { EyeIcon } from '../../icons/eye-icon';
import { EyeOffIcon } from '../../icons/eye-off-icon';

jest.mock('../../icons/eye-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('eye-icon'),
);
jest.mock('../../icons/eye-off-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('eye-off-icon'),
);

// React Native's jest mock gives every TextInput one shared `focus` mock, so its calls carry over between tests.
afterEach(() => {
  jest.clearAllMocks();
});

describe('PasswordInput', () => {
  it('hides the password until the toggle is pressed, and hides it again on a second press', async () => {
    const user = userEvent.setup();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle />
        </InputGroupAddon>
      </PasswordInput>,
    );

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);

    await user.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);

    await user.press(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('keeps focus in the field while the toggle shows the password', async () => {
    const user = userEvent.setup();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" onBlur={onBlur} onChangeText={onChangeText} />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle />
        </InputGroupAddon>
      </PasswordInput>,
    );

    await user.type(screen.getByLabelText('Password'), 'hunter2', { skipBlur: true });
    await user.press(screen.getByRole('button', { name: 'Show password' }));

    expect(onChangeText).toHaveBeenLastCalledWith('hunter2');
    expect(onBlur).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  });

  it("names the toggle by the caller's labels in the caller's language", async () => {
    const user = userEvent.setup();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Mot de passe" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle showLabel="Afficher le mot de passe" hideLabel="Masquer le mot de passe" />
        </InputGroupAddon>
      </PasswordInput>,
    );

    await user.press(screen.getByRole('button', { name: 'Afficher le mot de passe' }));

    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeOnTheScreen();
  });

  it("runs the caller's onPress beside the toggle", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle onPress={onPress} />
        </InputGroupAddon>
      </PasswordInput>,
    );

    await user.press(screen.getByRole('button', { name: 'Show password' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  });

  it('turns off capitals and autocorrect, so a shown password is not changed as it is typed', async () => {
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
      </PasswordInput>,
    );

    expect(screen.getByLabelText('Password').props).toMatchObject({ autoCapitalize: 'none', autoCorrect: false });
  });

  it('throws when a part is rendered outside PasswordInput', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<PasswordInputInput aria-label="Password" />)).rejects.toThrow(
      'PasswordInput parts must be used within <PasswordInput>',
    );
  });
});

describe('PasswordInputToggle motion', () => {
  it('starts its icon on press-in and on focus', async () => {
    const onPressIn = jest.fn();
    const onFocus = jest.fn();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle onPressIn={onPressIn} onFocus={onFocus} />
        </InputGroupAddon>
      </PasswordInput>,
    );

    await userEvent.setup().press(screen.getByRole('button', { name: 'Show password' }));
    await focus(screen.getByRole('button', { name: 'Hide password' }));

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    // The eye starts on press-in; the press swaps in the struck eye, which plays as it appears and again on focus.
    expect(handleOf(EyeIcon).startAnimation).toHaveBeenCalledTimes(1);
    expect(handleOf(EyeOffIcon).startAnimation).toHaveBeenCalledTimes(2);
    expect(handleOf(EyeIcon).stopAnimation).not.toHaveBeenCalled();
  });

  it('plays the newly shown eye once after each press flips it, and nothing on first draw', async () => {
    const user = userEvent.setup();
    await render(
      <PasswordInput>
        <PasswordInputInput aria-label="Password" />
        <InputGroupAddon align="inline-end">
          <PasswordInputToggle />
        </InputGroupAddon>
      </PasswordInput>,
    );
    expect(handleOf(EyeIcon).startAnimation).not.toHaveBeenCalled();
    expect(handleOf(EyeOffIcon).startAnimation).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: 'Show password' }));
    expect(handleOf(EyeOffIcon).startAnimation).toHaveBeenCalledTimes(1);

    await user.press(screen.getByRole('button', { name: 'Hide password' }));
    // Once on the first press-in, once as the second press swaps the eye back in.
    expect(handleOf(EyeIcon).startAnimation).toHaveBeenCalledTimes(2);
    expect(handleOf(EyeOffIcon).startAnimation).toHaveBeenCalledTimes(2);
  });
});
