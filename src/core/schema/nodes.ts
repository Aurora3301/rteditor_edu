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
      if (node.attrs.textAlign) {
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
      if (node.attrs.textAlign) {
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
    },
    group: 'inline',
    draggable: true,
    parseDOM: [{
      tag: 'img[src]',
      getAttrs(dom: HTMLElement) {
        const src = dom.getAttribute('src') || ''
        // Reject non-image dangerous protocols
        if (/^(javascript|vbscript):/i.test(src.trim())) return false
        if (src.startsWith('data:') && !src.startsWith('data:image/')) return false
        return {
          src,
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          width: dom.getAttribute('width'),
          height: dom.getAttribute('height'),
        }
      },
    }],
    toDOM(node: ProseMirrorNode) {
      const { src, alt, title, width, height } = node.attrs
      const attrs: Record<string, string> = { src }
      if (alt) attrs.alt = alt
      if (title) attrs.title = title
      if (width) attrs.width = width
      if (height) attrs.height = height
      return ['img', attrs]
    },
  } as NodeSpec,
}
