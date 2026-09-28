'use client';

import { useState } from 'react';

import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The deployed base URL the `shadcn add` command resolves the item against. The
 * same host serves the static registry JSON under `/r/<name>.json`.
 */
const REGISTRY_BASE_URL = 'https://ui.zeroxsolutions.com';

export interface InstallationProps {
  /** Registry item name - the `<name>` segment of `/r/<name>.json`. */
  name: string;
}

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

/** The `shadcn add` invocation for a given package manager + item name. */
function installCommand(pkgManager: PackageManager, name: string): string {
  const url = `${REGISTRY_BASE_URL}/r/${name}.json`;
  switch (pkgManager) {
    case 'pnpm':
      return `pnpm dlx shadcn add ${url}`;
    case 'npm':
      return `npx shadcn add ${url}`;
    case 'yarn':
      return `yarn dlx shadcn add ${url}`;
    case 'bun':
      return `bunx --bun shadcn add ${url}`;
  }
}

/**
 * The Installation section - `CLI | Manual` outer tabs and, under CLI, a
 * `pnpm | npm | yarn | bun` `ToggleGroup`. The CLI tab shows the `shadcn add`
 * command for the selected package manager; the Manual tab links out to the
 * static registry JSON so a consumer can copy the file by hand.
 */
export function Installation({ name }: InstallationProps) {
  return (
    <section id="installation" data-slot="installation" className="scroll-mt-20">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">Installation</h2>
      <Tabs defaultValue="cli">
        <TabsList>
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
        <TabsContent value="cli">
          <CliInstallation name={name} />
        </TabsContent>
        <TabsContent value="manual">
          <ManualInstallation name={name} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function CliInstallation({ name }: { name: string }) {
  const [pkgManager, setPkgManager] = useState<PackageManager>('pnpm');
  const command = installCommand(pkgManager, name);

  return (
    <div className="flex flex-col gap-3 pt-2">
      <PackageManagerToggle value={pkgManager} onChange={setPkgManager} />
      <CodeBlock code={command} language="bash" />
    </div>
  );
}

function PackageManagerToggle({ value, onChange }: { value: PackageManager; onChange: (pkg: PackageManager) => void }) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) onChange(values[0] as PackageManager);
      }}
      aria-label="Package manager"
      data-slot="package-manager-toggle"
      className={cn('w-fit')}
    >
      {PACKAGE_MANAGERS.map((pkg) => (
        <ToggleGroupItem key={pkg} value={pkg} data-slot="package-manager-trigger" data-pkg={pkg}>
          {pkg}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function ManualInstallation({ name }: { name: string }) {
  const jsonUrl = `${REGISTRY_BASE_URL}/r/${name}.json`;
  return (
    <div className="text-muted-foreground flex flex-col gap-3 pt-2 text-sm">
      <p>Download the registry JSON and add the component files to your project:</p>
      <CodeBlock code={jsonUrl} language="text" />
    </div>
  );
}
