import { Plugin } from 'prosemirror-state'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import { buildKeymap } from './keymap'
import { buildInputRules } from './inputRules'

/**
 * Create the full plugin array for the editor.
 * Order matters:
 *   1. Input rules (must be before keymap so rules fire first)
 *   2. Custom keymap (our shortcuts)
 *   3. Base keymap (ProseMirror defaults — Enter, Backspace, etc.)
 *   4. Drop cursor (shows blue line when dragging)
 *   5. Gap cursor (allows cursor in empty spaces between nodes)
 *   6. History (undo/redo — must be last so it captures all changes)
 */
export function createPlugins(): Plugin[] {
  return [
    buildInputRules(),
    buildKeymap(),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor(),
    history(),
  ]
}
