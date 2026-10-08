import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { CommandRegistry } from './command-registry.js';
import { CommandArgumentError, UnknownCommandError } from '../errors.js';

describe('CommandRegistry', () => {
  it('validates arguments and executes a valid command', () => {
    const registry = new CommandRegistry();
    const run = vi.fn(() => true);
    registry.register('setHeading', {
      args: z.object({ level: z.number().int().min(1).max(3) }),
      run,
    });

    expect(registry.dispatch('setHeading', { level: 2 })).toBe(true);
    expect(run).toHaveBeenCalledWith({ level: 2 });
  });

  it('rejects invalid arguments WITHOUT running the command', () => {
    const registry = new CommandRegistry();
    const run = vi.fn(() => true);
    registry.register('setHeading', {
      args: z.object({ level: z.number().int().min(1).max(3) }),
      run,
    });

    expect(() => registry.dispatch('setHeading', { level: 9 })).toThrow(CommandArgumentError);
    expect(run).not.toHaveBeenCalled(); // no mutation on invalid input
  });

  it('throws UnknownCommandError for an unregistered name', () => {
    const registry = new CommandRegistry();
    expect(() => registry.dispatch('nope')).toThrow(UnknownCommandError);
  });

  it('passes raw args through when a command declares no schema', () => {
    const registry = new CommandRegistry();
    const run = vi.fn(() => true);
    registry.register('insert', { run });
    registry.dispatch('insert', { any: 'thing' });
    expect(run).toHaveBeenCalledWith({ any: 'thing' });
  });

  it('can() is false for unknown commands and invalid args, never throws', () => {
    const registry = new CommandRegistry();
    registry.register('setHeading', {
      args: z.object({ level: z.number().int().min(1).max(3) }),
      run: () => true,
      can: () => true,
    });

    expect(registry.can('setHeading', { level: 2 })).toBe(true);
    expect(registry.can('setHeading', { level: 99 })).toBe(false);
    expect(registry.can('missing')).toBe(false);
  });
});
