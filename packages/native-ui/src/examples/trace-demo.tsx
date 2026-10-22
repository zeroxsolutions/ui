import { ArrowUpRight, CircleAlert, CircleCheck, Globe } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { CodeBlock, CodeBlockContent } from '@/components/ui/code-block';
import { Icon } from '@/components/ui/icon';
import { Message, MessageContent } from '@/components/ui/message';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace';

const question = 'Why does pnpm install fail in CI?';

const reasoning =
  'CI installs with a frozen lockfile, so the install stops when package.json and pnpm-lock.yaml disagree. I should check what the last commit changed, then reproduce the install.';

const commands = [
  { command: 'pnpm --version', stdout: '10.18.0' },
  {
    command: 'git diff --stat HEAD~1 -- package.json pnpm-lock.yaml',
    stdout: ' package.json | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)',
  },
  {
    command: 'pnpm install --frozen-lockfile',
    error:
      'ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json',
  },
] as const;

const sources = [
  { url: 'https://pnpm.io/cli/install#--frozen-lockfile', title: 'pnpm install | pnpm.io' },
  { url: 'https://pnpm.io/continuous-integration', title: 'Continuous Integration | pnpm.io' },
];

const answer =
  'The last commit bumped a version in package.json without updating pnpm-lock.yaml, so the frozen install fails. Run pnpm install locally and commit the lockfile.';

/**
 * How long each step of the replay runs, in ms: thinking, the three commands, and reading the sources. The
 * demo replays the agent's run as upstream's streamed transcript does, one step after another.
 */
const STEP_DURATIONS = [1500, 700, 900, 1200, 1000];
const DONE = STEP_DURATIONS.length;

function ThinkingRow({ running }: { running: boolean }): ReactNode {
  const [open, setOpen] = useState<boolean>();

  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={running ? 'running' : undefined}>
          <TraceIcon>{running ? <Spinner /> : <Icon as={CircleCheck} />}</TraceIcon>
          <TraceTitle>{running ? 'Thinking' : 'Thought for 5s'}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Text>{reasoning}</Text>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ToolRow({ index, step }: { index: number; step: number }): ReactNode {
  const tool = commands[index];
  const running = step === index + 1;

  if (running) {
    return (
      <TraceLine status="running">
        <TraceIcon>
          <Spinner />
        </TraceIcon>
        <TraceTitle>Running {tool.command}</TraceTitle>
      </TraceLine>
    );
  }

  const failed = 'error' in tool;
  return (
    <TraceCollapsible defaultOpen={index === 2}>
      <TraceCollapsibleTrigger>
        <TraceLine status={failed ? 'error' : undefined}>
          <TraceIcon>
            <Icon as={failed ? CircleAlert : CircleCheck} />
          </TraceIcon>
          <TraceTitle>
            {failed ? 'Failed to run' : 'Ran'} {tool.command}
          </TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <CodeBlock size="sm" variant={failed ? 'destructive' : 'default'}>
          <CodeBlockContent wrap className="max-h-64">
            {failed ? tool.error : tool.stdout}
          </CodeBlockContent>
        </CodeBlock>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function SourcesRow({ running }: { running: boolean }): ReactNode {
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine status={running ? 'running' : undefined}>
          <TraceIcon>{running ? <Spinner /> : <Icon as={Globe} />}</TraceIcon>
          <TraceTitle>
            {running ? 'Using' : 'Used'} {sources.length} sources
          </TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Trace>
          {sources.map((source) => (
            <Pressable
              key={source.url}
              role="link"
              aria-label={`${source.title} (opens in the browser)`}
              className="self-start"
              onPress={() => void Linking.openURL(source.url)}
            >
              <TraceLine>
                <TraceIcon>
                  <Icon as={Globe} />
                </TraceIcon>
                <TraceTitle>{source.title}</TraceTitle>
                <TraceIcon>
                  <Icon as={ArrowUpRight} />
                </TraceIcon>
              </TraceLine>
            </Pressable>
          ))}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function TraceDemo(): ReactNode {
  // How far the agent's run has got: 0 is thinking, 1 to 3 the commands, 4 the sources, DONE the answer.
  const [step, setStep] = useState(DONE);
  // Each replay draws the run afresh, as a new transcript, so a step opened by hand closes again.
  const [run, setRun] = useState(0);
  const busy = step < DONE;

  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setStep(step + 1), STEP_DURATIONS[step]);
    return () => clearTimeout(timer);
  }, [busy, step]);

  return (
    <View className="min-h-72 w-full max-w-sm flex-col gap-4 py-6">
      <Message align="end">
        <MessageContent>
          <Bubble align="end" variant="muted">
            <BubbleContent>{question}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent className="gap-4">
          <Trace key={run}>
            <ThinkingRow running={step === 0} />
            {commands.map((_, index) => (step > index ? <ToolRow key={index} index={index} step={step} /> : null))}
            {step >= 4 ? <SourcesRow running={step === 4} /> : null}
          </Trace>
          {busy ? null : <Text className="text-sm">{answer}</Text>}
        </MessageContent>
      </Message>
      {busy ? null : (
        <Button
          variant="outline"
          size="sm"
          className="mt-auto self-start"
          onPress={() => {
            setRun(run + 1);
            setStep(0);
          }}
        >
          <Text>Replay</Text>
        </Button>
      )}
    </View>
  );
}

export { TraceDemo };
