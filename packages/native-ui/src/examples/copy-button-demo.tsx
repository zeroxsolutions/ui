import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { CopyButton } from '@/components/feedback/copy-button';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent } from '@/components/ui/item';
import { Text } from '@/components/ui/text';

const COMMAND = 'pnpm add @zeroxsolutions/icons';
const TOKEN = 'zx_live_4f9c2a7e';

/**
 * An install command with its own copy button, announcing the copy inline, and an access token that copies only
 * once it is shown.
 */
function CopyButtonDemo(): ReactNode {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  return (
    <View className="w-full max-w-sm flex-col gap-2">
      <Item variant="outline" size="sm">
        <ItemContent>
          <Text className="font-mono">{COMMAND}</Text>
        </ItemContent>
        <ItemActions>
          {copied && <Text className="text-muted-foreground text-xs">Copied</Text>}
          <CopyButton value={COMMAND} onCopied={() => setCopied(true)} />
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm">
        <ItemContent>
          <Text className="font-mono">{shown ? TOKEN : 'zx_live_********'}</Text>
        </ItemContent>
        <ItemActions>
          <Button
            variant="ghost"
            size="xs"
            onPress={() => {
              setShown(!shown);
              setHint(null);
            }}
          >
            <Text>{shown ? 'Hide' : 'Show'}</Text>
          </Button>
          <CopyButton
            value={TOKEN}
            label="Copy token"
            copiedLabel="Token copied"
            onPress={(event) => {
              if (shown) return;
              event.preventDefault();
              setHint('Show the token to copy it');
            }}
          />
        </ItemActions>
      </Item>
      {hint && <Text className="text-muted-foreground text-xs">{hint}</Text>}
    </View>
  );
}

export { CopyButtonDemo };
