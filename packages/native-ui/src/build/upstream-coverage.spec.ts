import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from 'shadcn/schema';

interface UpstreamCoverage {
  notPorted: Record<string, string>;
  deferred: Record<string, string>;
}

const PROJECT = join(__dirname, '../..');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(PROJECT, path), 'utf8')) as T;
}

/** The `registry:ui` names upstream's base-vega registry lists, as upstream-refresh last saved them. */
const upstreamItems = readJson<string[]>('styles/upstream/registry-ui-items.json');
const ported = new Set(readJson<Registry>('registry.json').items.map((item) => item.name));
const coverage = readJson<UpstreamCoverage>('upstream-coverage.json');
const notPorted = Object.keys(coverage.notPorted);
const deferred = Object.keys(coverage.deferred);

/** Upstream items still to be ported; the task that ports one takes its name off this list. */
const PENDING = ['carousel', 'sonner'];

describe('the native registry against upstream', () => {
  it('reads a non-empty upstream item list', () => {
    expect(upstreamItems.length).toBeGreaterThan(0);
  });

  it('ports every upstream item, or lists it as not ported, deferred or pending', () => {
    const listed = new Set([...notPorted, ...deferred, ...PENDING]);

    expect(upstreamItems.filter((name) => !ported.has(name) && !listed.has(name))).toEqual([]);
  });

  it('lists no ported item as pending, not ported or deferred', () => {
    expect([...PENDING, ...notPorted, ...deferred].filter((name) => ported.has(name))).toEqual([]);
  });

  it('lists only names upstream still has', () => {
    const upstream = new Set(upstreamItems);

    expect([...PENDING, ...notPorted, ...deferred].filter((name) => !upstream.has(name))).toEqual([]);
  });
});
