/**
 * `@zeroxsolutions/editor` has **no root barrel** — like `@zeroxsolutions/ui`,
 * every module is published at its natural subpath via the per-file `./*`
 * exports map (dist mirrors src). Import from the subpath you need, e.g.:
 *
 *   import { createEditor } from '@zeroxsolutions/editor/document/core/builder';
 *   import { Editor }       from '@zeroxsolutions/editor/document/react/editor';
 *   import { Viewer }       from '@zeroxsolutions/editor/document/react/viewer';
 *   import { defineFeature } from '@zeroxsolutions/editor/document/core/define-feature';
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
