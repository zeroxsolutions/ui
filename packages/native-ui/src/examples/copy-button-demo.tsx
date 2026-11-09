import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { CopyButton } from '@/components/feedback/copy-button';
import { Text } from '@/components/ui/text';

const COMMAND = 'pnpm add @zeroxsolutions/icons';

/** An install command with its own copy button, announcing the copy inline. */
function CopyButtonDemo(): ReactNode {
  const [copied, setCopied] = useState(false);

  return (
    <View className="border-border w-full max-w-sm flex-row items-center justify-between gap-2 rounded-md border px-3 py-2">
      <Text className="font-mono text-sm">{COMMAND}</Text>
      <View className="flex-row items-center gap-2">
        {copied && <Text className="text-muted-foreground text-xs">Copied</Text>}
        <CopyButton value={COMMAND} onCopied={() => setCopied(true)} />
      </View>
    </View>
  );
}

export { CopyButtonDemo };
