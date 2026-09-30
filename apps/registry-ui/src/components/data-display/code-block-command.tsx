'use client';

import { TerminalIcon } from 'lucide-react';
import { useMemo, useRef, type ComponentProps, type ReactNode } from 'react';

import { copyToClipboard, useCopiedState } from '@/components/data-display/copy-button';
import { useConfig, type Config } from '@/hooks/use-config';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CheckIcon } from '@/registry/bases/base-ui/ui/check';
import { CopyIcon, type CopyIconHandle } from '@/registry/bases/base-ui/ui/copy';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

type PackageManager = Config['packageManager'];

interface CodeBlockCommandProps extends ComponentProps<'pre'> {
  __npm__?: string;
  __yarn__?: string;
  __pnpm__?: string;
  __bun__?: string;
}

/**
 * An npm command under a tab per package manager, upstream's: the reader's manager is remembered
 * across blocks and visits, and the copy button copies the command its tab shows. The command scrolls
 * sideways in a `ScrollArea` where upstream's box scrolls itself; the copy button sits outside it.
 */
function CodeBlockCommand({ __npm__, __yarn__, __pnpm__, __bun__ }: CodeBlockCommandProps): ReactNode {
  const [config, setConfig] = useConfig();
  const { hasCopied, markCopied, checkIconRef } = useCopiedState();
  const copyIconRef = useRef<CopyIconHandle>(null);

  const packageManager = config.packageManager;
  const tabs = useMemo(
    () => ({ pnpm: __pnpm__, npm: __npm__, yarn: __yarn__, bun: __bun__ }),
    [__npm__, __pnpm__, __yarn__, __bun__],
  );

  async function copyCommand(): Promise<void> {
    const command = tabs[packageManager];
    if (command && (await copyToClipboard(command))) markCopied();
  }

  return (
    <div>
      <Tabs
        value={packageManager}
        className="gap-0"
        onValueChange={(value) => setConfig({ ...config, packageManager: value as PackageManager })}
      >
        <div className="border-border/50 flex items-center gap-2 border-b px-3 py-1">
          <div className="bg-foreground flex size-4 items-center justify-center rounded-[1px] opacity-70">
            <TerminalIcon className="text-code size-3" aria-hidden="true" />
          </div>
          <TabsList className="rounded-none bg-transparent p-0">
            {Object.keys(tabs).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-active:border-input data-active:bg-background! h-7 border border-transparent pt-0.5 shadow-none!"
              >
                {key}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <ScrollArea className="**:data-[slot=scroll-area-viewport]:overscroll-x-contain">
          {Object.entries(tabs).map(([key, value]) => (
            <TabsContent key={key} value={key} className="mt-0 px-4 py-3.5">
              <pre>
                <code className="relative font-mono text-sm leading-none" data-language="bash">
                  {value}
                </code>
              </pre>
            </TabsContent>
          ))}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Tabs>
      {/* top-1.5, not upstream's top-2: base-nova's tab list is h-8, so this centres the button in the tab row. */}
      <Button
        data-slot="copy-button"
        size="icon"
        variant="ghost"
        className="absolute top-1.5 right-2 z-10 size-7 opacity-70 hover:opacity-100 focus-visible:opacity-100"
        onClick={copyCommand}
        onMouseEnter={() => copyIconRef.current?.startAnimation()}
        onMouseLeave={() => copyIconRef.current?.stopAnimation()}
        onFocus={() => copyIconRef.current?.startAnimation()}
        onBlur={() => copyIconRef.current?.stopAnimation()}
      >
        <span className="sr-only">Copy</span>
        {hasCopied ? <CheckIcon ref={checkIconRef} /> : <CopyIcon ref={copyIconRef} />}
      </Button>
    </div>
  );
}

export { CodeBlockCommand };
