/**
 * docxImporter.ts
 * Converts a .docx File to a ProseMirror document using mammoth.js.
 */
import mammoth from 'mammoth'
import { fromHTML } from '../serializers/html'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

export async function importDocx(file: File): Promise<ProseMirrorNode> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  if (result.messages?.length) {
    result.messages.forEach(m => {
      if (m.type === 'warning') console.warn('[rteditor] docx import:', m.message)
    })
  }
  return fromHTML(result.value)
}

