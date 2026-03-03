import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'

export class ImageNodeView implements NodeView {
  dom: HTMLElement
  private img: HTMLImageElement
  private captionEl: HTMLElement
  private floatBar: HTMLElement
  private node: ProseMirrorNode
  private view: EditorView
  private getPos: () => number | undefined

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    // Wrapper
    this.dom = document.createElement('span')
    this.dom.className = 'rte-image-wrapper'
    this.dom.contentEditable = 'false'
    this.dom.style.display = 'inline-block'
    this.dom.style.position = 'relative'
    if (node.attrs.float) {
      this.dom.style.float = node.attrs.float
      this.dom.style.margin = '4px'
    }

    // Image
    this.img = document.createElement('img')
    this.img.src = node.attrs.src
    this.img.alt = node.attrs.alt || ''
    if (node.attrs.width) this.img.style.width = `${node.attrs.width}px`
    this.img.className = 'rte-image'
    this.img.style.display = 'block'
    this.img.style.maxWidth = '100%'
    this.dom.appendChild(this.img)

    // Float controls bar
    this.floatBar = document.createElement('div')
    this.floatBar.className = 'rte-image-floatbar'
    ;(['left', 'none', 'right'] as const).forEach(f => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = f === 'left' ? '◀' : f === 'right' ? '▶' : '■'
      const label = f === 'none' ? 'No float' : `Float ${f}`
      btn.title = label
      btn.setAttribute('aria-label', label)
      btn.tabIndex = 0
      btn.className = 'rte-image-floatbar__btn'
      if ((node.attrs.float || 'none') === f) btn.classList.add('rte-image-floatbar__btn--active')
      const applyFloat = (e: Event) => {
        e.preventDefault()
        this.updateAttr('float', f === 'none' ? null : f)
      }
      btn.addEventListener('mousedown', applyFloat)
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') applyFloat(e)
      })
      this.floatBar.appendChild(btn)
    })
    this.dom.appendChild(this.floatBar)

    // Caption
    this.captionEl = document.createElement('div')
    this.captionEl.className = 'rte-image-caption'
    this.captionEl.contentEditable = 'true'
    this.captionEl.textContent = node.attrs.caption || ''
    this.captionEl.setAttribute('placeholder', 'Add caption…')
    this.captionEl.setAttribute('aria-label', 'Image caption')
    this.captionEl.setAttribute('role', 'textbox')
    this.captionEl.setAttribute('aria-multiline', 'false')
    this.captionEl.addEventListener('input', () => {
      this.updateAttr('caption', this.captionEl.textContent || '')
    })
    // Prevent Enter from bubbling into ProseMirror as a paragraph-break
    this.captionEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') e.preventDefault()
    })
    this.dom.appendChild(this.captionEl)

    // Resize handle (bottom-right corner)
    const handle = document.createElement('div')
    handle.className = 'rte-image-resize-handle'
    let startX = 0, startW = 0
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      startX = e.clientX
      startW = this.img.offsetWidth
      const onMove = (ev: MouseEvent) => {
        const newW = Math.max(40, startW + ev.clientX - startX)
        this.img.style.width = `${newW}px`
      }
      const onUp = (ev: MouseEvent) => {
        const newW = Math.max(40, startW + ev.clientX - startX)
        this.updateAttr('width', newW)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    this.dom.appendChild(handle)
  }

  private updateAttr(key: string, value: any) {
    const pos = this.getPos()
    if (pos === undefined) return
    const attrs = { ...this.node.attrs, [key]: value }
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, attrs)
    this.view.dispatch(tr)
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false
    this.node = node
    this.img.src = node.attrs.src
    if (node.attrs.width) this.img.style.width = `${node.attrs.width}px`
    this.dom.style.float = node.attrs.float || ''
    this.captionEl.textContent = node.attrs.caption || ''
    return true
  }

  stopEvent(event: Event): boolean {
    // Block all events from the caption area so ProseMirror doesn't intercept them
    return this.captionEl.contains(event.target as Node) || this.floatBar.contains(event.target as Node)
  }
}

