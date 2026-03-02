import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEditor, destroyEditor } from '../editor'
import { EditorView } from 'prosemirror-view'

describe('createEditor', () => {
  let container: HTMLElement
  let view: EditorView | null = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (view) {
      destroyEditor(view)
      view = null
    }
    container.remove()
  })

  it('should create an EditorView', () => {
    view = createEditor({ element: container })
    expect(view).toBeInstanceOf(EditorView)
  })

  it('should create an empty document by default', () => {
    view = createEditor({ element: container })
    expect(view.state.doc.type.name).toBe('doc')
    expect(view.state.doc.childCount).toBeGreaterThanOrEqual(1)
  })

  it('should load HTML content', () => {
    view = createEditor({
      element: container,
      content: { html: '<p>Hello from HTML</p>' },
    })
    expect(view.state.doc.textContent).toContain('Hello from HTML')
  })

  it('should load JSON content', () => {
    const jsonContent = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello from JSON' }],
      }],
    }
    view = createEditor({
      element: container,
      content: { json: jsonContent },
    })
    expect(view.state.doc.textContent).toContain('Hello from JSON')
  })

  it('should prefer JSON over HTML when both provided', () => {
    view = createEditor({
      element: container,
      content: {
        html: '<p>From HTML</p>',
        json: {
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: 'From JSON' }],
          }],
        },
      },
    })
    expect(view.state.doc.textContent).toContain('From JSON')
  })

  it('should call onUpdate when document changes', () => {
    let updateCalled = false
    view = createEditor({
      element: container,
      onUpdate: () => { updateCalled = true },
    })
    // Simulate a document change
    const tr = view.state.tr.insertText('X', 1)
    view.dispatch(tr)
    expect(updateCalled).toBe(true)
  })

  it('should call onTransaction on every transaction', () => {
    let txCount = 0
    view = createEditor({
      element: container,
      onTransaction: () => { txCount++ },
    })
    // Dispatch a transaction
    const tr = view.state.tr.insertText('A', 1)
    view.dispatch(tr)
    expect(txCount).toBeGreaterThan(0)
  })

  it('should set editable to true by default', () => {
    view = createEditor({ element: container })
    expect(view.editable).toBe(true)
  })

  it('should respect editable: false', () => {
    view = createEditor({
      element: container,
      editable: false,
    })
    expect(view.editable).toBe(false)
  })

  it('should set placeholder as data attribute', () => {
    view = createEditor({
      element: container,
      placeholder: 'Type here...',
    })
    const pm = container.querySelector('.ProseMirror')
    expect(pm?.getAttribute('data-placeholder')).toBe('Type here...')
  })

  it('destroyEditor should remove the editor', () => {
    view = createEditor({ element: container })
    destroyEditor(view)
    // After destroy, the editor's dom should be cleaned up
    expect(view.dom.parentNode).toBeNull()
    view = null // prevent afterEach from double-destroying
  })
})

describe('Editor with plugins', () => {
  let container: HTMLElement
  let view: EditorView | null = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    if (view) {
      destroyEditor(view)
      view = null
    }
    container.remove()
  })

  it('should have history plugin (undo/redo)', async () => {
    view = createEditor({ element: container })
    // Insert text then undo
    const tr = view.state.tr.insertText('Hello', 1)
    view.dispatch(tr)
    expect(view.state.doc.textContent).toContain('Hello')

    const { undo } = await import('prosemirror-history')
    const canUndo = undo(view.state, view.dispatch)
    expect(canUndo).toBe(true)
  })
})
