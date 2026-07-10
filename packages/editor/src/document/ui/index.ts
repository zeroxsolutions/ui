/**
 * Editor chrome (task 8) — slash menu, bubble menu, block menu, and toolbar —
 * composed from the `@zeroxsolutions/ui` design system. Every surface dispatches
 * commands through the `IEditor` façade and positions itself from the browser
 * selection/DOM, so the chrome imports no editing engine.
 */
export {
  collectUiContributions,
  filterSlashItems,
  groupByHeading,
  defaultBlockMenuItems,
  type UiContributions,
} from './collect-ui-contributions.js';
export { useEditorChanges } from './use-editor-changes.js';
export { EditorToolbar, type EditorToolbarProps } from './editor-toolbar.js';
export { BubbleMenu, type BubbleMenuProps } from './bubble-menu.js';
export { SlashMenu, type SlashMenuProps } from './slash-menu.js';
export { BlockMenu, type BlockMenuProps } from './block-menu.js';
