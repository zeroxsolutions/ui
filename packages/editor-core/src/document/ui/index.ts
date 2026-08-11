/**
 * Engine-free UI-contribution aggregation: the slash/toolbar/bubble/block menu
 * items features declare declaratively. The menu chrome itself (SlashMenu,
 * BubbleMenu, EditorToolbar, BlockMenu) is React + design-system code and lives
 * in the registry (`apps/registry-ui/registry/.../editor/document/ui`); this barrel
 * keeps only the headless aggregation logic editor-core owns.
 */
export {
  collectUiContributions,
  filterSlashItems,
  groupByHeading,
  defaultBlockMenuItems,
  type UiContributions,
} from './collect-ui-contributions.js';
