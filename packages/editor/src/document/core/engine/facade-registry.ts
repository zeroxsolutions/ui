import type { IEditor } from '../types/editor.js';
import type { EngineHandle } from './engine-handle.js';

/**
 * Maps a live engine instance to its `IEditor` façade, so engine-side callbacks
 * (node views, keyboard shortcuts, input rules) can reach the façade without the
 * engine type appearing in any public signature. Keyed weakly so a destroyed
 * editor is garbage-collected.
 */
const facades = new WeakMap<object, IEditor>();

export function registerFacade(handle: EngineHandle, facade: IEditor): void {
  facades.set(handle as object, facade);
}

export function facadeFor(handle: EngineHandle): IEditor | undefined {
  return facades.get(handle as object);
}

export function unregisterFacade(handle: EngineHandle): void {
  facades.delete(handle as object);
}
