import { keymap } from 'prosemirror-keymap'
import { EditorState, Plugin, Transaction } from 'prosemirror-state'
import {
  chainCommands, exitCode, joinBackward, selectNodeBackward,
  joinForward, selectNodeForward, deleteSelection,
  newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock,
} from 'prosemirror-commands'
import { undoInputRule } from 'prosemirror-inputrules'
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list'
import { schema } from '../schema'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode,
  toggleChecklistItem,
  undo, redo
} from '../commands/formatting'

/** If cursor is at the very start of a block and the previous sibling is a table, delete the table */
function deleteTableBefore(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $from, empty } = state.selection
  if (!empty) return false

  // Must be at the very start of a text block
  if ($from.parentOffset !== 0) return false

  // Check the node before the current block
  const before = $from.before($from.depth)
  if (before <= 0) return false

  const $before = state.doc.resolve(before)
  const nodeBefore = $before.nodeBefore

  if (!nodeBefore || nodeBefore.type.name !== 'table') return false

  if (dispatch) {
    // Delete the table node
    const tableStart = before - nodeBefore.nodeSize
    const tr = state.tr.delete(tableStart, before)
    dispatch(tr.scrollIntoView())
  }
  return true
}

/** If cursor is at the very end of a block and the next sibling is a table, delete the table */
function deleteTableAfter(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $to, empty } = state.selection
  if (!empty) return false

  // Must be at the very end of a text block
  if ($to.parentOffset !== $to.parent.content.size) return false

  const after = $to.after($to.depth)
  if (after >= state.doc.content.size) return false

  const $after = state.doc.resolve(after)
  const nodeAfter = $after.nodeAfter

  if (!nodeAfter || nodeAfter.type.name !== 'table') return false

  if (dispatch) {
    const tableEnd = after + nodeAfter.nodeSize
    const tr = state.tr.delete(after, tableEnd)
    dispatch(tr.scrollIntoView())
  }
  return true
}

/**
 * When Enter is pressed inside an empty task_item (no text), exit the
 * checklist — identical behaviour to Enter in an empty ordered-list item.
 * Guards precisely: only fires when the paragraph inside the task_item is
 * empty, so splitListItem(task_item) always gets the first crack at
 * non-empty items.
 */
function exitEmptyTaskItem(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { $from, empty } = state.selection
  if (!empty) return false
  // Parent paragraph must be empty
  if ($from.parent.content.size > 0) return false
  // Grandparent must be a task_item
  if ($from.depth < 2 || $from.node($from.depth - 1).type !== schema.nodes.task_item) return false
  // Delegate to liftListItem — lifts the item's content out of the task_list
  return liftListItem(schema.nodes.task_item)(state, dispatch)
}

export function buildKeymap(): Plugin {
  const bindings: Record<string, any> = {}

  // ── Mark toggles ──
  bindings['Mod-b'] = toggleBold
  bindings['Mod-i'] = toggleItalic
  bindings['Mod-u'] = toggleUnderline
  bindings['Mod-Shift-x'] = toggleStrike    // Matches Google Docs
  bindings['Mod-e'] = toggleCode            // Matches VS Code

  // ── Checklist toggle ──
  bindings['Mod-Shift-9'] = toggleChecklistItem

  // ── History ──
  bindings['Mod-z'] = undo
  bindings['Mod-Shift-z'] = redo
  bindings['Mod-y'] = redo                  // Windows convention

  // ── Enter ──────────────────────────────────────────────────────────────
  // Order matters:
  //   1. splitListItem(task_item)  — Enter WITH text → new unchecked checkbox
  //   2. exitEmptyTaskItem         — Enter on EMPTY item → exit checklist to paragraph
  //   3. splitListItem(list_item)  — Enter in bullet/ordered list
  //   4. normal prosemirror splits
  bindings['Enter'] = chainCommands(
    splitListItem(schema.nodes.task_item),
    exitEmptyTaskItem,
    splitListItem(schema.nodes.list_item),
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  )

  // ── Backspace ──────────────────────────────────────────────────────────
  // exitEmptyTaskItem on Backspace: when the task_item paragraph is empty,
  // backspace exits the checklist (same guard as Enter — precise, not greedy).
  // Then fall through to table-delete and standard ProseMirror handlers.
  bindings['Backspace'] = chainCommands(
    exitEmptyTaskItem,
    deleteTableBefore,
    undoInputRule,
    deleteSelection,
    joinBackward,
    selectNodeBackward,
  )

  // ── Delete (forward): delete table after cursor, then normal delete ──
  bindings['Delete'] = chainCommands(
    deleteTableAfter,
    deleteSelection,
    joinForward,
    selectNodeForward,
  )
  bindings['Mod-Delete'] = chainCommands(
    deleteSelection,
    joinForward,
    selectNodeForward,
  )

  // ── List indent/outdent (also applies to task_item) ──
  bindings['Tab'] = chainCommands(
    sinkListItem(schema.nodes.task_item),
    sinkListItem(schema.nodes.list_item),
  )
  bindings['Shift-Tab'] = chainCommands(
    liftListItem(schema.nodes.task_item),
    liftListItem(schema.nodes.list_item),
  )

  // ── Hard break (Shift+Enter) ──
  const hardBreak = chainCommands(exitCode, (state, dispatch) => {
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView())
    }
    return true
  })
  bindings['Shift-Enter'] = hardBreak
  bindings['Mod-Enter'] = hardBreak

  return keymap(bindings)
}
