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

    // ↺ rotate-left button
    const btnLeft = document.createElement('button')
    btnLeft.type = 'button'; btnLeft.textContent = '↺'
    btnLeft.title = 'Rotate left 90°'; btnLeft.setAttribute('aria-label', 'Rotate left 90°')
    btnLeft.tabIndex = 0; btnLeft.className = 'rte-image-rotbar__btn'
    const applyLeft = (e: Event) => {
      e.preventDefault()
      const next = ((( this.node.attrs.rotation ?? 0) - 90) % 360 + 360) % 360
      this.updateAttr('rotation', next)
      degInput.value = String(next)
    }
    btnLeft.addEventListener('mousedown', applyLeft)
    btnLeft.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') applyLeft(e) })
    this.rotationBar.appendChild(btnLeft)

    // Degree text input (0-360)
    const degInput = document.createElement('input')
    degInput.type = 'number'
    degInput.min = '0'; degInput.max = '360'; degInput.step = '1'
    degInput.value = String(node.attrs.rotation ?? 0)
    degInput.className = 'rte-image-rotbar__input'
    degInput.title = 'Rotation (0–360°)'
    degInput.setAttribute('aria-label', 'Rotation degrees')
    // Apply on Enter or blur
    const applyDeg = () => {
      let deg = parseInt(degInput.value, 10)
      if (isNaN(deg)) deg = 0
      deg = ((deg % 360) + 360) % 360
      degInput.value = String(deg)
      this.updateAttr('rotation', deg)
    }
    degInput.addEventListener('change', applyDeg)
    degInput.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); applyDeg() } })
    // Stop PM from swallowing the keystrokes
    degInput.addEventListener('keypress', (e) => e.stopPropagation())
    degInput.addEventListener('keyup', (e) => e.stopPropagation())
    this.rotationBar.appendChild(degInput)

    // ↻ rotate-right button
    const btnRight = document.createElement('button')
    btnRight.type = 'button'; btnRight.textContent = '↻'
    btnRight.title = 'Rotate right 90°'; btnRight.setAttribute('aria-label', 'Rotate right 90°')
    btnRight.tabIndex = 0; btnRight.className = 'rte-image-rotbar__btn'
    const applyRight = (e: Event) => {
      e.preventDefault()
      const next = (( this.node.attrs.rotation ?? 0) + 90) % 360
      this.updateAttr('rotation', next)
      degInput.value = String(next)
    }
    btnRight.addEventListener('mousedown', applyRight)
    btnRight.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') applyRight(e) })
    this.rotationBar.appendChild(btnRight)
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
    const deg = node.attrs.rotation ?? 0
    this.applyRotation(deg)
    // Keep the input field in sync (e.g., after undo)
    const input = this.rotationBar.querySelector<HTMLInputElement>('.rte-image-rotbar__input')
    if (input) input.value = String(deg)
    return true
  }

  stopEvent(event: Event): boolean {
    return this.rotationBar.contains(event.target as Node)
  }
}

