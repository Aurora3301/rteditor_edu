import { DOMSerializer, DOMParser as ProseMirrorDOMParser, Node as ProseMirrorNode } from 'prosemirror-model'
import { schema } from '../schema'

/**
 * Convert a ProseMirror document to an HTML string.
 */
export function toHTML(doc: ProseMirrorNode): string {
  const serializer = DOMSerializer.fromSchema(schema)
  const fragment = serializer.serializeFragment(doc.content)
  const container = document.createElement('div')
  container.appendChild(fragment)
  return container.innerHTML
}

/**
 * Parse an HTML string into a ProseMirror document.
 * Uses DOMParser API (not innerHTML) to avoid XSS from script injection.
 */
export function fromHTML(html: string): ProseMirrorNode {
  const pmParser = ProseMirrorDOMParser.fromSchema(schema)
  const domParser = new DOMParser()
  const parsed = domParser.parseFromString(`<body>${html}</body>`, 'text/html')
  return pmParser.parse(parsed.body)
}

/**
 * Create an empty document.
 */
export function createEmptyDoc(): ProseMirrorNode {
  return schema.node('doc', null, [schema.node('paragraph')])
}
