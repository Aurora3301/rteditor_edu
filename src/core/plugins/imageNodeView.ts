import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'

export class ImageNodeView implements NodeView {
  dom: HTMLElement
  private img: HTMLImageElement
  private rotationBar: HTMLElement
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

    // Image
    this.img = document.createElement('img')
    this.img.src = node.attrs.src
    this.img.alt = node.attrs.alt || ''
    this.img.className = 'rte-image'
    this.img.style.display = 'block'
    this.img.style.maxWidth = '100%'
    if (node.attrs.width) this.img.style.width = `${node.attrs.width}px`
    this.applyRotation(node.attrs.rotation ?? 0)
    this.dom.appendChild(this.img)

    // Rotation controls bar (shows on hover)
    this.rotationBar = document.createElement('div')
    this.rotationBar.className = 'rte-image-rotbar'

    const rotBtns: { label: string; title: string; delta: number }[] = [
      { label: '↺', title: 'Rotate left 90°',  delta: -90 },
      { label: '↻', title: 'Rotate right 90°', delta:  90 },
    ]
    rotBtns.forEach(({ label, title, delta }) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.title = title
      btn.setAttribute('aria-label', title)
      btn.tabIndex = 0
      btn.className = 'rte-image-rotbar__btn'
      const apply = (e: Event) => {
        e.preventDefault()
        const current = this.node.attrs.rotation ?? 0
        const next = ((current + delta) % 360 + 360) % 360
        this.updateAttr('rotation', next)
      }
      btn.addEventListener('mousedown', apply)
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') apply(e)
      })
      this.rotationBar.appendChild(btn)
    })
    this.dom.appendChild(this.rotationBar)

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

  private applyRotation(deg: number) {
    this.img.style.transform = deg ? `rotate(${deg}deg)` : ''
    // When rotated 90/270, swap visual dimensions so wrapper stays compact
    const sideways = deg === 90 || deg === 270
    this.img.style.marginTop = sideways ? `${(this.img.offsetWidth - this.img.offsetHeight) / 2}px` : ''
    this.img.style.marginLeft = sideways ? `${(this.img.offsetHeight - this.img.offsetWidth) / 2}px` : ''
  }

  private updateAttr(key: string, value: unknown) {
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
    this.applyRotation(node.attrs.rotation ?? 0)
    return true
  }

  stopEvent(event: Event): boolean {
    return this.rotationBar.contains(event.target as Node)
  }
}

