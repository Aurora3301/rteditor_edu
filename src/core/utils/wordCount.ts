import { Node as ProseMirrorNode } from 'prosemirror-model'

export interface DocStats {
  words: number
  chars: number
  charsNoSpaces: number
  paragraphs: number
}

/** Count words, characters and paragraphs in a ProseMirror document */
export function getDocStats(doc: ProseMirrorNode): DocStats {
  let text = ''
  let paragraphs = 0

  doc.descendants(node => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading' ||
        node.type.name === 'task_item' || node.type.name === 'list_item') {
      paragraphs++
      text += node.textContent + '\n'
    }
  })

  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
  const chars = trimmed.length
  const charsNoSpaces = trimmed.replace(/\s/g, '').length

  return { words, chars, charsNoSpaces, paragraphs }
}

/** Count stats for a selected text range */
export function getSelectionStats(text: string): { words: number; chars: number } {
  const trimmed = text.trim()
  return {
    words: trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0,
    chars: trimmed.length,
  }
}

