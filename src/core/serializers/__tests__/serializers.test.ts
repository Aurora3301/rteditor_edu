import { describe, it, expect } from 'vitest'
import { schema } from '../../schema'
import { toHTML, fromHTML, createEmptyDoc } from '../html'
import { toJSON, fromJSON } from '../json'

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
