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
export { toHTML, fromHTML, createEmptyDoc, toJSON, fromJSON } from './serializers'
