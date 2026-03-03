// Formatting commands — Wave 3

import { toggleMark, setBlockType, wrapIn, lift, chainCommands } from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import { wrapInList, liftListItem, sinkListItem } from 'prosemirror-schema-list'
import { EditorState, Transaction, Command } from 'prosemirror-state'
import { NodeType, MarkType, Mark } from 'prosemirror-model'
import {
  addColumnAfter, addColumnBefore, deleteColumn,
  addRowAfter, addRowBefore, deleteRow,
  mergeCells, splitCell, toggleHeaderRow,
  CellSelection,
} from 'prosemirror-tables'
import { schema } from '../schema'

/** Validate that a URL is safe (no javascript:, vbscript:, data: protocols) */
function isValidHref(href: string): boolean {
  if (!href) return false
  // Allow relative URLs, anchors, and mailto/tel
  const trimmed = href.trim()
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true
  }
  try {
    const url = new URL(trimmed, 'https://placeholder.invalid')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

/** Validate that an image src is safe */
function isValidImageSrc(src: string): boolean {
  if (!src) return false
  const trimmed = src.trim()
  // Allow data:image/* URLs
  if (trimmed.startsWith('data:image/')) return true
  // Allow relative URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return true
  try {
    const url = new URL(trimmed, 'https://placeholder.invalid')
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

// ── Mark toggle commands ──────────────────────────────────────────────

/** Toggle **bold** mark on the current selection */
export const toggleBold: Command = toggleMark(schema.marks.bold)
/** Toggle *italic* mark on the current selection */
export const toggleItalic: Command = toggleMark(schema.marks.italic)
/** Toggle underline mark on the current selection */
export const toggleUnderline: Command = toggleMark(schema.marks.underline)
/** Toggle ~~strikethrough~~ mark on the current selection */
export const toggleStrike: Command = toggleMark(schema.marks.strike)
/** Toggle `inline code` mark on the current selection */
export const toggleCode: Command = toggleMark(schema.marks.code)
/** Toggle subscript mark on the current selection */
export const toggleSubscript: Command = toggleMark(schema.marks.subscript)
/** Toggle superscript mark on the current selection */
export const toggleSuperscript: Command = toggleMark(schema.marks.superscript)

// ── Font Family command ──────────────────────────────────────────────

/** Set the font family mark. Pass `null` to remove. */
export function setFontFamily(family: string | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const markType = schema.marks.fontFamily
    if (!family) {
      // Remove font family mark
      if (state.selection.empty) {
        if (dispatch) {
          dispatch(state.tr.removeStoredMark(markType))
        }
        return true
      }
      const { from, to } = state.selection
      if (dispatch) {
        dispatch(state.tr.removeMark(from, to, markType))
      }
      return true
    }
    const mark = markType.create({ family })
    if (state.selection.empty) {
      if (dispatch) {
        dispatch(state.tr.addStoredMark(mark))
      }
      return true
    }
    const { from, to } = state.selection
    if (dispatch) {
      dispatch(state.tr.addMark(from, to, mark))
    }
    return true
  }
}

// ── Font Size command ────────────────────────────────────────────────

/** Set the font size mark. Pass `null` to remove. */
export function setFontSize(size: string | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const markType = schema.marks.fontSize
    if (!size) {
      if (state.selection.empty) {
        if (dispatch) {
          dispatch(state.tr.removeStoredMark(markType))
        }
        return true
      }
      const { from, to } = state.selection
      if (dispatch) {
        dispatch(state.tr.removeMark(from, to, markType))
      }
      return true
    }
    const mark = markType.create({ size })
    if (state.selection.empty) {
      if (dispatch) {
        dispatch(state.tr.addStoredMark(mark))
      }
      return true
    }
    const { from, to } = state.selection
    if (dispatch) {
      dispatch(state.tr.addMark(from, to, mark))
    }
    return true
  }
}

// ── Block type commands ───────────────────────────────────────────────

/** Set the current block to a heading of the given level */
export function setHeading(level: 1 | 2 | 3): Command {
  return setBlockType(schema.nodes.heading, { level })
}
/** Set the current block to a paragraph (reset heading) */
export const setParagraph: Command = setBlockType(schema.nodes.paragraph)

// ── List commands ─────────────────────────────────────────────────────

/** Toggle a bullet (unordered) list on the current selection */
export function toggleBulletList(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  // If already in bullet_list, lift out. Otherwise, wrap in bullet_list.
  const { bullet_list, list_item } = schema.nodes
  if (isBlockActive(bullet_list)(state)) {
    return liftListItem(list_item)(state, dispatch)
  }
  return wrapInList(bullet_list)(state, dispatch)
}

/** Toggle an ordered (numbered) list on the current selection */
export function toggleOrderedList(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { ordered_list, list_item } = schema.nodes
  if (isBlockActive(ordered_list)(state)) {
    return liftListItem(list_item)(state, dispatch)
  }
  return wrapInList(ordered_list)(state, dispatch)
}

// ── Blockquote command ────────────────────────────────────────────────

/** Toggle a blockquote wrapper on the current selection */
export function toggleBlockquote(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  // If already in blockquote, lift out. Otherwise, wrap in blockquote.
  if (isBlockActive(schema.nodes.blockquote)(state)) {
    return lift(state, dispatch)
  }
  return wrapIn(schema.nodes.blockquote)(state, dispatch)
}

// ── Text Alignment command ───────────────────────────────────────────

/** Set text alignment (`'left'`, `'center'`, `'right'`, `'justify'`). Pass `null` to reset. */
export function setTextAlign(align: string | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { from, to } = state.selection
    let applicable = false
    const tr = state.tr
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === schema.nodes.paragraph || node.type === schema.nodes.heading) {
        applicable = true
        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: align,
          })
        }
      }
    })
    if (applicable && dispatch) {
      dispatch(tr.scrollIntoView())
    }
    return applicable
  }
}

// ── Insert horizontal rule ────────────────────────────────────────────

/** Insert a horizontal rule (`<hr>`) at the current selection */
export function insertHorizontalRule(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const hrNode = schema.nodes.horizontal_rule.create()
    dispatch(state.tr.replaceSelectionWith(hrNode).scrollIntoView())
  }
  return true
}

// ── Insert image ─────────────────────────────────────────────────────

/** Insert an image at the current cursor position */
export function insertImage(attrs: { src: string; alt?: string; title?: string; width?: string; height?: string }): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (!isValidImageSrc(attrs.src)) return false
    const imageType = schema.nodes.image
    if (!imageType) return false

    const node = imageType.create(attrs)
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(node).scrollIntoView())
    }
    return true
  }
}

// ── Clear Formatting command ─────────────────────────────────────────

/** Remove all marks and reset blocks to plain paragraphs */
export function clearFormatting(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to, empty, $from } = state.selection

  if (dispatch) {
    const tr = state.tr

    if (empty) {
      // At cursor: clear all stored marks so next typed text is plain
      for (const markName of Object.keys(schema.marks)) {
        tr.removeStoredMark(schema.marks[markName])
      }
      // Reset current block to plain paragraph
      const blockPos = $from.before($from.depth)
      const node = $from.parent
      if (node.type !== schema.nodes.paragraph) {
        tr.setNodeMarkup(blockPos, schema.nodes.paragraph, { textAlign: null })
      } else if (node.attrs.textAlign) {
        tr.setNodeMarkup(blockPos, undefined, { ...node.attrs, textAlign: null })
      }
    } else {
      // With selection: remove all marks in the range
      for (const markName of Object.keys(schema.marks)) {
        tr.removeMark(from, to, schema.marks[markName])
      }

      // Convert all headings to paragraphs, reset textAlign
      // Collect positions first to avoid mapping issues during mutation
      const blocksToReset: { pos: number; node: any }[] = []
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === schema.nodes.heading || node.type === schema.nodes.paragraph) {
          blocksToReset.push({ pos, node })
        }
      })

      // Apply block resets (use tr.mapping to adjust positions after prior changes)
      for (const { pos, node } of blocksToReset) {
        const mappedPos = tr.mapping.map(pos)
        if (node.type === schema.nodes.heading) {
          tr.setNodeMarkup(mappedPos, schema.nodes.paragraph, { textAlign: null })
        } else if (node.attrs.textAlign) {
          tr.setNodeMarkup(mappedPos, undefined, { ...node.attrs, textAlign: null })
        }
      }
    }

    dispatch(tr.scrollIntoView())
  }
  return true
}

// ── History commands (re-export) ──────────────────────────────────────

export { undo, redo }

// ── State check helpers (for toolbar active states) ───────────────────

/** Check if a mark type is currently active in the selection */
export function isMarkActive(markType: MarkType) {
  return (state: EditorState): boolean => {
    const { from, $from, to, empty } = state.selection
    if (empty) {
      return !!markType.isInSet(state.storedMarks || $from.marks())
    }
    return state.doc.rangeHasMark(from, to, markType)
  }
}

/** Check if a block node type is currently active (optionally with matching attrs) */
export function isBlockActive(nodeType: NodeType, attrs?: Record<string, any>) {
  return (state: EditorState): boolean => {
    const { $from } = state.selection
    // Walk up from selection to find matching node
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d)
      if (node.type === nodeType) {
        if (!attrs) return true
        // Check all provided attrs match
        return Object.keys(attrs).every(key => node.attrs[key] === attrs[key])
      }
    }
    // Also check the block at the current level (for setBlockType nodes like heading, paragraph)
    const node = $from.parent
    if (node.type === nodeType) {
      if (!attrs) return true
      return Object.keys(attrs).every(key => node.attrs[key] === attrs[key])
    }
    return false
  }
}

/** Check whether undo is available in the current state */
export function canUndo(state: EditorState): boolean {
  return undo(state)
}

/** Check whether redo is available in the current state */
export function canRedo(state: EditorState): boolean {
  return redo(state)
}

/** Get the current `textAlign` attribute of the selection's parent block, or `null` */
export function getTextAlign(state: EditorState): string | null {
  const { $from } = state.selection
  const node = $from.parent
  if (node.type === schema.nodes.paragraph || node.type === schema.nodes.heading) {
    return node.attrs.textAlign || null
  }
  return null
}

/** Get the active font family from marks at the current selection, or `null` */
export function getActiveFontFamily(state: EditorState): string | null {
  const markType = schema.marks.fontFamily
  const { from, $from, to, empty } = state.selection
  if (empty) {
    const marks = state.storedMarks || $from.marks()
    const mark = markType.isInSet(marks)
    return mark ? mark.attrs.family : null
  }
  // Check mark at start of selection
  let mark: Mark | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!mark && node.isInline) {
      const found = markType.isInSet(node.marks)
      if (found) mark = found
    }
    return !mark
  })
  return mark ? (mark as Mark).attrs.family : null
}

// ── Link commands ──────────────────────────────────────────────────

/** Set a link mark on the selection, or if selection is empty, wrap the word at cursor. */
export function setLink(href: string, title?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    if (!isValidHref(href)) return false
    const markType = schema.marks.link
    const attrs: Record<string, any> = { href, target: '_blank' }
    if (title) attrs.title = title

    if (state.selection.empty) {
      // At cursor: add stored mark so next typed text becomes a link
      if (dispatch) {
        dispatch(state.tr.addStoredMark(markType.create(attrs)))
      }
      return true
    }

    const { from, to } = state.selection
    if (dispatch) {
      dispatch(state.tr.addMark(from, to, markType.create(attrs)).scrollIntoView())
    }
    return true
  }
}

/** Remove link mark from selection or at cursor position. */
export function removeLink(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const markType = schema.marks.link
  const { from, to, empty, $from } = state.selection

  if (empty) {
    // At cursor: check if inside a link and expand to full link range
    const marks = state.storedMarks || $from.marks()
    const linkMark = markType.isInSet(marks)
    if (!linkMark) return false

    // Find the extent of the link mark around cursor
    let start = $from.pos
    let end = $from.pos
    const parent = $from.parent
    const parentStart = $from.pos - $from.parentOffset

    parent.forEach((node, offset) => {
      const nodeStart = parentStart + offset
      const nodeEnd = nodeStart + node.nodeSize
      if (markType.isInSet(node.marks) && nodeStart <= $from.pos && nodeEnd >= $from.pos) {
        start = Math.min(start, nodeStart)
        end = Math.max(end, nodeEnd)
      }
    })

    if (dispatch) {
      dispatch(state.tr.removeMark(start, end, markType).scrollIntoView())
    }
    return true
  }

  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, markType).scrollIntoView())
  }
  return true
}

/** Get the link mark attrs at the current cursor position, or null if not in a link. */
export function getActiveLinkAttrs(state: EditorState): { href: string; title: string | null; target: string } | null {
  const markType = schema.marks.link
  const { $from, empty } = state.selection

  if (empty) {
    const marks = state.storedMarks || $from.marks()
    const linkMark = markType.isInSet(marks)
    return linkMark ? linkMark.attrs as any : null
  }

  // Check the mark at the start of selection
  const marks = $from.marksAcross(state.selection.$to)
  if (marks) {
    const linkMark = markType.isInSet(marks)
    return linkMark ? linkMark.attrs as any : null
  }
  return null
}

/** Get the active font size from marks at the current selection, or `null` */
export function getActiveFontSize(state: EditorState): string | null {
  const markType = schema.marks.fontSize
  const { from, $from, to, empty } = state.selection
  if (empty) {
    const marks = state.storedMarks || $from.marks()
    const mark = markType.isInSet(marks)
    return mark ? mark.attrs.size : null
  }
  let mark: Mark | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!mark && node.isInline) {
      const found = markType.isInSet(node.marks)
      if (found) mark = found
    }
    return !mark
  })
  return mark ? (mark as Mark).attrs.size : null
}


// ── Checklist commands ──────────────────────────────────────────────────

/** Toggle the current block to/from a task_list / task_item */
export function toggleChecklist(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to } = state.selection
  const inTaskList = isBlockActive(schema.nodes.task_item)(state)

  if (dispatch) {
    const tr = state.tr
    if (inTaskList) {
      // Convert task_items back to paragraphs inside a bullet_list structure
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === schema.nodes.task_item) {
          tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.list_item)
        }
        if (node.type === schema.nodes.task_list) {
          tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.bullet_list)
        }
      })
    } else {
      // Wrap selection in task_list
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === schema.nodes.paragraph) {
          tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.task_item, { checked: false })
        }
        if (node.type === schema.nodes.bullet_list || node.type === schema.nodes.ordered_list) {
          tr.setNodeMarkup(tr.mapping.map(pos), schema.nodes.task_list)
        }
      })
    }
    dispatch(tr.scrollIntoView())
  }
  return true
}

/** Toggle the checked state of the task_item at cursor */
export function toggleChecklistItem(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $from } = state.selection
  // Find the task_item ancestor
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth)
    if (node.type === schema.nodes.task_item) {
      if (dispatch) {
        const pos = $from.before(depth)
        const tr = state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          checked: !node.attrs.checked,
        })
        dispatch(tr)
      }
      return true
    }
  }
  return false
}

// ── Color commands ──────────────────────────────────────────────────────

/** Apply a text color mark to the selection */
export function setTextColor(color: string): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection
    if (empty) return false
    if (dispatch) {
      const markType = schema.marks.textColor
      const tr = state.tr
        .removeMark(from, to, markType)
        .addMark(from, to, markType.create({ color }))
      dispatch(tr.scrollIntoView())
    }
    return true
  }
}

/** Remove text color from the selection */
export function removeTextColor(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to, empty } = state.selection
  if (empty) return false
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, schema.marks.textColor).scrollIntoView())
  }
  return true
}

/** Apply a highlight (background) color mark to the selection */
export function setHighlight(color: string): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection
    if (empty) return false
    if (dispatch) {
      const markType = schema.marks.highlight
      const tr = state.tr
        .removeMark(from, to, markType)
        .addMark(from, to, markType.create({ color }))
      dispatch(tr.scrollIntoView())
    }
    return true
  }
}

/** Remove highlight color from the selection */
export function removeHighlight(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to, empty } = state.selection
  if (empty) return false
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, schema.marks.highlight).scrollIntoView())
  }
  return true
}

/** Get the active text color at cursor, or null */
export function getActiveTextColor(state: EditorState): string | null {
  const { from, to, empty } = state.selection
  const markType = schema.marks.textColor
  if (empty) {
    const stored = state.storedMarks || state.selection.$from.marks()
    const m = markType.isInSet(stored)
    return m ? m.attrs.color : null
  }
  let color: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!color && node.isInline) {
      const m = markType.isInSet(node.marks)
      if (m) color = m.attrs.color
    }
    return !color
  })
  return color
}

/** Get the active highlight color at cursor, or null */
export function getActiveHighlight(state: EditorState): string | null {
  const { from, to, empty } = state.selection
  const markType = schema.marks.highlight
  if (empty) {
    const stored = state.storedMarks || state.selection.$from.marks()
    const m = markType.isInSet(stored)
    return m ? m.attrs.color : null
  }
  let color: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!color && node.isInline) {
      const m = markType.isInSet(node.marks)
      if (m) color = m.attrs.color
    }
    return !color
  })
  return color
}

// ── Table commands ──────────────────────────────────────────────────────

export { addColumnAfter, addColumnBefore, deleteColumn }
export { addRowAfter, addRowBefore, deleteRow }
export { mergeCells, splitCell, toggleHeaderRow }

/** Insert a table at the cursor position */
export function insertTable(rows: number, cols: number, hasHeader: boolean): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const { paragraph, table, table_row, table_cell, table_header } = schema.nodes
      const cells = (isHeader: boolean) =>
        Array.from({ length: cols }, () =>
          (isHeader ? table_header : table_cell).createAndFill()!
        )
      const tableRows = Array.from({ length: rows }, (_, i) =>
        table_row.create(null, cells(hasHeader && i === 0))
      )
      const tableNode = table.create(null, tableRows)
      const tr = state.tr.replaceSelectionWith(tableNode)
      dispatch(tr.scrollIntoView())
    }
    return true
  }
}