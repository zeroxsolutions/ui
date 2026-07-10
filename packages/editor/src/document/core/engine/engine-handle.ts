/**
 * Opaque, **engine-free** handles that let engine objects cross module
 * boundaries inside `core/` without any `.d.ts` naming a `@tiptap/*` or
 * `prosemirror-*` type. The compiler returns `EngineExtensions`; the integration
 * module casts it back to the real engine type internally. This is what keeps
 * every emitted declaration file engine-free (the `assert-engine-free-dts`
 * build guard) while `core/` still freely uses the engine in function bodies.
 */
declare const engineBrand: unique symbol;

/** A compiled bundle of engine extensions (really a Tiptap `Extensions`). */
export type EngineExtensions = { readonly [engineBrand]: 'extensions' };

/** A live engine instance (really a Tiptap `Editor`). */
export type EngineHandle = { readonly [engineBrand]: 'handle' };
