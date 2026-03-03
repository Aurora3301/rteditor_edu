import { Plugin, PluginKey, EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export const slashMenuKey = new PluginKey('slashMenu')

export interface SlashMenuState {
  active: boolean
  from: number   // position of the slash character
  filter: string // text typed after /
  selectedIndex: number
}

export function createSlashMenuPlugin(): Plugin {
  return new Plugin({
    key: slashMenuKey,
    state: {
      init(): SlashMenuState {
        return { active: false, from: 0, filter: '', selectedIndex: 0 }
      },
      apply(tr, prev): SlashMenuState {
        const meta = tr.getMeta(slashMenuKey)
        if (meta !== undefined) return meta
        if (prev.active && tr.docChanged) {
          // Update filter text as user types after /
          const newText = tr.doc.textBetween(prev.from, Math.min(prev.from + 30, tr.doc.content.size), '')
          if (!newText.startsWith('/')) {
            return { active: false, from: 0, filter: '', selectedIndex: 0 }
          }
          const filter = newText.slice(1).split(/\s/)[0] || ''
          return { ...prev, filter, selectedIndex: 0 }
        }
        return prev
      },
    },
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent) {
        const pluginState = slashMenuKey.getState(view.state)

        // Activate on /
        if (event.key === '/' && !pluginState?.active) {
          const { from } = view.state.selection
          setTimeout(() => {
            view.dispatch(view.state.tr.setMeta(slashMenuKey, {
              active: true, from, filter: '', selectedIndex: 0,
            }))
          }, 0)
          return false
        }

        if (!pluginState?.active) return false

        if (event.key === 'Escape') {
          view.dispatch(view.state.tr.setMeta(slashMenuKey, {
            active: false, from: 0, filter: '', selectedIndex: 0,
          }))
          return true
        }

        return false
      },
    },
  })
}

/** Deactivate the slash menu */
export function closeSlashMenu(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(slashMenuKey, {
    active: false, from: 0, filter: '', selectedIndex: 0,
  }))
}

/** Check if slash menu is active */
export function isSlashMenuActive(state: EditorState): boolean {
  return slashMenuKey.getState(state)?.active ?? false
}

