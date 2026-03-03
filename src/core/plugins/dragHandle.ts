import { Plugin, PluginKey, EditorState, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

export const dragHandleKey = new PluginKey('dragHandle')

export interface DragHandleState {
  active: boolean
  from: number
  to: number
}

export function createDragHandlePlugin(): Plugin {
  return new Plugin({
    key: dragHandleKey,
    state: {
      init(): DragHandleState {
        return { active: false, from: 0, to: 0 }
      },
      apply(tr, prev): DragHandleState {
        const meta = tr.getMeta(dragHandleKey)
        if (meta !== undefined) return meta
        // If the document changes while dragging, deactivate
        if (prev.active && tr.docChanged) {
          return { active: false, from: 0, to: 0 }
        }
        return prev
      },
    },
    props: {
      decorations(state) {
        const pluginState = dragHandleKey.getState(state)
        if (!pluginState?.active) return DecorationSet.empty
        const { from, to } = pluginState
        if (from >= to) return DecorationSet.empty
        return DecorationSet.create(state.doc, [
          Decoration.inline(from, to, {
            class: 'rte-drag-highlight',
            draggable: 'true',
          }),
        ])
      },
      handleDOMEvents: {
        dragstart(view: EditorView, event: DragEvent) {
          const pluginState = dragHandleKey.getState(view.state)
          if (!pluginState?.active) return false

          const { from, to } = pluginState

          // Serialize the content as text for the drag data
          const text = view.state.doc.textBetween(from, to, '\n')
          event.dataTransfer?.setData('text/plain', text)

          // Store the slice info for internal drops
          event.dataTransfer?.setData('application/x-rte-drag', JSON.stringify({ from, to }))
          event.dataTransfer!.effectAllowed = 'move'

          return false
        },
        drop(view: EditorView, event: DragEvent) {
          const dragData = event.dataTransfer?.getData('application/x-rte-drag')
          if (!dragData) return false

          event.preventDefault()

          const { from: origFrom, to: origTo } = JSON.parse(dragData)

          // Find drop position
          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!dropPos) return true

          const insertPos = dropPos.pos

          // Get the content to move
          const slice = view.state.doc.slice(origFrom, origTo)

          // Build transaction: delete from original, insert at new position
          const tr = view.state.tr

          // Delete original content first
          tr.delete(origFrom, origTo)

          // Map the insert position after deletion
          const mappedPos = tr.mapping.map(insertPos)

          // Insert at new position
          tr.insert(mappedPos, slice.content)

          // Set selection at the inserted content
          tr.setSelection(TextSelection.create(tr.doc, mappedPos, mappedPos + slice.content.size))

          // Deactivate drag mode
          tr.setMeta(dragHandleKey, { active: false, from: 0, to: 0 })

          view.dispatch(tr)
          view.focus()

          return true
        },
        dragend(view: EditorView) {
          // Deactivate drag mode when drag ends (cancelled or completed)
          const pluginState = dragHandleKey.getState(view.state)
          if (pluginState?.active) {
            view.dispatch(view.state.tr.setMeta(dragHandleKey, { active: false, from: 0, to: 0 }))
          }
          return false
        },
      },
    },
  })
}

/** Command to activate drag mode for the current selection */
export function activateDrag(state: EditorState, dispatch?: (tr: any) => void): boolean {
  const { from, to, empty } = state.selection
  if (empty) return false

  if (dispatch) {
    dispatch(state.tr.setMeta(dragHandleKey, { active: true, from, to }))
  }
  return true
}

/** Command to deactivate drag mode */
export function deactivateDrag(state: EditorState, dispatch?: (tr: any) => void): boolean {
  const pluginState = dragHandleKey.getState(state)
  if (!pluginState?.active) return false

  if (dispatch) {
    dispatch(state.tr.setMeta(dragHandleKey, { active: false, from: 0, to: 0 }))
  }
  return true
}

/** Check if drag mode is currently active */
export function isDragActive(state: EditorState): boolean {
  return dragHandleKey.getState(state)?.active ?? false
}

