// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { packageManagerCommands } from './package-manager-commands';

describe('packageManagerCommands', () => {
  it('spells an npx command for each package manager', () => {
    expect(packageManagerCommands('npx shadcn@latest add x')).toEqual({
      pnpm: 'pnpm dlx shadcn@latest add x',
      npm: 'npx shadcn@latest add x',
      yarn: 'yarn dlx shadcn@latest add x',
      bun: 'bunx --bun shadcn@latest add x',
    });
  });

  it('spells an npm install for each package manager', () => {
    expect(packageManagerCommands('npm install shiki')).toEqual({
      pnpm: 'pnpm add shiki',
      npm: 'npm install shiki',
      yarn: 'yarn add shiki',
      bun: 'bun add shiki',
    });
  });

  it('leaves a command no package manager rewrites alone', () => {
    expect(packageManagerCommands('git status')).toBeUndefined();
  });
});
