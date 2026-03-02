import { describe, it, expect } from 'vitest'
import { schema, nodes, marks } from '../index'

describe('Schema', () => {
  it('should be a valid ProseMirror Schema instance', () => {
    expect(schema).toBeDefined()
    expect(schema.spec.nodes).toBeDefined()
    expect(schema.spec.marks).toBeDefined()
  })

  it('should export nodes and marks separately', () => {
    expect(nodes).toBeDefined()
    expect(marks).toBeDefined()
  })
})

describe('Nodes', () => {
  it('should have all 10 required nodes', () => {
    const requiredNodes = [
      'doc', 'paragraph', 'heading', 'blockquote', 'horizontal_rule',
      'hard_break', 'text', 'bullet_list', 'ordered_list', 'list_item'
    ]
    for (const name of requiredNodes) {
      expect(schema.nodes[name], `Node "${name}" should exist`).toBeDefined()
    }
  })

  it('doc should accept block content', () => {
    const doc = schema.node('doc', null, [schema.node('paragraph')])
    expect(doc.type.name).toBe('doc')
    expect(doc.childCount).toBe(1)
  })

  it('paragraph should accept inline content', () => {
    const text = schema.text('Hello')
    const p = schema.node('paragraph', null, [text])
    expect(p.type.name).toBe('paragraph')
    expect(p.textContent).toBe('Hello')
  })

  it('heading should accept levels 1-3', () => {
    for (const level of [1, 2, 3]) {
      const h = schema.node('heading', { level }, [schema.text('Title')])
      expect(h.attrs.level).toBe(level)
    }
  })

  it('heading should default to level 1', () => {
    const h = schema.node('heading', null, [schema.text('Title')])
    expect(h.attrs.level).toBe(1)
  })

  it('blockquote should accept block content', () => {
    const bq = schema.node('blockquote', null, [
      schema.node('paragraph', null, [schema.text('Quote')])
    ])
    expect(bq.type.name).toBe('blockquote')
    expect(bq.textContent).toBe('Quote')
  })

  it('horizontal_rule should be a leaf node', () => {
    const hr = schema.node('horizontal_rule')
    expect(hr.type.name).toBe('horizontal_rule')
    expect(hr.childCount).toBe(0)
  })

  it('hard_break should be inline', () => {
    expect(schema.nodes.hard_break.spec.inline).toBe(true)
  })

  it('bullet_list should contain list_items', () => {
    const li = schema.node('list_item', null, [
      schema.node('paragraph', null, [schema.text('Item')])
    ])
    const ul = schema.node('bullet_list', null, [li])
    expect(ul.type.name).toBe('bullet_list')
    expect(ul.childCount).toBe(1)
  })

  it('ordered_list should have default order of 1', () => {
    const li = schema.node('list_item', null, [
      schema.node('paragraph', null, [schema.text('Item')])
    ])
    const ol = schema.node('ordered_list', null, [li])
    expect(ol.attrs.order).toBe(1)
  })

  it('ordered_list should accept custom start order', () => {
    const li = schema.node('list_item', null, [
      schema.node('paragraph', null, [schema.text('Item')])
    ])
    const ol = schema.node('ordered_list', { order: 5 }, [li])
    expect(ol.attrs.order).toBe(5)
  })

  it('list_item should accept paragraph + block content', () => {
    const li = schema.node('list_item', null, [
      schema.node('paragraph', null, [schema.text('Item')]),
      schema.node('paragraph', null, [schema.text('More')])
    ])
    expect(li.childCount).toBe(2)
  })

  it('should create a complete document with mixed content', () => {
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 1 }, [schema.text('Title')]),
      schema.node('paragraph', null, [schema.text('Body text')]),
      schema.node('bullet_list', null, [
        schema.node('list_item', null, [
          schema.node('paragraph', null, [schema.text('Item 1')])
        ]),
        schema.node('list_item', null, [
          schema.node('paragraph', null, [schema.text('Item 2')])
        ])
      ]),
      schema.node('blockquote', null, [
        schema.node('paragraph', null, [schema.text('A quote')])
      ]),
      schema.node('horizontal_rule')
    ])
    expect(doc.childCount).toBe(5)
  })
})

describe('Marks', () => {
  it('should have all 5 required marks', () => {
    const requiredMarks = ['bold', 'italic', 'underline', 'strike', 'code']
    for (const name of requiredMarks) {
      expect(schema.marks[name], `Mark "${name}" should exist`).toBeDefined()
    }
  })

  it('should create bold mark', () => {
    const bold = schema.mark('bold')
    expect(bold.type.name).toBe('bold')
  })

  it('should create italic mark', () => {
    const italic = schema.mark('italic')
    expect(italic.type.name).toBe('italic')
  })

  it('should create underline mark', () => {
    const underline = schema.mark('underline')
    expect(underline.type.name).toBe('underline')
  })

  it('should create strike mark', () => {
    const strike = schema.mark('strike')
    expect(strike.type.name).toBe('strike')
  })

  it('should create code mark', () => {
    const code = schema.mark('code')
    expect(code.type.name).toBe('code')
  })

  it('code mark should exclude other marks', () => {
    expect(schema.marks.code.spec.excludes).toBe('_')
  })

  it('should apply marks to text', () => {
    const boldMark = schema.mark('bold')
    const text = schema.text('Bold text', [boldMark])
    expect(text.marks).toHaveLength(1)
    expect(text.marks[0].type.name).toBe('bold')
  })

  it('should apply multiple marks to text', () => {
    const boldMark = schema.mark('bold')
    const italicMark = schema.mark('italic')
    const text = schema.text('Bold italic', [boldMark, italicMark])
    expect(text.marks).toHaveLength(2)
  })

  it('should put marked text in a paragraph', () => {
    const boldMark = schema.mark('bold')
    const text = schema.text('Hello', [boldMark])
    const p = schema.node('paragraph', null, [text])
    expect(p.textContent).toBe('Hello')
    expect(p.firstChild?.marks[0].type.name).toBe('bold')
  })
})
