import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@/components/ui/bubble';
import { Marker, MarkerContent } from '@/components/ui/marker';
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message';
import { Text } from '@/components/ui/text';

const me = 'https://ui.shadcn.com/avatars/10.png';
const rabbit = 'https://ui.shadcn.com/avatars/02.png';

function MeAvatar(): ReactNode {
  return (
    <MessageAvatar>
      <Avatar alt="@me">
        <AvatarImage source={{ uri: me }} />
        <AvatarFallback>
          <Text>ME</Text>
        </AvatarFallback>
      </Avatar>
    </MessageAvatar>
  );
}

function RabbitAvatar(): ReactNode {
  return (
    <MessageAvatar>
      <Avatar alt="@rabbit">
        <AvatarImage source={{ uri: rabbit }} />
        <AvatarFallback>
          <Text>R</Text>
        </AvatarFallback>
      </Avatar>
    </MessageAvatar>
  );
}

function MessageDemo(): ReactNode {
  return (
    <View className="w-full max-w-sm gap-6">
      <Message align="end">
        <MeAvatar />
        <MessageContent>
          <Bubble>
            <BubbleContent>Deploying to prod real quick.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <RabbitAvatar />
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>It's 4:55 PM. On a Friday.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MeAvatar />
        <MessageContent>
          <Bubble>
            <BubbleContent>It's a one-line change.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
      <Message>
        <RabbitAvatar />
        <MessageContent>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent>{"It's always a one-line change \u{1F62D}."}</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>Alright, let me take a look.</BubbleContent>
              <BubbleReactions role="img" aria-label="Reactions: thumbs up">
                <Text>{'\u{1F44D}'}</Text>
              </BubbleReactions>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>
      <Marker role="status">
        <MarkerContent>
          <Text className="font-medium">Oliver</Text> is typing...
        </MarkerContent>
      </Marker>
    </View>
  );
}

export { MessageDemo };
