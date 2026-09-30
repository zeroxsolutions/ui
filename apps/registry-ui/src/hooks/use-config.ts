'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** The docs' choices a reader makes once for every page: the package manager and the install route. */
export interface Config {
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun';
  installationType: 'cli' | 'manual';
}

const STORAGE_KEY = 'config';
const DEFAULT_CONFIG: Config = { packageManager: 'pnpm', installationType: 'cli' };

const listeners = new Set<() => void>();
// The stored string and the config parsed from it, so an unchanged value reads as the same object.
let cached: { raw: string | null; config: Config } | undefined;
// The config set on this page when storage refuses to keep it.
let unstored: Config | undefined;

function read(): Config {
  if (unstored) return unstored;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return DEFAULT_CONFIG;
  }
  if (cached?.raw === raw) return cached.config;
  let stored: Partial<Config> = {};
  try {
    stored = JSON.parse(raw ?? '{}') as Partial<Config>;
  } catch {
    // An unreadable value: the defaults stand.
  }
  cached = { raw, config: { ...DEFAULT_CONFIG, ...stored } };
  return cached.config;
}

function write(config: Config): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    unstored = config;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab's choice arrives as a storage event.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * The reader's docs config and a setter, kept in `localStorage` under `config` as upstream's is, and
 * shared by every block on the page, so choosing `npm` in one install block switches them all. The
 * server renders the defaults.
 */
export function useConfig(): [Config, (config: Config) => void] {
  const config = useSyncExternalStore(subscribe, read, () => DEFAULT_CONFIG);
  const setConfig = useCallback((next: Config) => write(next), []);
  return [config, setConfig];
}
