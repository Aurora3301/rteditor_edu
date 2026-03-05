import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView, NodeView } from 'prosemirror-view'

export class ImageNodeView implements NodeView {
  dom: HTMLElement
  private inner: HTMLElement        // rotating container — border + handles live here
  private img: HTMLImageElement
  private rotHandle: HTMLElement
  private resizeHandle: HTMLElement
  private node: ProseMirrorNode
  private view: EditorView
  private getPos: () => number | undefined

  constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    // ── Wrapper (never rotates — just anchors the inner block) ───────────────
    this.dom = document.createElement('span')
    this.dom.className = 'rte-image-wrapper'
    this.dom.contentEditable = 'false'

    // ── Inner (THIS rotates; border + handles are children so they orbit too) ─
    this.inner = document.createElement('div')
    this.inner.className = 'rte-image-inner'
    this.dom.appendChild(this.inner)

    // ── Image (no transform — inner rotates instead) ─────────────────────────
    this.img = document.createElement('img')
    this.img.src = node.attrs.src
    this.img.alt = node.attrs.alt || ''
    this.img.className = 'rte-image'
    if (node.attrs.width) this.img.style.width = `${node.attrs.width}px`
    this.inner.appendChild(this.img)

    // ── Rotation handle (child of inner → orbits with rotation) ──────────────
    // transform is managed entirely in applyRotation():
    //   translateX(-50%) rotate(-Ndeg)  — centres handle + keeps knob upright
    this.rotHandle = document.createElement('div')
    this.rotHandle.className = 'rte-image-rot-handle'
    this.rotHandle.title = 'Drag to rotate'
    this.rotHandle.setAttribute('aria-label', 'Rotation handle – drag to rotate image')

    // SVG rotation icon (circular arrow) — no knob circle, no stem line
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '20')
    svg.setAttribute('height', '20')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2.5')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.pointerEvents = 'none'
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p1.setAttribute('d', 'M21 2v6h-6')
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p2.setAttribute('d', 'M21 8A10 10 0 1 1 11 2')
    svg.appendChild(p1)
    svg.appendChild(p2)
    this.rotHandle.appendChild(svg)

    this.rotHandle.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault(); e.stopPropagation()
      this.dom.classList.add('rte-image-wrapper--rotating')
      this.rotHandle.style.cursor = 'grabbing'
      const onMove = (ev: MouseEvent) => { this.applyRotation(this.angleFromCenter(ev)) }
      const onUp   = (ev: MouseEvent) => {
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
    this.inner.appendChild(this.rotHandle)

    // ── Resize handle (child of inner → orbits with rotation) ────────────────
    // Drag delta is projected onto the image's rotated axis so enlarging /
    // shrinking always works correctly at any angle.
    this.resizeHandle = document.createElement('div')
    this.resizeHandle.className = 'rte-image-resize-handle'
    let startX = 0, startY = 0, startW = 0
    this.resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault(); e.stopPropagation()
      startX = e.clientX; startY = e.clientY
      startW = this.img.offsetWidth
      const rad = (this.node.attrs.rotation ?? 0) * Math.PI / 180
      const onMove = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX) * Math.cos(rad) + (ev.clientY - startY) * Math.sin(rad)
        this.img.style.width = `${Math.max(40, startW + delta)}px`
      }
      const onUp = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX) * Math.cos(rad) + (ev.clientY - startY) * Math.sin(rad)
        this.updateAttr('width', Math.max(40, startW + delta))
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    this.inner.appendChild(this.resizeHandle)

    // Apply initial rotation / counter-rotations
    this.applyRotation(node.attrs.rotation ?? 0)
  }

  /**
   * Angle (0–359°, clockwise, 0 = directly above) from the inner container's
   * visual centre to the mouse cursor.
   * Uses inner.getBoundingClientRect() so the centre is always correct even
   * after CSS transform has been applied (getBoundingClientRect is post-transform).
   */
  private angleFromCenter(ev: MouseEvent): number {
    const r  = this.inner.getBoundingClientRect()
    const cx = r.left + r.width  / 2
    const cy = r.top  + r.height / 2
    return Math.round((Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90 + 360) % 360)
  }

  private applyRotation(deg: number) {
    // 1. Rotate the inner container — image + handles orbit together
    this.inner.style.transform = deg ? `rotate(${deg}deg)` : ''
    // 2. Counter-rotate handles so they appear upright on screen
    //    rotHandle: preserve translateX(-50%) for horizontal centering
    this.rotHandle.style.transform    = `translateX(-50%) rotate(${-deg}deg)`
    this.resizeHandle.style.transform = deg ? `rotate(${-deg}deg)` : ''
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
    return this.rotHandle.contains(event.target as Node) ||
           this.resizeHandle.contains(event.target as Node)
  }
}

