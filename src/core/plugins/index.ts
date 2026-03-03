import { Plugin } from 'prosemirror-state'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { createDragHandlePlugin } from './dragHandle'
import { gapCursor } from 'prosemirror-gapcursor'
import { buildKeymap } from './keymap'
import { buildInputRules } from './inputRules'
import { tableEditing } from 'prosemirror-tables'
import { createSlashMenuPlugin } from './slashMenu'
import { createPasteCleanupPlugin } from './pasteCleanup'

/**
 * Create the full plugin array for the editor.
 * Order matters:
 *   1. Input rules (must be before keymap so rules fire first)
 *   2. Custom keymap (our shortcuts)
 *   3. Base keymap (ProseMirror defaults — Enter, Backspace, etc.)
 *   4. Drop cursor (shows blue line when dragging)
 *   5. Drag handle (drag & drop selected content)
 *   6. Gap cursor (allows cursor in empty spaces between nodes)
 *   7. History (undo/redo — must be last so it captures all changes)
 */
export function createPlugins(): Plugin[] {
  return [
    buildInputRules(),
    buildKeymap(),
    keymap(baseKeymap),
    tableEditing(),
    createSlashMenuPlugin(),
    createPasteCleanupPlugin(),
    dropCursor(),
    createDragHandlePlugin(),
    gapCursor(),
    history(),
  ]
}
