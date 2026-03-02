import { keymap } from 'prosemirror-keymap'
import { Plugin } from 'prosemirror-state'
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
  undo, redo
} from '../commands/formatting'

export function buildKeymap(): Plugin {
  const bindings: Record<string, any> = {}

  // ── Mark toggles ──
  bindings['Mod-b'] = toggleBold
  bindings['Mod-i'] = toggleItalic
  bindings['Mod-u'] = toggleUnderline
  bindings['Mod-Shift-x'] = toggleStrike    // Matches Google Docs
  bindings['Mod-e'] = toggleCode            // Matches VS Code

  // ── History ──
  bindings['Mod-z'] = undo
  bindings['Mod-Shift-z'] = redo
  bindings['Mod-y'] = redo                  // Windows convention

  // ── Enter: try splitListItem first, then fall back to normal split ──
  bindings['Enter'] = chainCommands(
    splitListItem(schema.nodes.list_item),
    newlineInCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  )

  // ── Backspace: undo input rule first, then normal delete ──
  bindings['Backspace'] = chainCommands(
    undoInputRule,
    deleteSelection,
    joinBackward,
    selectNodeBackward,
  )

  // ── Delete (forward) ──
  bindings['Delete'] = chainCommands(
    deleteSelection,
    joinForward,
    selectNodeForward,
  )
  bindings['Mod-Delete'] = chainCommands(
    deleteSelection,
    joinForward,
    selectNodeForward,
  )

  // ── List indent/outdent ──
  bindings['Tab'] = sinkListItem(schema.nodes.list_item)
  bindings['Shift-Tab'] = liftListItem(schema.nodes.list_item)

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
