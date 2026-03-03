export {
  // Mark toggles
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleSubscript,
  toggleSuperscript,

  // Font commands
  setFontFamily,
  setFontSize,

  // Block type
  setHeading,
  setParagraph,

  // Text alignment
  setTextAlign,

  // Lists
  toggleBulletList,
  toggleOrderedList,

  // Blockquote
  toggleBlockquote,

  // Insert
  insertHorizontalRule,
  insertImage,

  // Clear formatting
  clearFormatting,

  // History
  undo,
  redo,

  // Link commands
  setLink,
  removeLink,
  getActiveLinkAttrs,

  // Color
  setTextColor,
  removeTextColor,
  getActiveTextColor,
  setHighlight,
  removeHighlight,
  getActiveHighlight,

  // Table
  insertTable,

  // State checks
  isMarkActive,
  isBlockActive,
  canUndo,
  canRedo,
  getTextAlign,
  getActiveFontFamily,
  getActiveFontSize,
} from './formatting'

// Drag & Drop
export { activateDrag, deactivateDrag, isDragActive } from '../plugins/dragHandle'
