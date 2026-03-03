/**
 * docxExporter.ts
 * Converts a ProseMirror document to a .docx file using the `docx` package.
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  ExternalHyperlink, ImageRun,
} from 'docx'
import type { Node as ProseMirrorNode, Mark } from 'prosemirror-model'

function alignmentType(align: string | null): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
  const map: Record<string, typeof AlignmentType[keyof typeof AlignmentType]> = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  }
  return align ? map[align] : undefined
}

function marksToRunProps(marks: readonly Mark[]): Record<string, any> {
  const props: Record<string, any> = {}
  for (const m of marks) {
    if (m.type.name === 'bold') props.bold = true
    if (m.type.name === 'italic') props.italics = true
    if (m.type.name === 'underline') props.underline = {}
    if (m.type.name === 'strike') props.strike = true
    if (m.type.name === 'fontSize') props.size = parseInt(m.attrs.size) * 2
    if (m.type.name === 'fontFamily') props.font = m.attrs.family
    if (m.type.name === 'textColor') props.color = m.attrs.color.replace('#', '')
    if (m.type.name === 'superscript') props.superScript = true
    if (m.type.name === 'subscript') props.subScript = true
  }
  return props
}

function inlineToRuns(node: ProseMirrorNode): (TextRun | ExternalHyperlink)[] {
  const runs: (TextRun | ExternalHyperlink)[] = []
  node.forEach(child => {
    if (child.type.name === 'text') {
      const linkMark = child.marks.find(m => m.type.name === 'link')
      const runProps = marksToRunProps(child.marks.filter(m => m.type.name !== 'link'))
      const run = new TextRun({ text: child.text || '', ...runProps })
      if (linkMark) {
        runs.push(new ExternalHyperlink({ link: linkMark.attrs.href, children: [run] }))
      } else {
        runs.push(run)
      }
    } else if (child.type.name === 'hard_break') {
      runs.push(new TextRun({ text: '', break: 1 }))
    }
  })
  return runs
}

function nodeToDocxChild(node: ProseMirrorNode): any {
  const { name } = node.type
  const align = alignmentType(node.attrs?.textAlign)

  if (name === 'paragraph') {
    return new Paragraph({ children: inlineToRuns(node), alignment: align })
  }
  if (name === 'heading') {
    const lvl = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][node.attrs.level - 1]
    return new Paragraph({ heading: lvl, children: inlineToRuns(node), alignment: align })
  }
  if (name === 'blockquote') {
    const children: any[] = []
    node.forEach(c => children.push(...nodeToDocxChildren(c)))
    return children
  }
  if (name === 'bullet_list' || name === 'ordered_list') {
    const items: Paragraph[] = []
    node.forEach(item => {
      item.forEach(para => {
        items.push(new Paragraph({
          children: inlineToRuns(para),
          bullet: name === 'bullet_list' ? { level: 0 } : undefined,
          numbering: name === 'ordered_list' ? { reference: 'default-numbering', level: 0 } : undefined,
        }))
      })
    })
    return items
  }
  if (name === 'table') {
    const tableRows: TableRow[] = []
    node.forEach(rowNode => {
      const cells: TableCell[] = []
      rowNode.forEach(cellNode => {
        const cellChildren: Paragraph[] = []
        cellNode.forEach(c => {
          cellChildren.push(...nodeToDocxChildren(c) as Paragraph[])
        })
        cells.push(new TableCell({ children: cellChildren.length ? cellChildren : [new Paragraph({})] }))
      })
      tableRows.push(new TableRow({ children: cells }))
    })
    return new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })
  }
  if (name === 'horizontal_rule') {
    return new Paragraph({ thematicBreak: true })
  }
  return new Paragraph({})
}

function nodeToDocxChildren(node: ProseMirrorNode): any[] {
  const result = nodeToDocxChild(node)
  return Array.isArray(result) ? result.flat() : [result]
}

export async function exportToDocx(doc: ProseMirrorNode, filename = 'document.docx'): Promise<void> {
  const children: any[] = []
  doc.forEach(node => children.push(...nodeToDocxChildren(node)))

  const docxDoc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(docxDoc)
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

