import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@/components/ui/bubble';
import { Text } from '@/components/ui/text';

function BubbleDemo(): ReactNode {
  return (
    <View className="w-full max-w-sm gap-8">
      <Bubble align="end">
        <BubbleContent>Hey there! what's up?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>I can group messages, switch sides, and keep the whole thread easy to scan.</BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <Text>{'\u{1F44D}'}</Text>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
      <Bubble align="end">
        <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>Yes. You are reading a demo that is demoing itself. Very meta. Very on-brand.</BubbleContent>
        <BubbleReactions role="img" aria-label="Reactions: thumbs up, fire, eyes, and 2 more">
          <Text>{'\u{1F44D}'}</Text>
          <Text>{'\u{1F525}'}</Text>
          <Text>{'\u{1F440}'}</Text>
          <Text>+2</Text>
        </BubbleReactions>
      </Bubble>
    </View>
  );
}

export { BubbleDemo };
