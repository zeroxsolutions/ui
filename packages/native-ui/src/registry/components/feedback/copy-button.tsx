import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';

const COPY_RESET_MS = 2000;

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, 'children'> {
  /** Text written to the clipboard on press. */
  value: string;
  /** Accessible name in the idle state. */
  label?: string;
  /** Accessible name shown briefly after a successful copy. */
  copiedLabel?: string;
  /** How long the copied state persists, in ms. */
  timeout?: number;
  /** Called with the value after a successful copy. */
  onCopied?: (value: string) => void;
}

/**
 * A copy-to-clipboard icon Button. After a successful copy it shows a check and takes `copiedLabel` as its
 * accessible name for `timeout` ms, then resets; a screen reader hears `copiedLabel` once the copy has
 * succeeded. A caller `onPress` runs first, and calling `event.preventDefault()` in it skips the copy.
 * Defaults to a `ghost` `icon-xs` Button, and every Button prop passes through. A write the clipboard
 * refuses leaves the button idle.
 */
function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  timeout = COPY_RESET_MS,
  onCopied,
  onPress,
  variant = 'ghost',
  size = 'icon-xs',
  ...props
}: CopyButtonProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => (): void => clearTimeout(timer.current), []);

  const copy = useCallback(() => {
    Clipboard.setStringAsync(value)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
        // A live region is Android's and the web's alone; iOS announces only what it is told to.
        if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(copiedLabel);
        onCopied?.(value);
      })
      .catch(() => {
        // A refused write leaves the button uncopied, which is all the caller sees of it.
      });
  }, [value, timeout, copiedLabel, onCopied]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        aria-label={copied ? copiedLabel : label}
        onPress={(event) => {
          onPress?.(event);
          if (!event.isDefaultPrevented()) copy();
        }}
        {...props}
      >
        <Icon as={copied ? Check : Copy} />
      </Button>
      <View aria-live="polite" pointerEvents="none" className="absolute h-px w-px overflow-hidden opacity-0">
        <Text>{copied ? copiedLabel : ''}</Text>
      </View>
    </>
  );
}

export { CopyButton };
export type { CopyButtonProps };
