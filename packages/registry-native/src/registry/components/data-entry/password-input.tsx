import { Eye, EyeOff } from 'lucide-react-native';
import { createContext, useContext, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Icon } from '../../ui/icon';
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
  type InputGroupButtonProps,
  type InputGroupInputProps,
} from '../../ui/input-group';

interface PasswordInputContextValue {
  visible: boolean;
  toggle: () => void;
}

const PasswordInputContext = createContext<PasswordInputContextValue | null>(null);

function usePasswordInput(): PasswordInputContextValue {
  const context = useContext(PasswordInputContext);
  if (!context) throw new Error('PasswordInput parts must be used within <PasswordInput>');
  return context;
}

/**
 * A password field over InputGroup. The root holds whether the password shows; the caller composes a
 * PasswordInputInput and, in an InputGroupAddon, a PasswordInputToggle, beside any other addon:
 *
 *   <PasswordInput>
 *     <PasswordInputInput aria-label="Password" autoComplete="current-password" />
 *     <InputGroupAddon align="inline-end">
 *       <PasswordInputToggle />
 *     </InputGroupAddon>
 *   </PasswordInput>
 *
 * Takes every prop of InputGroup, whose focus, invalid and disabled borders it draws.
 */
function PasswordInput({ children, ...props }: ComponentProps<typeof InputGroup>): ReactNode {
  const [visible, setVisible] = useState(false);
  const context = useMemo(() => ({ visible, toggle: (): void => setVisible((current) => !current) }), [visible]);
  return (
    <PasswordInputContext.Provider value={context}>
      <InputGroup {...props}>{children}</InputGroup>
    </PasswordInputContext.Provider>
  );
}

/**
 * The password field, an InputGroupInput whose `secureTextEntry` the root sets. It types with no
 * capitals and no autocorrect, so a shown password is not changed as it is typed; the caller may
 * override either, and names the field and its `autoComplete` (`current-password` or `new-password`).
 * @throws {Error} when rendered outside a PasswordInput
 */
function PasswordInputInput(props: Omit<InputGroupInputProps, 'secureTextEntry'>): ReactNode {
  const { visible } = usePasswordInput();
  return <InputGroupInput autoCapitalize="none" autoCorrect={false} {...props} secureTextEntry={!visible} />;
}

type PasswordInputToggleProps = Omit<InputGroupButtonProps, 'children' | 'size'> & {
  /** What a screen reader calls the toggle while the password is hidden. */
  showLabel?: string;
  /** What a screen reader calls the toggle while the password shows. */
  hideLabel?: string;
};

/**
 * The show/hide toggle, a ghost `icon-xs` InputGroupButton announced as a button, drawing an eye while
 * the password is hidden and a struck eye while it shows. Its name follows the state, `showLabel`
 * then `hideLabel`, which an app passes translated. Pressing it leaves focus in the field.
 * @throws {Error} when rendered outside a PasswordInput
 */
function PasswordInputToggle({
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  onPress,
  ...props
}: PasswordInputToggleProps): ReactNode {
  const { visible, toggle } = usePasswordInput();
  return (
    <InputGroupButton
      size="icon-xs"
      variant="ghost"
      accessibilityRole="button"
      aria-label={visible ? hideLabel : showLabel}
      onPress={(event) => {
        onPress?.(event);
        toggle();
      }}
      {...props}
    >
      <Icon as={visible ? EyeOff : Eye} />
    </InputGroupButton>
  );
}

export { PasswordInput, PasswordInputInput, PasswordInputToggle };
export type { PasswordInputToggleProps };
