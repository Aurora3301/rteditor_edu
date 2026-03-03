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
  it('should have all 4 required marks', () => {
    const requiredMarks = ['bold', 'italic', 'underline', 'strike']
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

describe('Phase 2 Nodes', () => {
  it('should have table, table_row, table_cell, table_header nodes', () => {
    expect(schema.nodes.table).toBeDefined()
    expect(schema.nodes.table_row).toBeDefined()
    expect(schema.nodes.table_cell).toBeDefined()
    expect(schema.nodes.table_header).toBeDefined()
  })

  it('should create a basic 2x2 table', () => {
    const cell = (text: string) => schema.node('table_cell', null, [
      schema.node('paragraph', null, [schema.text(text)])
    ])
    const row = (cells: ReturnType<typeof cell>[]) => schema.node('table_row', null, cells)
    const table = schema.node('table', null, [
      row([cell('A'), cell('B')]),
      row([cell('C'), cell('D')]),
    ])
    expect(table.type.name).toBe('table')
    expect(table.childCount).toBe(2)
  })

  it('table_cell should have colspan/rowspan attrs defaulting to 1', () => {
    const cell = schema.node('table_cell', null, [schema.node('paragraph')])
    expect(cell.attrs.colspan).toBe(1)
    expect(cell.attrs.rowspan).toBe(1)
  })

  it('table_header should have tableRole header_cell', () => {
    expect(schema.nodes.table_header.spec.tableRole).toBe('header_cell')
  })
})

// ─── Phase 3 Nodes ──────────────────────────────────────────────────────────
describe('Phase 3 Nodes — math_inline', () => {
  it('should have a math_inline node', () => {
    expect(schema.nodes.math_inline).toBeDefined()
  })

  it('math_inline should be inline and atomic', () => {
    expect(schema.nodes.math_inline.spec.inline).toBe(true)
    expect(schema.nodes.math_inline.spec.atom).toBe(true)
  })

  it('math_inline should have a latex attr defaulting to empty string', () => {
    const node = schema.node('math_inline', { latex: '' })
    expect(node.attrs.latex).toBe('')
  })

  it('math_inline should store latex expression', () => {
    const node = schema.node('math_inline', { latex: 'x^2 + y^2 = z^2' })
    expect(node.attrs.latex).toBe('x^2 + y^2 = z^2')
  })

  it('math_inline toDOM should produce span with data-math attr', () => {
    const node = schema.node('math_inline', { latex: '\\pi' })
    const [tag, attrs] = node.type.spec.toDOM!(node) as [string, any, string]
    expect(tag).toBe('span')
    expect(attrs['data-math']).toBe('\\pi')
  })

  it('math_inline should be placeable inside a paragraph', () => {
    const math = schema.node('math_inline', { latex: 'E=mc^2' })
    const text = schema.text('Before ')
    const p = schema.node('paragraph', null, [text, math])
    expect(p.childCount).toBe(2)
    expect(p.child(1).type.name).toBe('math_inline')
  })
})

describe('Phase 3 Nodes — image (rotation)', () => {
  it('image node should have rotation attr defaulting to 0', () => {
    const node = schema.node('image', { src: 'x.png' })
    expect(node.attrs.rotation).toBe(0)
  })

  it('image node should NOT have float attr', () => {
    const node = schema.node('image', { src: 'x.png' })
    expect(node.attrs.float).toBeUndefined()
  })

  it('image node should NOT have caption attr', () => {
    const node = schema.node('image', { src: 'x.png' })
    expect(node.attrs.caption).toBeUndefined()
  })

  it('image node should store rotation=90', () => {
    const node = schema.node('image', { src: 'x.png', rotation: 90 })
    expect(node.attrs.rotation).toBe(90)
  })

  it('image node should store rotation=270', () => {
    const node = schema.node('image', { src: 'x.png', rotation: 270 })
    expect(node.attrs.rotation).toBe(270)
  })

  it('image toDOM should emit data-rotation and style transform when rotation != 0', () => {
    const node = schema.node('image', { src: 'x.png', rotation: 90 })
    const [tag, attrs] = node.type.spec.toDOM!(node) as [string, any]
    expect(tag).toBe('img')
    expect(attrs['data-rotation']).toBe('90')
    expect(attrs.style).toContain('rotate(90deg)')
  })

  it('image toDOM should NOT emit data-rotation or transform when rotation is 0', () => {
    const node = schema.node('image', { src: 'x.png', rotation: 0 })
    const [, attrs] = node.type.spec.toDOM!(node) as [string, any]
    expect(attrs['data-rotation']).toBeUndefined()
    expect(attrs.style).toBeUndefined()
  })
})

// ─── Phase 3 Marks ──────────────────────────────────────────────────────────
describe('Phase 3 Marks — comment', () => {
  it('should have a comment mark', () => {
    expect(schema.marks.comment).toBeDefined()
  })

  it('comment mark should have id, text, author, timestamp attrs', () => {
    const mark = schema.mark('comment', { id: 'c1', text: 'Nice work', author: 'Teacher', timestamp: '2026-01-01' })
    expect(mark.attrs.id).toBe('c1')
    expect(mark.attrs.text).toBe('Nice work')
    expect(mark.attrs.author).toBe('Teacher')
    expect(mark.attrs.timestamp).toBe('2026-01-01')
  })

  it('comment mark text attr should default to empty string', () => {
    const mark = schema.mark('comment', { id: 'c2', text: '' })
    expect(mark.attrs.text).toBe('')
  })

  it('comment mark should be non-inclusive (does not extend to adjacent typed text)', () => {
    expect(schema.marks.comment.spec.inclusive).toBe(false)
  })

  it('comment toDOM should produce span.rte-comment with data-comment-id', () => {
    const mark = schema.mark('comment', { id: 'c3', text: 'Good point', author: 'Teacher', timestamp: '' })
    const [tag, attrs] = mark.type.spec.toDOM!(mark, false) as [string, any, any]
    expect(tag).toBe('span')
    expect(attrs.class).toBe('rte-comment')
    expect(attrs['data-comment-id']).toBe('c3')
    expect(attrs['data-comment-text']).toBe('Good point')
  })

  it('comment mark can be applied to text in a paragraph', () => {
    const commentMark = schema.mark('comment', { id: 'cx', text: 'See me', author: 'T', timestamp: '' })
    const text = schema.text('Student essay text', [commentMark])
    const p = schema.node('paragraph', null, [text])
    expect(p.firstChild?.marks[0].type.name).toBe('comment')
    expect(p.firstChild?.marks[0].attrs.id).toBe('cx')
  })

  it('comment mark excludes should be empty string (non-exclusive — allows stacking)', () => {
    expect(schema.marks.comment.spec.excludes).toBe('')
  })
})

describe('Phase 2 Marks', () => {
  it('should have textColor and highlight marks', () => {
    expect(schema.marks.textColor).toBeDefined()
    expect(schema.marks.highlight).toBeDefined()
  })

  it('textColor mark should have a color attr', () => {
    const mark = schema.mark('textColor', { color: '#ff0000' })
    expect(mark.attrs.color).toBe('#ff0000')
  })

  it('highlight mark should have a color attr', () => {
    const mark = schema.mark('highlight', { color: '#ffff00' })
    expect(mark.attrs.color).toBe('#ffff00')
  })

  it('textColor toDOM should produce color style', () => {
    const mark = schema.mark('textColor', { color: '#ff0000' })
    const [tag, attrs] = mark.type.spec.toDOM!(mark, false) as [string, any, any]
    expect(tag).toBe('span')
    expect(attrs.style).toContain('color: #ff0000')
  })

  it('highlight toDOM should produce background-color style', () => {
    const mark = schema.mark('highlight', { color: '#ffff00' })
    const [tag, attrs] = mark.type.spec.toDOM!(mark, false) as [string, any, any]
    expect(tag).toBe('span')
    expect(attrs.style).toContain('background-color: #ffff00')
  })

  it('textColor should sanitize dangerous CSS values', () => {
    const mark = schema.mark('textColor', { color: 'red; font-size: 100px' })
    const [, attrs] = mark.type.spec.toDOM!(mark, false) as [string, any, any]
    expect(attrs.style).not.toContain(';')
  })

  it('should apply textColor mark to text in a paragraph', () => {
    const colorMark = schema.mark('textColor', { color: '#0000ff' })
    const text = schema.text('Blue text', [colorMark])
    const p = schema.node('paragraph', null, [text])
    expect(p.firstChild?.marks[0].type.name).toBe('textColor')
    expect(p.firstChild?.marks[0].attrs.color).toBe('#0000ff')
  })
})
