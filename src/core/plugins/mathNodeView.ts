import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'
import katex from 'katex'

export class MathNodeView implements NodeView {
  dom: HTMLElement
  private node: ProseMirrorNode
  private view: EditorView
  private getPos: () => number | undefined
  private editing = false
  private inner: HTMLElement

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    this.dom = document.createElement('span')
    this.dom.className = 'rte-math-inline-wrapper'
    this.dom.contentEditable = 'false'

    this.inner = document.createElement('span')
    this.dom.appendChild(this.inner)

    this.dom.addEventListener('dblclick', () => this.startEdit())

    this.renderKatex(node.attrs.latex)
  }

  private renderKatex(latex: string) {
    this.inner.innerHTML = ''
    if (!latex.trim()) {
      const placeholder = document.createElement('span')
      placeholder.className = 'rte-math-inline-placeholder'
      placeholder.textContent = 'ƒ(x)'
      this.inner.appendChild(placeholder)
      return
    }
    try {
      katex.render(latex, this.inner, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      })
    } catch {
      this.inner.textContent = latex
    }
  }

  private startEdit() {
    if (this.editing) return
    this.editing = true
    this.dom.className = 'rte-math-inline-wrapper rte-math-inline-wrapper--editing'

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'rte-math-inline-input'
    input.value = this.node.attrs.latex
    input.placeholder = 'LaTeX…'

    const preview = document.createElement('span')
    preview.className = 'rte-math-inline-preview'
    this.renderPreview(preview, input.value)

    input.addEventListener('input', () => this.renderPreview(preview, input.value))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.commitEdit(input.value); e.preventDefault() }
      if (e.key === 'Escape') { this.stopEdit(); e.preventDefault() }
    })
    input.addEventListener('blur', () => setTimeout(() => this.commitEdit(input.value), 100))

    this.inner.innerHTML = ''
    this.inner.appendChild(input)
    this.inner.appendChild(preview)
    input.focus()
    input.select()
  }

  private renderPreview(el: HTMLElement, latex: string) {
    if (!latex.trim()) { el.textContent = ''; return }
    try {
      katex.render(latex, el, { throwOnError: false, displayMode: false, output: 'html' })
    } catch {
      el.textContent = latex
    }
  }

  private commitEdit(latex: string) {
    const pos = this.getPos()
    if (pos !== undefined) {
      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, { latex })
      this.view.dispatch(tr)
    }
    this.stopEdit()
  }

  private stopEdit() {
    this.editing = false
    this.dom.className = 'rte-math-inline-wrapper'
    this.inner.innerHTML = ''
    this.renderKatex(this.node.attrs.latex)
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false
    this.node = node
    if (!this.editing) this.renderKatex(node.attrs.latex)
    return true
  }

  stopEvent(event: Event): boolean {
    return this.editing && this.inner.contains(event.target as Node)
  }

  ignoreMutation(): boolean { return true }
}

