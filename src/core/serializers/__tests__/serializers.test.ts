import { describe, it, expect } from 'vitest'
import { schema } from '../../schema'
import { toHTML, fromHTML, createEmptyDoc } from '../html'
import { toJSON, fromJSON } from '../json'
import { toMarkdown } from '../markdown'
import { getDocStats, getSelectionStats } from '../../utils/wordCount'
import { importFromCKEditor4 } from '../../utils/ckEditor4Import'

describe('HTML Serializer', () => {
  it('toHTML should serialize empty doc', () => {
    const doc = createEmptyDoc()
    const html = toHTML(doc)
    expect(html).toContain('<p>')
  })

  it('toHTML should serialize paragraph with text', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world')])
    ])
    const html = toHTML(doc)
    expect(html).toContain('Hello world')
    expect(html).toContain('<p>')
  })

  it('toHTML should serialize bold text', () => {
    const boldMark = schema.mark('bold')
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('Bold', [boldMark])
      ])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<strong>Bold</strong>')
  })

  it('toHTML should serialize heading', () => {
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 1 }, [schema.text('Title')])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<h1>Title</h1>')
  })

  it('toHTML should serialize heading level 2', () => {
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 2 }, [schema.text('Subtitle')])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<h2>Subtitle</h2>')
  })

  it('toHTML should serialize bullet list', () => {
    const doc = schema.node('doc', null, [
      schema.node('bullet_list', null, [
        schema.node('list_item', null, [
          schema.node('paragraph', null, [schema.text('Item 1')])
        ])
      ])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
    expect(html).toContain('Item 1')
  })

  it('toHTML should serialize blockquote', () => {
    const doc = schema.node('doc', null, [
      schema.node('blockquote', null, [
        schema.node('paragraph', null, [schema.text('Quote')])
      ])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<blockquote>')
    expect(html).toContain('Quote')
  })

  it('toHTML should serialize horizontal rule', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Before')]),
      schema.node('horizontal_rule'),
      schema.node('paragraph', null, [schema.text('After')])
    ])
    const html = toHTML(doc)
    expect(html).toContain('<hr>')
  })

  it('fromHTML should parse simple paragraph', () => {
    const doc = fromHTML('<p>Hello</p>')
    expect(doc.type.name).toBe('doc')
    expect(doc.firstChild?.type.name).toBe('paragraph')
    expect(doc.textContent).toBe('Hello')
  })

  it('fromHTML should parse bold text', () => {
    const doc = fromHTML('<p><strong>Bold</strong></p>')
    const textNode = doc.firstChild?.firstChild
    expect(textNode?.marks.some((m: any) => m.type.name === 'bold')).toBe(true)
  })

  it('fromHTML should parse heading', () => {
    const doc = fromHTML('<h1>Title</h1>')
    expect(doc.firstChild?.type.name).toBe('heading')
    expect(doc.firstChild?.attrs.level).toBe(1)
  })

  it('createEmptyDoc should create doc with empty paragraph', () => {
    const doc = createEmptyDoc()
    expect(doc.type.name).toBe('doc')
    expect(doc.childCount).toBe(1)
    expect(doc.firstChild?.type.name).toBe('paragraph')
    expect(doc.firstChild?.childCount).toBe(0)
  })
})

describe('JSON Serializer', () => {
  it('toJSON should produce a plain object', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello')])
    ])
    const json = toJSON(doc)
    expect(json).toHaveProperty('type', 'doc')
    expect(json).toHaveProperty('content')
    expect(Array.isArray(json.content)).toBe(true)
  })

  it('fromJSON should reconstruct the document', () => {
    const original = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello')])
    ])
    const json = toJSON(original)
    const reconstructed = fromJSON(json)
    expect(reconstructed.type.name).toBe('doc')
    expect(reconstructed.textContent).toBe('Hello')
  })

  it('JSON round-trip should be lossless', () => {
    const boldMark = schema.mark('bold')
    const italicMark = schema.mark('italic')
    const original = schema.node('doc', null, [
      schema.node('heading', { level: 2 }, [schema.text('Title')]),
      schema.node('paragraph', null, [
        schema.text('Normal '),
        schema.text('Bold', [boldMark]),
        schema.text(' and '),
        schema.text('italic', [italicMark]),
      ]),
      schema.node('bullet_list', null, [
        schema.node('list_item', null, [
          schema.node('paragraph', null, [schema.text('Item')])
        ])
      ])
    ])

    const json = toJSON(original)
    const reconstructed = fromJSON(json)
    expect(toJSON(reconstructed)).toEqual(json)
  })

  it('fromJSON should throw on invalid JSON', () => {
    expect(() => fromJSON({ type: 'nonexistent_node' })).toThrow()
  })

  it('HTML round-trip should preserve content', () => {
    const original = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world')])
    ])
    const html = toHTML(original)
    const reconstructed = fromHTML(html)
    expect(reconstructed.textContent).toBe(original.textContent)
  })
})


describe('HTML Serializer — Phase 2 Nodes', () => {
  it('toHTML should serialize table', () => {
    const cell = (text: string) => schema.node('table_cell', null, [
      schema.node('paragraph', null, [schema.text(text)])
    ])
    const row = schema.node('table_row', null, [cell('A'), cell('B')])
    const table = schema.node('table', null, [row])
    const doc = schema.node('doc', null, [table])
    const html = toHTML(doc)
    expect(html).toContain('<table>')
    expect(html).toContain('<td>')
    expect(html).toContain('A')
    expect(html).toContain('B')
  })

  it('toHTML should serialize table with header', () => {
    const header = (text: string) => schema.node('table_header', null, [
      schema.node('paragraph', null, [schema.text(text)])
    ])
    const cell = (text: string) => schema.node('table_cell', null, [
      schema.node('paragraph', null, [schema.text(text)])
    ])
    const headerRow = schema.node('table_row', null, [header('Name'), header('Age')])
    const dataRow = schema.node('table_row', null, [cell('Alice'), cell('30')])
    const table = schema.node('table', null, [headerRow, dataRow])
    const doc = schema.node('doc', null, [table])
    const html = toHTML(doc)
    expect(html).toContain('<th>')
    expect(html).toContain('Name')
    expect(html).toContain('Alice')
  })

  it('toHTML should serialize textColor mark', () => {
    const colorMark = schema.mark('textColor', { color: '#ff0000' })
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Red text', [colorMark])])
    ])
    const html = toHTML(doc)
    expect(html).toContain('color:')
    expect(html).toContain('Red text')
  })

  it('toHTML should serialize highlight mark', () => {
    const hlMark = schema.mark('highlight', { color: '#ffff00' })
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Highlighted', [hlMark])])
    ])
    const html = toHTML(doc)
    expect(html).toContain('background-color:')
  })

  it('fromHTML should parse table', () => {
    const html = '<table><tbody><tr><td><p>Cell</p></td></tr></tbody></table>'
    const doc = fromHTML(html)
    let hasTable = false
    doc.descendants(node => {
      if (node.type.name === 'table') hasTable = true
    })
    expect(hasTable).toBe(true)
  })
})

describe('Markdown Serializer', () => {
  it('toMarkdown should serialize a paragraph', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world')])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('Hello world')
  })

  it('toMarkdown should serialize headings with # prefix', () => {
    const doc = schema.node('doc', null, [
      schema.node('heading', { level: 1 }, [schema.text('Title')]),
      schema.node('heading', { level: 2 }, [schema.text('Sub')]),
      schema.node('heading', { level: 3 }, [schema.text('Minor')]),
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('# Title')
    expect(md).toContain('## Sub')
    expect(md).toContain('### Minor')
  })

  it('toMarkdown should serialize bold as **text**', () => {
    const boldMark = schema.mark('bold')
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Bold', [boldMark])])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('**Bold**')
  })

  it('toMarkdown should serialize italic as _text_', () => {
    const italicMark = schema.mark('italic')
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Italic', [italicMark])])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('_Italic_')
  })

  it('toMarkdown should serialize bullet list with - prefix', () => {
    const doc = schema.node('doc', null, [
      schema.node('bullet_list', null, [
        schema.node('list_item', null, [schema.node('paragraph', null, [schema.text('Item 1')])]),
        schema.node('list_item', null, [schema.node('paragraph', null, [schema.text('Item 2')])]),
      ])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('- Item 1')
    expect(md).toContain('- Item 2')
  })

  it('toMarkdown should serialize ordered list with 1. prefix', () => {
    const doc = schema.node('doc', null, [
      schema.node('ordered_list', null, [
        schema.node('list_item', null, [schema.node('paragraph', null, [schema.text('First')])]),
        schema.node('list_item', null, [schema.node('paragraph', null, [schema.text('Second')])]),
      ])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('1. First')
    expect(md).toContain('2. Second')
  })

  it('toMarkdown should serialize blockquote with > prefix', () => {
    const doc = schema.node('doc', null, [
      schema.node('blockquote', null, [
        schema.node('paragraph', null, [schema.text('A quote')])
      ])
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('> A quote')
  })

  it('toMarkdown should serialize horizontal rule as ---', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Before')]),
      schema.node('horizontal_rule'),
      schema.node('paragraph', null, [schema.text('After')]),
    ])
    const md = toMarkdown(doc)
    expect(md).toContain('---')
  })

  it('toMarkdown should serialize a table as markdown table', () => {
    const cell = (text: string) => schema.node('table_cell', null, [
      schema.node('paragraph', null, [schema.text(text)])
    ])
    const row = (cells: any[]) => schema.node('table_row', null, cells)
    const table = schema.node('table', null, [
      row([cell('Name'), cell('Age')]),
      row([cell('Alice'), cell('30')]),
    ])
    const doc = schema.node('doc', null, [table])
    const md = toMarkdown(doc)
    expect(md).toContain('| Name')
    expect(md).toContain('| Alice')
    expect(md).toContain('---')
  })


})

describe('Word Count Utility', () => {
  it('getDocStats should return zero for empty doc', () => {
    const doc = schema.node('doc', null, [schema.node('paragraph')])
    const stats = getDocStats(doc)
    expect(stats.words).toBe(0)
    expect(stats.chars).toBe(0)
    expect(stats.paragraphs).toBe(1)
  })

  it('getDocStats should count words correctly', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world foo')])
    ])
    const stats = getDocStats(doc)
    expect(stats.words).toBe(3)
  })

  it('getDocStats should count paragraphs', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('First')]),
      schema.node('paragraph', null, [schema.text('Second')]),
      schema.node('paragraph', null, [schema.text('Third')]),
    ])
    const stats = getDocStats(doc)
    expect(stats.paragraphs).toBe(3)
  })

  it('getDocStats should count characters', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello')])
    ])
    const stats = getDocStats(doc)
    expect(stats.chars).toBe(5)
    expect(stats.charsNoSpaces).toBe(5)
  })

  it('getDocStats charsNoSpaces should exclude whitespace', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('Hello world')])
    ])
    const stats = getDocStats(doc)
    expect(stats.chars).toBe(11)
    expect(stats.charsNoSpaces).toBe(10)
  })

  it('getSelectionStats should count words in selection text', () => {
    const result = getSelectionStats('three words here')
    expect(result.words).toBe(3)
    expect(result.chars).toBe(16)
  })

  it('getSelectionStats should return 0 for empty string', () => {
    const result = getSelectionStats('')
    expect(result.words).toBe(0)
    expect(result.chars).toBe(0)
  })
})

describe('CKEditor 4 Import', () => {
  it('importFromCKEditor4 should return a string', () => {
    const result = importFromCKEditor4('<p>Hello</p>')
    expect(typeof result).toBe('string')
  })

  it('should strip data-cke-* attributes', () => {
    const result = importFromCKEditor4('<p data-cke-bookmark="1">Text</p>')
    expect(result).not.toContain('data-cke')
  })

  it('should strip contenteditable attribute', () => {
    const result = importFromCKEditor4('<div contenteditable="true"><p>Text</p></div>')
    expect(result).not.toContain('contenteditable')
  })

  it('should normalize <b> to <strong>', () => {
    const result = importFromCKEditor4('<p><b>Bold</b></p>')
    expect(result).toContain('<strong>')
    expect(result).not.toContain('<b>')
  })

  it('should normalize <i> to <em>', () => {
    const result = importFromCKEditor4('<p><i>Italic</i></p>')
    expect(result).toContain('<em>')
    expect(result).not.toContain('<i>')
  })

  it('should normalize <strike> to <s>', () => {
    const result = importFromCKEditor4('<p><strike>struck</strike></p>')
    expect(result).toContain('<s>')
    expect(result).not.toContain('<strike>')
  })

  it('should strip cke_ class names', () => {
    const result = importFromCKEditor4('<p class="cke_editable">Text</p>')
    expect(result).not.toContain('cke_')
  })

  it('should preserve non-cke class names', () => {
    const result = importFromCKEditor4('<p class="my-class">Text</p>')
    expect(result).toContain('my-class')
  })

  it('should preserve text content', () => {
    const result = importFromCKEditor4('<p>Keep this text</p>')
    expect(result).toContain('Keep this text')
  })

  it('should handle nested elements', () => {
    const result = importFromCKEditor4('<p><b><i>Bold italic</i></b></p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
  })
})