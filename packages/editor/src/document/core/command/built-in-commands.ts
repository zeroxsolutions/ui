import type { Editor } from '@tiptap/core';
import { z } from 'zod';
import type { EngineHandle } from '../engine/engine-handle.js';
import type { ResolvedCommand } from './command-registry.js';

/**
 * The engine-backed primitive commands every editor ships with. Feature commands
 * compose these through the façade (`editor.run('toggleMark', …)`) instead of
 * touching the engine, which is what lets a feature author stay engine-free
 * while still mutating the document. The exported signature is engine-free (an
 * opaque `EngineHandle` in, a table of engine-free `ResolvedCommand`s out); the
 * real `Editor` is only used inside these closures.
 */

const attrs = z.record(z.string(), z.unknown()).optional();
const named = z.object({ name: z.string().min(1), attrs });
const content = z.union([
  z.string(),
  z.record(z.string(), z.unknown()),
  z.array(z.record(z.string(), z.unknown())),
]);

export function makeBuiltInCommands(
  handle: EngineHandle,
): Record<string, ResolvedCommand> {
  const editor = handle as unknown as Editor;
  const attrsOf = (a?: Record<string, unknown>) =>
    (a ?? {}) as Record<string, unknown>;

  // Run/probe an engine chain command by name, guarded so it no-ops when the
  // extension that provides it (heading/list/blockquote/hr — contributed by a
  // feature) is not registered. Lets a feature's toolbar/slash command compose
  // structural engine commands through the façade without engine access.
  const runEngine = (name: string, arg?: unknown): boolean => {
    const chain = editor.chain().focus() as unknown as Record<
      string,
      (a?: unknown) => { run: () => boolean }
    >;
    const command = chain[name];
    return typeof command === 'function' ? command.call(chain, arg).run() : false;
  };
  const canEngine = (name: string, arg?: unknown): boolean => {
    const probe = editor.can() as unknown as Record<
      string,
      (a?: unknown) => boolean
    >;
    const command = probe[name];
    return typeof command === 'function'
      ? Boolean(command.call(probe, arg))
      : false;
  };

  return {
    insertContent: {
      args: z.object({ content }),
      run: ({ content: c }) => editor.chain().focus().insertContent(c).run(),
    },
    setContent: {
      args: z.object({ content }),
      run: ({ content: c }) => editor.commands.setContent(c),
    },
    toggleMark: {
      args: named,
      run: ({ name, attrs: a }) =>
        editor.chain().focus().toggleMark(name, attrsOf(a)).run(),
      can: ({ name, attrs: a }) => editor.can().toggleMark(name, attrsOf(a)),
    },
    setMark: {
      args: named,
      run: ({ name, attrs: a }) =>
        editor.chain().focus().setMark(name, attrsOf(a)).run(),
    },
    unsetMark: {
      args: z.object({ name: z.string().min(1) }),
      run: ({ name }) => editor.chain().focus().unsetMark(name).run(),
    },
    setNode: {
      args: named,
      run: ({ name, attrs: a }) =>
        editor.chain().focus().setNode(name, attrsOf(a)).run(),
      can: ({ name, attrs: a }) => editor.can().setNode(name, attrsOf(a)),
    },
    toggleNode: {
      args: z.object({
        name: z.string().min(1),
        toggleTo: z.string().min(1).default('paragraph'),
        attrs,
      }),
      run: ({ name, toggleTo, attrs: a }) =>
        editor.chain().focus().toggleNode(name, toggleTo, attrsOf(a)).run(),
    },
    updateAttributes: {
      args: z.object({
        name: z.string().min(1),
        attrs: z.record(z.string(), z.unknown()),
      }),
      run: ({ name, attrs: a }) =>
        editor.chain().updateAttributes(name, a).run(),
    },
    setParagraph: {
      run: () => editor.chain().focus().setNode('paragraph').run(),
    },
    clearNodes: {
      run: () => editor.chain().focus().clearNodes().run(),
    },
    deleteSelection: {
      run: () => editor.chain().deleteSelection().run(),
    },
    deleteNode: {
      args: z.object({ name: z.string().min(1) }),
      run: ({ name }) => editor.chain().deleteNode(name).run(),
    },
    selectAll: {
      run: () => editor.chain().selectAll().run(),
    },
    focus: {
      run: (a) => {
        const position = (
          a as { position?: 'start' | 'end' | 'all' | number } | undefined
        )?.position;
        return editor.chain().focus(position).run();
      },
    },
    blur: {
      run: () => editor.chain().blur().run(),
    },

    // Structural block commands (guarded — see runEngine).
    toggleHeading: {
      args: z.object({ level: z.number().int().min(1).max(6) }),
      run: ({ level }) => runEngine('toggleHeading', { level }),
      can: ({ level }) => canEngine('toggleHeading', { level }),
    },
    toggleBulletList: { run: () => runEngine('toggleBulletList') },
    toggleOrderedList: { run: () => runEngine('toggleOrderedList') },
    toggleTaskList: { run: () => runEngine('toggleTaskList') },
    toggleBlockquote: { run: () => runEngine('toggleBlockquote') },
    setHorizontalRule: { run: () => runEngine('setHorizontalRule') },
  };
}
