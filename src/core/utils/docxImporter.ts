/**
 * docxImporter.ts
 * Converts a .docx File to a ProseMirror document using mammoth.js.
 * Mammoth HTML output is sanitized with DOMPurify before parsing to prevent XSS.
 */
import mammoth from 'mammoth'
import DOMPurify from 'dompurify'
import { fromHTML } from '../serializers/html'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'sub', 'sup',
  'a', 'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'br', 'hr', 'span',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'title', 'width', 'height',
  'colspan', 'rowspan',
  'start', 'type',
]

export async function importDocx(file: File): Promise<ProseMirrorNode> {
  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await file.arrayBuffer()
  } catch (err) {
    throw new Error(`Failed to read file: ${(err as Error).message}`)
  }

  let result: Awaited<ReturnType<typeof mammoth.convertToHtml>>
  try {
    result = await mammoth.convertToHtml({ arrayBuffer })
  } catch (err) {
    throw new Error(`Invalid or unsupported DOCX file: ${(err as Error).message}`)
  }

  const clean = DOMPurify.sanitize(result.value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return fromHTML(clean)
}

