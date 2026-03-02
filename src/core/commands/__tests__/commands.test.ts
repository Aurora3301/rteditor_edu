import { describe, it, expect } from 'vitest'
import { EditorState, Transaction, TextSelection } from 'prosemirror-state'
import { schema } from '../../schema'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode,
  setHeading, setParagraph, toggleBlockquote, insertHorizontalRule,
  isMarkActive, isBlockActive, canUndo, canRedo,
  undo, redo,
} from '../formatting'

// Helper: create a state with simple text content
function createState(content?: string) {
  const doc = content
    ? schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text(content)])
      ])
    : schema.node('doc', null, [schema.node('paragraph')])

  return EditorState.create({ doc, schema, plugins: [] })
}

// Helper: create state and select all text
function createStateWithSelection(content: string) {
  const state = createState(content)
  // Select all content: from position 1 (inside paragraph) to end of text
  const tr = state.tr.setSelection(
    TextSelection.create(state.doc, 1, 1 + content.length)
  )
  return state.apply(tr)
}

describe('Mark Commands', () => {
  it('toggleBold should be applicable on text', () => {
    const state = createStateWithSelection('Hello')
    // toggleBold returns true if it CAN be applied (dry run without dispatch)
    expect(toggleBold(state)).toBe(true)
  })

  it('toggleItalic should be applicable on text', () => {
    const state = createStateWithSelection('Hello')
    expect(toggleItalic(state)).toBe(true)
  })

  it('toggleUnderline should be applicable on text', () => {
    const state = createStateWithSelection('Hello')
    expect(toggleUnderline(state)).toBe(true)
  })

  it('toggleStrike should be applicable on text', () => {
    const state = createStateWithSelection('Hello')
    expect(toggleStrike(state)).toBe(true)
  })

  it('toggleCode should be applicable on text', () => {
    const state = createStateWithSelection('Hello')
    expect(toggleCode(state)).toBe(true)
  })

  it('toggleBold should apply bold mark when dispatched', () => {
    const state = createStateWithSelection('Hello')
    let newState: EditorState | null = null
    toggleBold(state, (tr: Transaction) => {
      newState = state.apply(tr)
    })
    expect(newState).not.toBeNull()
    // The text should now have a bold mark
    const textNode = newState!.doc.firstChild?.firstChild
    expect(textNode?.marks.some((m: any) => m.type.name === 'bold')).toBe(true)
  })
})

describe('Block Commands', () => {
  it('setHeading should convert paragraph to heading', () => {
    const state = createStateWithSelection('Title')
    let newState: EditorState | null = null
    setHeading(1)(state, (tr: Transaction) => {
      newState = state.apply(tr)
    })
    expect(newState).not.toBeNull()
    expect(newState!.doc.firstChild?.type.name).toBe('heading')
    expect(newState!.doc.firstChild?.attrs.level).toBe(1)
  })

  it('setHeading should work for levels 1, 2, 3', () => {
    for (const level of [1, 2, 3] as const) {
      const state = createStateWithSelection('Title')
      let newState: EditorState | null = null
      setHeading(level)(state, (tr: Transaction) => {
        newState = state.apply(tr)
      })
      expect(newState!.doc.firstChild?.attrs.level).toBe(level)
    }
  })

  it('setParagraph should convert heading back to paragraph', () => {
    // Start with a heading, then convert to paragraph
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 1 }, [schema.text('Hello')])
    ])
    const state = EditorState.create({ doc, schema, plugins: [] })
    let newState: EditorState | null = null
    setParagraph(state, (tr: Transaction) => {
      newState = state.apply(tr)
    })
    expect(newState).not.toBeNull()
    expect(newState!.doc.firstChild?.type.name).toBe('paragraph')
  })

  it('insertHorizontalRule should insert hr node', () => {
    const state = createState('Hello')
    let newState: EditorState | null = null
    insertHorizontalRule(state, (tr: Transaction) => {
      newState = state.apply(tr)
    })
    expect(newState).not.toBeNull()
    // Doc should now contain a horizontal_rule
    let hasHR = false
    newState!.doc.forEach(node => {
      if (node.type.name === 'horizontal_rule') hasHR = true
    })
    expect(hasHR).toBe(true)
  })
})

describe('State Check Helpers', () => {
  it('isMarkActive should return false on plain text', () => {
    const state = createState('Hello')
    expect(isMarkActive(schema.marks.bold)(state)).toBe(false)
  })

  it('isBlockActive should detect paragraph', () => {
    const state = createState('Hello')
    expect(isBlockActive(schema.nodes.paragraph)(state)).toBe(true)
  })

  it('isBlockActive should detect heading with attrs', () => {
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 2 }, [schema.text('Title')])
    ])
    const state = EditorState.create({ doc, schema, plugins: [] })
    expect(isBlockActive(schema.nodes.heading, { level: 2 })(state)).toBe(true)
    expect(isBlockActive(schema.nodes.heading, { level: 1 })(state)).toBe(false)
  })

  it('canUndo should return false on fresh state', () => {
    const state = createState('Hello')
    expect(canUndo(state)).toBe(false)
  })

  it('canRedo should return false on fresh state', () => {
    const state = createState('Hello')
    expect(canRedo(state)).toBe(false)
  })
})

