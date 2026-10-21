import { render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { InputGroupAddon } from '../../ui/input-group';
import { PasswordInput, PasswordInputInput, PasswordInputToggle } from './password-input';

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
      <PasswordInput testID="group">
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
    expect(emittedClasses(screen.getByTestId('group').props.className)).toContain('border-ring');
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
