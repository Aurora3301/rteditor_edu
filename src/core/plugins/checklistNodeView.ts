import { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorView, NodeView } from 'prosemirror-view'

/**
 * NodeView for task_item — renders a real <input type="checkbox">
 * so the user can click to toggle checked state.
 */
export class ChecklistItemNodeView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement
  private checkbox: HTMLInputElement
  private view: EditorView
  private getPos: () => number | undefined

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.view = view
    this.getPos = getPos

    // Outer <li>
    this.dom = document.createElement('li')
    this.dom.className = 'rte-checklist__item'
    this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false')

    // Checkbox
    this.checkbox = document.createElement('input')
    this.checkbox.type = 'checkbox'
    this.checkbox.className = 'rte-checklist__checkbox'
    this.checkbox.checked = node.attrs.checked
    this.checkbox.setAttribute('aria-label', 'Toggle task')
    this.checkbox.addEventListener('mousedown', (e) => {
      e.preventDefault() // prevent editor losing focus
    })
    this.checkbox.addEventListener('change', () => {
      const pos = this.getPos()
      if (pos === undefined) return
      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        checked: this.checkbox.checked,
      })
      this.view.dispatch(tr)
    })

    // Content container
    this.contentDOM = document.createElement('div')
    this.contentDOM.className = 'rte-checklist__content'

    this.dom.appendChild(this.checkbox)
    this.dom.appendChild(this.contentDOM)
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type.name !== 'task_item') return false
    this.checkbox.checked = node.attrs.checked
    this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false')
    return true
  }
}

