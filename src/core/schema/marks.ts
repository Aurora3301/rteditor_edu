import type { Mark, MarkSpec } from 'prosemirror-model'

export const marks: Record<string, MarkSpec> = {
  bold: {
    parseDOM: [
      { tag: 'strong' },
      {
        tag: 'b',
        getAttrs: (node) => (node as HTMLElement).style.fontWeight !== 'normal' && null,
      },
      { style: 'font-weight=bold' },
      {
        style: 'font-weight',
        getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
      },
    ],
    toDOM() {
      return ['strong', 0]
    },
  },

  italic: {
    parseDOM: [
      { tag: 'em' },
      {
        tag: 'i',
        getAttrs: (node) => (node as HTMLElement).style.fontStyle !== 'normal' && null,
      },
      { style: 'font-style=italic' },
    ],
    toDOM() {
      return ['em', 0]
    },
  },

  underline: {
    parseDOM: [
      { tag: 'u' },
      {
        style: 'text-decoration',
        getAttrs: (value) => (value as string).includes('underline') && null,
      },
    ],
    toDOM() {
      return ['u', 0]
    },
  },

  strike: {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      { tag: 'strike' },
      {
        style: 'text-decoration',
        getAttrs: (value) => (value as string).includes('line-through') && null,
      },
    ],
    toDOM() {
      return ['s', 0]
    },
  },

  code: {
    excludes: '_',
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0]
    },
  },

  subscript: {
    excludes: 'superscript',
    parseDOM: [{ tag: 'sub' }],
    toDOM() { return ['sub', 0] },
  } as MarkSpec,

  superscript: {
    excludes: 'subscript',
    parseDOM: [{ tag: 'sup' }],
    toDOM() { return ['sup', 0] },
  } as MarkSpec,

  fontFamily: {
    attrs: { family: {} },
    parseDOM: [{
      style: 'font-family',
      getAttrs: (value: string) => {
        // Strip quotes and normalize
        const family = value.replace(/['"]/g, '').trim()
        return family ? { family } : false
      },
    }],
    toDOM(mark: Mark) {
      // Allowlist: only alphanumerics, spaces, commas, hyphens, apostrophes
      const family = mark.attrs.family.replace(/[^a-zA-Z0-9\s,'"-]/g, '').trim()
      return ['span', { style: `font-family: ${family}` }, 0]
    },
  } as MarkSpec,

  fontSize: {
    attrs: { size: {} },
    parseDOM: [{
      style: 'font-size',
      getAttrs: (value: string) => {
        return value ? { size: value } : false
      },
    }],
    toDOM(mark: Mark) {
      // Validate font size format
      const size = /^[\d.]+(px|em|rem|pt|%)$/.test(mark.attrs.size) ? mark.attrs.size : '16px'
      return ['span', { style: `font-size: ${size}` }, 0]
    },
  } as MarkSpec,

  link: {
    attrs: {
      href: {},
      title: { default: null },
      target: { default: '_blank' },
    },
    inclusive: false,
    parseDOM: [{
      tag: 'a[href]',
      getAttrs(dom: HTMLElement) {
        const href = dom.getAttribute('href') || ''
        // Reject dangerous protocols
        if (/^(javascript|vbscript|data):/i.test(href.trim())) return false
        return {
          href,
          title: dom.getAttribute('title'),
          target: dom.getAttribute('target') || '_blank',
        }
      },
    }],
    toDOM(mark: Mark) {
      const { href, title, target } = mark.attrs
      const attrs: Record<string, string> = { href, target, rel: 'noopener noreferrer nofollow' }
      if (title) attrs.title = title
      return ['a', attrs, 0]
    },
  } as MarkSpec,

  textColor: {
    attrs: { color: {} },
    parseDOM: [{
      style: 'color',
      getAttrs: (value: string) => {
        return value ? { color: value } : false
      },
    }],
    toDOM(mark: Mark) {
      const colorRegex = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[\s,\d.]*\)|hsla?\([^)]+\)|[a-zA-Z]+)$/
      const raw = String(mark.attrs.color).trim()
      const color = colorRegex.test(raw) ? raw : 'inherit'
      return ['span', { style: `color: ${color}` }, 0]
    },
  } as MarkSpec,

  highlight: {
    attrs: { color: {} },
    parseDOM: [{
      style: 'background-color',
      getAttrs: (value: string) => {
        return value ? { color: value } : false
      },
    }],
    toDOM(mark: Mark) {
      const colorRegex = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+[\s,\d.]*\)|hsla?\([^)]+\)|[a-zA-Z]+)$/
      const raw = String(mark.attrs.color).trim()
      const color = colorRegex.test(raw) ? raw : 'transparent'
      return ['span', { style: `background-color: ${color}` }, 0]
    },
  } as MarkSpec,
}
