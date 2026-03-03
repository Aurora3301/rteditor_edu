import type { Node as ProseMirrorNode, NodeSpec } from 'prosemirror-model'

export const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    attrs: { textAlign: { default: null } },
    parseDOM: [{
      tag: 'p',
      getAttrs(dom: HTMLElement) {
        return { textAlign: dom.style.textAlign || null }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      const attrs: Record<string, string> = {}
      const validAligns = ['left', 'center', 'right', 'justify']
      if (node.attrs.textAlign && validAligns.includes(node.attrs.textAlign)) {
        attrs.style = `text-align: ${node.attrs.textAlign}`
      }
      return ['p', attrs, 0]
    },
  } as NodeSpec,

  heading: {
    content: 'inline*',
    group: 'block',
    attrs: {
      level: { default: 1 },
      textAlign: { default: null },
    },
    parseDOM: [1, 2, 3].map(level => ({
      tag: `h${level}`,
      attrs: { level },
      getAttrs(dom: HTMLElement) {
        return { level, textAlign: dom.style.textAlign || null }
      },
    })),
    toDOM(node: ProseMirrorNode) {
      const attrs: Record<string, string> = {}
      const validAligns = ['left', 'center', 'right', 'justify']
      if (node.attrs.textAlign && validAligns.includes(node.attrs.textAlign)) {
        attrs.style = `text-align: ${node.attrs.textAlign}`
      }
      return [`h${node.attrs.level}`, attrs, 0]
    },
  } as NodeSpec,

  blockquote: {
    content: 'block+',
    group: 'block',
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0]
    },
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr']
    },
  },

  bullet_list: {
    content: 'list_item+',
    group: 'block',
    parseDOM: [{ tag: 'ul' }],
    toDOM() {
      return ['ul', 0]
    },
  },

  ordered_list: {
    content: 'list_item+',
    group: 'block',
    attrs: { order: { default: 1 } },
    parseDOM: [
      {
        tag: 'ol',
        getAttrs(dom: HTMLElement) {
          return {
            order: dom.hasAttribute('start')
              ? +dom.getAttribute('start')!
              : 1,
          }
        },
      },
    ],
    toDOM(node) {
      return node.attrs.order === 1
        ? ['ol', 0]
        : ['ol', { start: node.attrs.order }, 0]
    },
  },

  list_item: {
    content: 'paragraph block*',
    parseDOM: [{ tag: 'li' }],
    toDOM() {
      return ['li', 0]
    },
  },

  table: {
    content: 'table_row+',
    group: 'block',
    tableRole: 'table',
    parseDOM: [{ tag: 'table' }],
    toDOM() { return ['table', ['tbody', 0]] },
  } as NodeSpec,

  table_row: {
    content: '(table_cell | table_header)*',
    tableRole: 'row',
    parseDOM: [{ tag: 'tr' }],
    toDOM() { return ['tr', 0] },
  } as NodeSpec,

  table_cell: {
    content: 'block+',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
    tableRole: 'cell',
    isolating: true,
    parseDOM: [{
      tag: 'td',
      getAttrs(dom: HTMLElement) {
        return {
          colspan: Number(dom.getAttribute('colspan') || 1),
          rowspan: Number(dom.getAttribute('rowspan') || 1),
          colwidth: dom.getAttribute('data-colwidth')
            ? dom.getAttribute('data-colwidth')!.split(',').map(Number)
            : null,
        }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      const attrs: Record<string, any> = {}
      if (node.attrs.colspan !== 1) attrs.colspan = node.attrs.colspan
      if (node.attrs.rowspan !== 1) attrs.rowspan = node.attrs.rowspan
      if (node.attrs.colwidth) attrs['data-colwidth'] = node.attrs.colwidth.join(',')
      return ['td', attrs, 0]
    },
  } as NodeSpec,

  table_header: {
    content: 'block+',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
    tableRole: 'header_cell',
    isolating: true,
    parseDOM: [{
      tag: 'th',
      getAttrs(dom: HTMLElement) {
        return {
          colspan: Number(dom.getAttribute('colspan') || 1),
          rowspan: Number(dom.getAttribute('rowspan') || 1),
          colwidth: dom.getAttribute('data-colwidth')
            ? dom.getAttribute('data-colwidth')!.split(',').map(Number)
            : null,
        }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      const attrs: Record<string, any> = {}
      if (node.attrs.colspan !== 1) attrs.colspan = node.attrs.colspan
      if (node.attrs.rowspan !== 1) attrs.rowspan = node.attrs.rowspan
      if (node.attrs.colwidth) attrs['data-colwidth'] = node.attrs.colwidth.join(',')
      return ['th', attrs, 0]
    },
  } as NodeSpec,

  math_inline: {
    group: 'inline',
    inline: true,
    atom: true,
    attrs: { latex: { default: '' } },
    parseDOM: [{
      tag: 'span[data-math]',
      getAttrs(dom: HTMLElement) {
        return { latex: dom.getAttribute('data-math') || '' }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      return ['span', { 'data-math': node.attrs.latex, class: 'rte-math-inline' }, node.attrs.latex]
    },
  } as NodeSpec,

  text: {
    group: 'inline',
    inline: true,
  },

  hard_break: {
    group: 'inline',
    inline: true,
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br']
    },
  },

  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      rotation: { default: 0 },
    },
    group: 'inline',
    draggable: true,
    parseDOM: [{
      tag: 'img[src]',
      getAttrs(dom: HTMLElement) {
        const src = dom.getAttribute('src') || ''
        if (/^(javascript|vbscript):/i.test(src.trim())) return false
        if (src.startsWith('data:') && !src.startsWith('data:image/')) return false
        return {
          src,
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          width: dom.getAttribute('width'),
          height: dom.getAttribute('height'),
          rotation: Number(dom.getAttribute('data-rotation') ?? 0),
        }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      const { src, alt, title, width, height, rotation } = node.attrs
      const attrs: Record<string, string> = { src }
      if (alt) attrs.alt = alt
      if (title) attrs.title = title
      if (width) attrs.width = String(width)
      if (height) attrs.height = String(height)
      if (rotation) {
        attrs['data-rotation'] = String(rotation)
        attrs.style = `transform:rotate(${rotation}deg)`
      }
      return ['img', attrs]
    },
  } as NodeSpec,
}
