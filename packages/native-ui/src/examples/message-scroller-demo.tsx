import {
  ArrowUp,
  Globe,
  Image as ImageIcon,
  MessageCircleDashed,
  Paperclip,
  Plus,
  RotateCw,
  Telescope,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { InputGroup, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { Message, MessageContent } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** The demo's conversation: each question the reader sends, and the reply streamed back to it. */
const script = [
  {
    question:
      "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
    answer:
      "That's the classic streaming scroll problem. Wrap your message list in `MessageScroller` and turn on `autoScroll`: the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved. You get smooth streaming without fighting the user's intent.",
  },
  {
    question:
      'Okay, but when someone sends a new message the view still feels jarring, like the whole conversation reloads from the top.',
    answer:
      "MessageScrollerItem fixes that with turn anchoring. Set `scrollAnchor` on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost. The reply starts in view without that disorienting jump you get from a plain overflow container.",
  },
  {
    question: "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
    answer:
      "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out: their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, `MessageScrollerButton` appears at the bottom of the viewport. One tap jumps them back to the newest message and re-engages auto-scroll. Same pattern as Slack or iMessage: quiet when you're caught up, helpful when you're not.",
  },
  {
    question: 'Last one: does this work with assistive tech?',
    answer:
      'On the web, `MessageScrollerContent` is a log, so screen readers announce new messages as they arrive; on a phone each new message is announced as it is added.\n\nThe scroll button is a real button with a label, and it takes no focus while you are already at the bottom, so there are no ghost focus stops.',
  },
];

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };

/** How long the reply waits before it starts, and how long each word of it takes, in ms. */
const REPLY_DELAY = 1000;
const WORD_DELAY = 20;

function MessageScrollerDemo(): ReactNode {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const turn = messages.filter((message) => message.role === 'user').length;
  const next = script[turn];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = (): void => {
    if (!next || busy) return;
    setBusy(true);
    setMessages((current) => [...current, { id: `user-${turn}`, role: 'user', text: next.question }]);
    const words = next.answer.split(' ');
    words.forEach((_, index) => {
      timers.current.push(
        setTimeout(
          () => {
            const text = words.slice(0, index + 1).join(' ');
            setMessages((current) => [
              ...current.filter((message) => message.id !== `assistant-${turn}`),
              { id: `assistant-${turn}`, role: 'assistant', text },
            ]);
            if (index === words.length - 1) setBusy(false);
          },
          REPLY_DELAY + index * WORD_DELAY,
        ),
      );
    });
  };

  const reset = (): void => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(false);
    setMessages([]);
  };

  return (
    <MessageScrollerProvider>
      <View className="w-full max-w-sm flex-col gap-4">
        <Card className="h-[560px] w-full gap-0">
          <CardHeader className="border-border flex-row items-start justify-between gap-2 border-b">
            <View className="flex-1 gap-1">
              <CardTitle>New Chat</CardTitle>
              <CardDescription>How can I help you today?</CardDescription>
            </View>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Reset conversation" onPress={reset} disabled={busy}>
                  <Icon as={RotateCw} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Text>Reset</Text>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            {messages.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Icon as={MessageCircleDashed} />
                  </EmptyMedia>
                  <EmptyTitle>Morning, shadcn!</EmptyTitle>
                  <EmptyDescription>
                    What are we working on today? Press send to start a new conversation
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent aria-busy={busy} className="p-6">
                    {messages.map((message) => (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={message.role === 'user'}
                      >
                        {message.role === 'user' ? (
                          <Message align="end">
                            <MessageContent>
                              <Bubble align="end">
                                <BubbleContent>{message.text}</BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        ) : (
                          <Message>
                            <MessageContent>
                              <Text className="text-sm leading-relaxed">{message.text}</Text>
                            </MessageContent>
                          </Message>
                        )}
                      </MessageScrollerItem>
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <InputGroup>
              <View className="h-14 w-full px-3 py-2.5">
                <Text numberOfLines={2} className={busy ? 'text-sm opacity-60' : 'text-sm'}>
                  {next ? (
                    next.question
                  ) : (
                    <Text className="text-muted-foreground text-sm">No messages queued. Reset the conversation.</Text>
                  )}
                </Text>
              </View>
              <InputGroupAddon align="block-end" className="pt-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton aria-label="Add files" size="icon-sm" variant="outline">
                      <Icon as={Plus} />
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-44">
                    <DropdownMenuItem>
                      <Icon as={Paperclip} />
                      <Text>Add Photos & Files</Text>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Icon as={ImageIcon} />
                      <Text>Create Image</Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Icon as={Telescope} />
                      <Text>Deep Research</Text>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Icon as={Globe} />
                      <Text>Web Search</Text>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  variant="default"
                  size="icon-sm"
                  aria-label="Send"
                  disabled={!next || busy}
                  className="ml-auto"
                  onPress={send}
                >
                  <Icon as={ArrowUp} />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </CardFooter>
        </Card>
        <Text className="text-muted-foreground px-0.5 text-center text-xs">
          Demo is read only. Press send to send messages.
        </Text>
      </View>
    </MessageScrollerProvider>
  );
}

export { MessageScrollerDemo };
