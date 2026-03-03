// Schema
export { schema, nodes, marks } from './schema'

// Editor factory
export { createEditor, destroyEditor } from './editor'
export type { EditorOptions } from './editor'

// Plugins
export { createPlugins } from './plugins'
export { activateDrag, deactivateDrag, isDragActive, dragHandleKey } from './plugins/dragHandle'

// Commands
export {
  toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode,
  toggleSubscript, toggleSuperscript,
  setFontFamily, setFontSize,
  setHeading, setParagraph,
  setTextAlign,
  toggleBulletList, toggleOrderedList,
  toggleBlockquote, insertHorizontalRule,
  clearFormatting,
  undo, redo,
  setLink, removeLink, getActiveLinkAttrs,
  isMarkActive, isBlockActive, canUndo, canRedo,
  getTextAlign, getActiveFontFamily, getActiveFontSize,
} from './commands'

// Serializers
export { toHTML, fromHTML, createEmptyDoc, toJSON, fromJSON, toMarkdown } from './serializers'

// Utilities
export { importFromCKEditor4 } from './utils/ckEditor4Import'
export { getDocStats, getSelectionStats } from './utils/wordCount'
export type { DocStats } from './utils/wordCount'
export { emojiList } from './utils/emojiData'
export type { EmojiEntry } from './utils/emojiData'

// Slash menu
export { isSlashMenuActive, closeSlashMenu, slashMenuKey } from './plugins/slashMenu'
