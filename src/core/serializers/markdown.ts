import { Node as ProseMirrorNode } from 'prosemirror-model'

/** Convert a ProseMirror document node to a standard Markdown string */
export function toMarkdown(doc: ProseMirrorNode): string {
  return serializeNode(doc).trim()
}

function children(node: ProseMirrorNode): ProseMirrorNode[] {
  const arr: ProseMirrorNode[] = []
  node.forEach(child => arr.push(child))
  return arr
}

function serializeNode(node: ProseMirrorNode, context?: string): string {
  switch (node.type.name) {
    case 'doc':
      return children(node).map(child => serializeNode(child)).join('\n\n')

    case 'paragraph':
      return node.textContent ? serializeInline(node) : ''

    case 'heading': {
      const level = node.attrs.level
      return '#'.repeat(level) + ' ' + serializeInline(node)
    }

    case 'blockquote':
      return children(node)
        .map(child => serializeNode(child).split('\n').map(l => '> ' + l).join('\n'))
        .join('\n>\n')

    case 'horizontal_rule':
      return '---'

    case 'bullet_list':
      return children(node).map(child => serializeListItem(child, '- ')).join('\n')

    case 'ordered_list':
      return children(node).map((child, i) => serializeListItem(child, `${i + 1}. `)).join('\n')

    case 'list_item':
      return serializeNode(node.firstChild!)

    case 'task_list':
      return children(node).map(child => {
        const checked = child.attrs.checked ? '[x]' : '[ ]'
        return `- ${checked} ${serializeInline(child.firstChild!)}`
      }).join('\n')

    case 'task_item':
      return serializeInline(node.firstChild!)

    case 'table':
      return serializeTable(node)

    case 'image': {
      const { src, alt, title } = node.attrs
      return `![${alt || ''}](${src}${title ? ` "${title}"` : ''})`
    }

    default:
      return node.textContent || ''
  }
}

function serializeListItem(node: ProseMirrorNode, prefix: string): string {
  const content = children(node)
    .map((child, i) => i === 0 ? serializeNode(child) : serializeNode(child))
    .join('\n')
  return content.split('\n').map((line, i) => i === 0 ? prefix + line : '  ' + line).join('\n')
}

function serializeInline(node: ProseMirrorNode): string {
  let out = ''
  node.forEach(child => {
    if (!child.isText) {
      if (child.type.name === 'hard_break') { out += '\n'; return }
      if (child.type.name === 'image') { out += serializeNode(child); return }
      return
    }
    let text = child.text || ''
    const marks = child.marks
    // Apply marks in order: code first (excludes others), then others
    const isCode = marks.some(m => m.type.name === 'code')
    if (isCode) { out += '`' + text + '`'; return }

    let open = '', close = ''
    for (const mark of marks) {
      switch (mark.type.name) {
        case 'bold':      open = '**' + open; close = close + '**'; break
        case 'italic':    open = '_' + open;  close = close + '_';  break
        case 'strike':    open = '~~' + open; close = close + '~~'; break
        case 'link':      open = '[' + open;  close = close + `](${mark.attrs.href})`; break
      }
    }
    out += open + text + close
  })
  return out
}

function serializeTable(table: ProseMirrorNode): string {
  const rows: string[][] = []
  table.forEach(row => {
    const cells: string[] = []
    row.forEach(cell => { cells.push(serializeInline(cell.firstChild!).trim()) })
    rows.push(cells)
  })
  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map(r => r.length))
  const header = rows[0]
  const separator = Array.from({ length: colCount }, () => '---')
  const body = rows.slice(1)

  const fmt = (row: string[]) => '| ' + row.map(c => c || ' ').join(' | ') + ' |'
  return [fmt(header), fmt(separator), ...body.map(fmt)].join('\n')
}

