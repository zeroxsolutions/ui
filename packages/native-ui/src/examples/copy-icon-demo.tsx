import type { LucideProps } from 'lucide-react-native';
import { useCallback, useRef, type ReactNode } from 'react';

import { CopyIcon, type CopyIconHandle } from '@/components/general/copy-icon';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** A copy button whose icon plays when it is pressed or takes focus. */
function CopyIconDemo(): ReactNode {
  const icon = useRef<CopyIconHandle>(null);
  // Icon's props take no ref, so the glyph it draws takes the handle's ref itself.
  const Glyph = useCallback((props: LucideProps) => <CopyIcon {...props} ref={icon} />, []);
  const start = (): void => icon.current?.startAnimation();

  return (
    <Button variant="outline" onPressIn={start} onFocus={start} onBlur={() => icon.current?.stopAnimation()}>
      <Icon as={Glyph} />
      <Text>Copy</Text>
    </Button>
  );
}

export { CopyIconDemo };
