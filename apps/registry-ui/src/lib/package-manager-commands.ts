/** A shell command as each package manager spells it. */
export interface PackageManagerCommands {
  pnpm: string;
  npm: string;
  yarn: string;
  bun: string;
}

/**
 * `raw` as each package manager spells it, when it is an npm command one of them can rewrite: an
 * `npm install`, `npx create-`, `npm create`, `npx` or `npm run` line, as upstream's `__npm__`
 * transformer reads them.
 */
export function packageManagerCommands(raw: string): PackageManagerCommands | undefined {
  if (raw.startsWith('npm install')) {
    return {
      pnpm: raw.replace('npm install', 'pnpm add'),
      npm: raw,
      yarn: raw.replace('npm install', 'yarn add'),
      bun: raw.replace('npm install', 'bun add'),
    };
  }
  if (raw.startsWith('npx create-')) {
    return {
      pnpm: raw.replace('npx create-', 'pnpm create '),
      npm: raw,
      yarn: raw.replace('npx create-', 'yarn create '),
      bun: raw.replace('npx', 'bunx --bun'),
    };
  }
  if (raw.startsWith('npm create')) {
    return {
      pnpm: raw.replace('npm create', 'pnpm create'),
      npm: raw,
      yarn: raw.replace('npm create', 'yarn create'),
      bun: raw.replace('npm create', 'bun create'),
    };
  }
  if (raw.startsWith('npx')) {
    return {
      pnpm: raw.replace('npx', 'pnpm dlx'),
      npm: raw,
      yarn: raw.replace('npx', 'yarn dlx'),
      bun: raw.replace('npx', 'bunx --bun'),
    };
  }
  if (raw.startsWith('npm run')) {
    return {
      pnpm: raw.replace('npm run', 'pnpm'),
      npm: raw,
      yarn: raw.replace('npm run', 'yarn'),
      bun: raw.replace('npm run', 'bun'),
    };
  }
  return undefined;
}
