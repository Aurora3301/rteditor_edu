import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'

export class ImageNodeView implements NodeView {
  dom: HTMLElement
  private img: HTMLImageElement
  private rotHandle: HTMLElement
  private node: ProseMirrorNode
  private view: EditorView
  private getPos: () => number | undefined

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    // ── Wrapper ──────────────────────────────────────────────────────────────
    this.dom = document.createElement('span')
    this.dom.className = 'rte-image-wrapper'
    this.dom.contentEditable = 'false'
    this.dom.style.display = 'inline-block'
    this.dom.style.position = 'relative'

    // ── Image ─────────────────────────────────────────────────────────────────
    this.img = document.createElement('img')
    this.img.src = node.attrs.src
    this.img.alt = node.attrs.alt || ''
    this.img.className = 'rte-image'
    this.img.style.display = 'block'
    this.img.style.maxWidth = '100%'
    if (node.attrs.width) this.img.style.width = `${node.attrs.width}px`
    this.applyRotation(node.attrs.rotation ?? 0)
    this.dom.appendChild(this.img)

    // ── Rotation handle ───────────────────────────────────────────────────────
    // A draggable knob + stem that sits above the image center.
    // Dragging calculates the angle from the image's center to the cursor.
    this.rotHandle = document.createElement('div')
    this.rotHandle.className = 'rte-image-rot-handle'
    this.rotHandle.title = 'Drag to rotate'
    this.rotHandle.setAttribute('aria-label', 'Rotation handle – drag to rotate image')

    const knob = document.createElement('span')
    knob.className = 'rte-image-rot-handle__knob'
    const stem = document.createElement('span')
    stem.className = 'rte-image-rot-handle__stem'
    this.rotHandle.appendChild(knob)
    this.rotHandle.appendChild(stem)

    this.rotHandle.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      // Disable CSS transition so rotation tracks cursor instantly
      this.dom.classList.add('rte-image-wrapper--rotating')
      this.rotHandle.style.cursor = 'grabbing'

      const onMove = (ev: MouseEvent) => {
        this.applyRotation(this.angleFromCenter(ev))
      }
      const onUp = (ev: MouseEvent) => {
        const deg = this.angleFromCenter(ev)
        this.applyRotation(deg)
        this.updateAttr('rotation', deg)
        this.dom.classList.remove('rte-image-wrapper--rotating')
        this.rotHandle.style.cursor = ''
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    this.dom.appendChild(this.rotHandle)

    // ── Resize handle (bottom-right corner) ───────────────────────────────────
    const handle = document.createElement('div')
    handle.className = 'rte-image-resize-handle'
    let startX = 0, startW = 0
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      startX = e.clientX
      startW = this.img.offsetWidth
      const onMove = (ev: MouseEvent) => {
        this.img.style.width = `${Math.max(40, startW + ev.clientX - startX)}px`
      }
      const onUp = (ev: MouseEvent) => {
        this.updateAttr('width', Math.max(40, startW + ev.clientX - startX))
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    this.dom.appendChild(handle)
  }

  /**
   * Calculates the rotation angle (0–359°) from the image's center
   * to the current mouse position.
   * 0° = mouse directly above center (12 o'clock).
   * Increases clockwise.
   */
  private angleFromCenter(ev: MouseEvent): number {
    const rect = this.dom.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    const dx = ev.clientX - cx
    const dy = ev.clientY - cy
    // atan2 returns angle from east; +90 shifts origin to north (top)
    return Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360)
  }

  private applyRotation(deg: number) {
    this.img.style.transform = deg ? `rotate(${deg}deg)` : ''
    // For 90°/270° compensate margins so wrapper stays compact
    const sideways = deg === 90 || deg === 270
    this.img.style.marginTop  = sideways ? `${(this.img.offsetWidth  - this.img.offsetHeight) / 2}px` : ''
    this.img.style.marginLeft = sideways ? `${(this.img.offsetHeight - this.img.offsetWidth)  / 2}px` : ''
  }

  private updateAttr(key: string, value: unknown) {
    const pos = this.getPos()
    if (pos === undefined) return
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, [key]: value })
    )
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
    return this.rotHandle.contains(event.target as Node)
  }
}

