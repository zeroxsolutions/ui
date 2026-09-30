'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useConfig, type Config } from '@/hooks/use-config';
import type { PackageManagerCommands } from '@/lib/package-manager-commands';
import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

type PackageManager = Config['packageManager'];

interface CodeBlockCommandProps extends Omit<ComponentProps<typeof CodeBlock>, 'code' | 'language' | 'lines'> {
  /** The command as each package manager spells it. */
  commands: PackageManagerCommands;
}

/**
 * An npm command under a tab per package manager, upstream's `CodeBlockCommand` on the registry's
 * `CodeBlock`: the header holds the shell icon, the managers' tabs and the copy button, and the block
 * shows and copies the chosen manager's spelling. The reader's manager is remembered across blocks
 * and visits. The command is shown plain, as upstream's is.
 */
function CodeBlockCommand({ commands, ...props }: CodeBlockCommandProps): ReactNode {
  const [config, setConfig] = useConfig();
  const packageManager = config.packageManager;

  return (
    <Tabs
      value={packageManager}
      className="gap-0"
      onValueChange={(value) => setConfig({ ...config, packageManager: value as PackageManager })}
    >
      <CodeBlock data-not-typeset code={commands[packageManager]} language="bash" lines={null} {...props}>
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            {/* The shell's icon alone, as upstream's terminal chip: the tabs name what runs it. */}
            <CodeBlockLanguage>{''}</CodeBlockLanguage>
            <TabsList className="rounded-none bg-transparent p-0">
              {Object.keys(commands).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-active:border-input data-active:bg-background! h-7 border border-transparent pt-0.5 shadow-none!"
                >
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeBlockCopy />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      </CodeBlock>
    </Tabs>
  );
}

export { CodeBlockCommand };
