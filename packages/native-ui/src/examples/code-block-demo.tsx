import { Download, FileCode, TextWrap } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Share, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from '@/components/ui/code-block';
import { Icon } from '@/components/ui/icon';
import { useHighlightedCode } from '@/hooks/use-highlighted-code';

const code = `import { streamText } from "ai"

export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant. Answer in one short paragraph.",
    messages,
  })

  return result.toUIMessageStreamResponse()
}`;

/** Saves `value` as `filename` on the web, and offers it to the share sheet on a device, which has no downloads. */
function download(value: string, filename: string): void {
  if (Platform.OS !== 'web') {
    void Share.share({ title: filename, message: value });
    return;
  }
  const url = URL.createObjectURL(new Blob([value], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CodeBlockDemo(): ReactNode {
  const [wrap, setWrap] = useState(false);
  const lines = useHighlightedCode(code, 'ts');

  return (
    <View className="w-full max-w-lg">
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>
            <Icon as={FileCode} />
            app/api/chat/route.ts
          </CodeBlockTitle>
          <CodeBlockActions>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Wrap lines"
              // A device has no pressed state to announce, so there the toggle reads as selected.
              {...(Platform.OS === 'web' ? { 'aria-pressed': wrap } : { accessibilityState: { selected: wrap } })}
              onPress={() => setWrap(!wrap)}
            >
              <Icon as={TextWrap} className={wrap ? 'text-foreground' : undefined} />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Download" onPress={() => download(code, 'route.ts')}>
              <Icon as={Download} />
            </Button>
            <CodeBlockCopyButton value={code} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent wrap={wrap} lineNumbers>
          {lines.map((line, index) => (
            <CodeBlockLine key={index} variant={index >= 5 && index <= 9 ? 'highlighted' : 'default'}>
              {line}
            </CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </View>
  );
}

export { CodeBlockDemo };
