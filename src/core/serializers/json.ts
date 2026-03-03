import { Node as ProseMirrorNode } from 'prosemirror-model'
import { schema } from '../schema'

/**
 * Serialize a ProseMirror document to a plain JSON object.
 * This is the lossless format — source of truth for re-editing.
 */
export function toJSON(doc: ProseMirrorNode): Record<string, any> {
  return doc.toJSON()
}

/**
 * Parse a JSON object back into a ProseMirror document.
 * Throws if the JSON is invalid — caller should handle the error.
 */
export function fromJSON(json: Record<string, any>): ProseMirrorNode {
  try {
    return ProseMirrorNode.fromJSON(schema, json)
  } catch (error) {
    console.error('[rteditor] Invalid JSON document:', error)
    throw error
  }
}
