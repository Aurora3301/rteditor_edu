import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { createPlugins } from './plugins'
import { fromHTML, fromJSON, createEmptyDoc } from './serializers'

/**
 * Options for creating an editor instance.
 */
export interface EditorOptions {
  /** The DOM element to mount the editor into */
  element: HTMLElement

  /** Initial content — provide ONE of html, json, or doc. JSON is preferred. */
  content?: {
    html?: string
    json?: Record<string, any>
    doc?: ProseMirrorNode
  }

  /** Called when the document changes (debounce in the consumer) */
  onUpdate?: (state: EditorState) => void

  /** Called on EVERY transaction (including selection-only changes) */
  onTransaction?: (state: EditorState) => void

  /** Called when editor gains focus */
  onFocus?: () => void

  /** Called when editor loses focus */
  onBlur?: () => void

  /** If true, editor is read-only */
  editable?: boolean

  /** Placeholder text shown when editor is empty */
  placeholder?: string
}

/**
 * Parse initial content into a ProseMirror document.
 * Priority: doc > json > html > empty
 */
function parseContent(content?: EditorOptions['content']): ProseMirrorNode {
  if (!content) return createEmptyDoc()

  if (content.doc) return content.doc
  if (content.json) return fromJSON(content.json)
  if (content.html) return fromHTML(content.html)

  return createEmptyDoc()
}

/**
 * Create a ProseMirror EditorView.
 *
 * This is the CORE factory — framework-agnostic.
 * The Vue layer (useEditor) wraps this with reactivity.
 */
export function createEditor(options: EditorOptions): EditorView {
  const doc = parseContent(options.content)

  const state = EditorState.create({
    doc,
    plugins: createPlugins(),
  })

  const view = new EditorView(options.element, {
    state,

    editable: () => options.editable !== false,

    dispatchTransaction(this: EditorView, tr: Transaction) {
      const newState = this.state.apply(tr)
      this.updateState(newState)

      if (tr.docChanged && options.onUpdate) {
        options.onUpdate(newState)
      }

      // Always fire onTransaction (for active state tracking on selection changes)
      if (options.onTransaction) {
        options.onTransaction(newState)
      }
    },

    // Set placeholder as a data attribute for CSS ::before content
    attributes: {
      class: 'ProseMirror',
      ...(options.placeholder
        ? { 'data-placeholder': options.placeholder }
        : {}),
    },

    handleDOMEvents: {
      focus: () => {
        options.onFocus?.()
        return false // don't prevent default
      },
      blur: () => {
        options.onBlur?.()
        return false
      },
    },
  })

  return view
}

/**
 * Destroy a ProseMirror EditorView and clean up.
 */
export function destroyEditor(view: EditorView): void {
  view.destroy()
}
