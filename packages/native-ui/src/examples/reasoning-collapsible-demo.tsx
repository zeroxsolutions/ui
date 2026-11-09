import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from '@/components/layout/reasoning-collapsible';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useReasoningCollapsible } from '@/hooks/use-reasoning-collapsible';

const REASONING_TEXT = "Checking the last deploy's logs for the timeout, then narrowing it to the retry policy.";

/** The trigger's label, worded from the live reasoning state. */
function ReasoningLabel(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
}

/** A reasoning disclosure the caller starts and stops streaming. */
function ReasoningCollapsibleDemo(): ReactNode {
  const [streaming, setStreaming] = useState(false);

  return (
    <View className="w-full flex-col gap-3">
      <Button size="sm" variant="outline" className="self-start" onPress={() => setStreaming((current) => !current)}>
        <Text>{streaming ? 'Stop stream' : 'Start stream'}</Text>
      </Button>
      <ReasoningCollapsible streaming={streaming}>
        <ReasoningCollapsibleTrigger>
          <ReasoningLabel />
        </ReasoningCollapsibleTrigger>
        <ReasoningCollapsibleContent>{REASONING_TEXT}</ReasoningCollapsibleContent>
      </ReasoningCollapsible>
    </View>
  );
}

export { ReasoningCollapsibleDemo };
