/**
 * docxImporter.ts – from-scratch DOCX → ProseMirror, zero extra packages.
 *
 * Supported Word formats
 *   Block  : headings H1–H3, paragraphs, bullet/ordered lists, tables,
 *             blockquote, horizontal-rule (paragraph border OR *** / ---)
 *   Inline : bold, italic, underline, strikethrough, sub, super, hyperlinks,
 *             font family, font size, text colour, text alignment
 *   Media  : inline images (PNG / JPEG / GIF / WEBP) embedded as base64
 *
 * Pipeline
 *   1. Unzip   – native DecompressionStream('deflate-raw'), no JSZip
 *   2. XML     – native DOMParser('text/xml'), no xmldom
 *   3. Maps    – style / numbering / relationship / media
 *   4. Walk    – traverse <w:body> and emit HTML
 *   5. Sanitize – DOMPurify (already a dev-dep)
 *   6. Parse   – fromHTML() → ProseMirrorNode (reuses existing serializer)
 */
import DOMPurify from 'dompurify'
import { fromHTML } from '../serializers/html'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

// ─── OOXML namespaces ─────────────────────────────────────────────────────────
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main'

// ─── ZIP reader ───────────────────────────────────────────────────────────────
/** Decompress a raw-deflate stream using the browser's built-in API. */
async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds     = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  const reader = ds.readable.getReader()
  // Cast needed: Uint8Array<ArrayBufferLike> → Uint8Array<ArrayBuffer> for strict TS
  writer.write(data as Uint8Array<ArrayBuffer>)
  writer.close()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  let len = 0
  for (const c of chunks) len += c.length
  const out = new Uint8Array(len)
  let off = 0
  for (const c of chunks) { out.set(c, off); off += c.length }
  return out
}

/**
 * Minimal ZIP parser.
 * Reads the central directory then extracts every file entry.
 * Returns map of filename → raw bytes.
 */
async function readZip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view  = new DataView(buf)
  const bytes = new Uint8Array(buf)
  const files = new Map<string, Uint8Array>()
  const dec   = new TextDecoder()

  // Locate End-of-Central-Directory (EOCD) signature 0x06054b50
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd === -1) throw new Error('Not a valid ZIP / DOCX file')

  const cdOffset = view.getUint32(eocd + 16, true)
  const cdSize   = view.getUint32(eocd + 12, true)

  let pos = cdOffset
  while (pos < cdOffset + cdSize) {
    if (view.getUint32(pos, true) !== 0x02014b50) break  // central-dir signature

    const compression = view.getUint16(pos + 10, true)
    const compSz      = view.getUint32(pos + 20, true)
    const fnLen       = view.getUint16(pos + 28, true)
    const extraLen    = view.getUint16(pos + 30, true)
    const commentLen  = view.getUint16(pos + 32, true)
    const localOff    = view.getUint32(pos + 42, true)
    const name        = dec.decode(bytes.slice(pos + 46, pos + 46 + fnLen))

    // Skip to file data inside the local file header
    const localFnLen    = view.getUint16(localOff + 26, true)
    const localExtraLen = view.getUint16(localOff + 28, true)
    const dataStart     = localOff + 30 + localFnLen + localExtraLen
    const compressed    = bytes.slice(dataStart, dataStart + compSz)

    if (compression === 0) {
      files.set(name, compressed)               // stored – no compression
    } else if (compression === 8) {
      files.set(name, await inflate(compressed)) // deflate
    }
    // unknown compression methods are silently skipped
    pos += 46 + fnLen + extraLen + commentLen
  }
  return files
}

// ─── XML helpers ──────────────────────────────────────────────────────────────
/** Get the w:val (or any other w: attribute) from an element. */
const wVal = (el: Element | null | undefined, attr = 'val'): string =>
  el?.getAttributeNS(W, attr) ?? el?.getAttribute(`w:${attr}`) ?? ''

/** First child element with the given Word local-name. */
const wEl = (parent: Element | null | undefined, name: string): Element | null =>
  parent?.getElementsByTagNameNS(W, name)[0] ?? null

/** All descendant elements with the given Word local-name. */
const wEls = (parent: Element | Document | null | undefined, name: string): Element[] =>
  parent ? Array.from((parent as Element).getElementsByTagNameNS(W, name)) : []

// ─── Style map ────────────────────────────────────────────────────────────────
/**
 * Maps Word styleId → HTML tag name.
 * Covers H1–H3, blockquote, horizontal-rule, and everything else → 'p'.
 */
function buildStyleMap(stylesXml: Document | null): Map<string, string> {
  const map = new Map<string, string>()
  if (!stylesXml) return map
  for (const style of wEls(stylesXml, 'style')) {
    const id   = wVal(style, 'styleId')
    const name = (wVal(wEl(style, 'name')) ?? '').toLowerCase()
    if      (name.startsWith('heading 1') || name === 'heading1') map.set(id, 'h1')
    else if (name.startsWith('heading 2') || name === 'heading2') map.set(id, 'h2')
    else if (name.startsWith('heading 3') || name === 'heading3') map.set(id, 'h3')
    else if (name.includes('quote') || name.includes('block text')) map.set(id, 'blockquote')
    else if (name === 'horizontal line') map.set(id, 'hr')
    else map.set(id, 'p')
  }
  return map
}


// ─── Numbering map ────────────────────────────────────────────────────────────
type ListInfo = { type: 'ul' | 'ol'; level: number }

/**
 * Maps "numId:ilvl" → { type: 'ul'|'ol', level }.
 * Resolves the abstractNum indirection used by OOXML numbering.
 */
function buildNumberingMap(numXml: Document | null): Map<string, ListInfo> {
  const map = new Map<string, ListInfo>()
  if (!numXml) return map

  // abstractNum: abstractNumId → Map<ilvl, numFmt>
  const abstract = new Map<string, Map<number, string>>()
  for (const abs of wEls(numXml, 'abstractNum')) {
    const aid  = wVal(abs, 'abstractNumId')
    const lvls = new Map<number, string>()
    for (const lvl of wEls(abs, 'lvl')) {
      const ilvl = parseInt(wVal(lvl, 'ilvl') || '0')
      lvls.set(ilvl, wVal(wEl(lvl, 'numFmt')) || 'bullet')
    }
    abstract.set(aid, lvls)
  }

  const ORDERED = new Set(['decimal','lowerLetter','upperLetter','lowerRoman','upperRoman'])
  for (const num of wEls(numXml, 'num')) {
    const numId = wVal(num, 'numId')
    const aid   = wVal(wEl(num, 'abstractNumId'))
    const lvls  = abstract.get(aid)
    if (!lvls) continue
    for (const [ilvl, fmt] of lvls) {
      map.set(`${numId}:${ilvl}`, { type: ORDERED.has(fmt) ? 'ol' : 'ul', level: ilvl })
    }
  }
  return map
}

// ─── Relationship map ─────────────────────────────────────────────────────────
/** Maps relationship Id → resolved file path inside the ZIP. */
function buildRelMap(relsXml: Document | null): Map<string, string> {
  const map = new Map<string, string>()
  if (!relsXml) return map
  for (const rel of Array.from(relsXml.getElementsByTagName('Relationship'))) {
    const id  = rel.getAttribute('Id')     ?? ''
    const tgt = rel.getAttribute('Target') ?? ''
    if (!id) continue
    // Normalise: absolute (/word/media/x) or relative (../media/x) → word/media/x
    const path = tgt.startsWith('/')
      ? tgt.slice(1)
      : tgt.startsWith('..')
        ? `word/${tgt.replace(/^\.\.\//, '')}`
        : `word/${tgt}`
    map.set(id, path)
  }
  return map
}

// ─── Media map ────────────────────────────────────────────────────────────────
/** Converts every word/media/* file in the ZIP to a base64 data-URL. */
async function buildMediaMap(files: Map<string, Uint8Array>): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const [path, data] of files) {
    if (!path.startsWith('word/media/')) continue
    const ext  = path.split('.').pop()?.toLowerCase() ?? ''
    const mime = ext === 'png'                  ? 'image/png'
      : ext === 'jpg' || ext === 'jpeg'         ? 'image/jpeg'
      : ext === 'gif'                           ? 'image/gif'
      : ext === 'webp'                          ? 'image/webp'
      : ext === 'svg'                           ? 'image/svg+xml'
      : 'image/png'
    // Convert binary to base64 safely for large arrays
    let binary = ''
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
    map.set(path, `data:${mime};base64,${btoa(binary)}`)
  }
  return map
}

// ─── HTML escaping ────────────────────────────────────────────────────────────
const esc     = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const escAttr = (s: string) => esc(s).replace(/"/g,'&quot;')

// ─── Drawing → <img> ─────────────────────────────────────────────────────────
function convertDrawing(
  el: Element,
  relMap: Map<string, string>,
  mediaMap: Map<string, string>,
): string {
  // Locate the a:blip element that carries the image relationship id
  for (const blip of Array.from(el.getElementsByTagNameNS(A, 'blip'))) {
    const rId    = blip.getAttributeNS(R, 'embed') ?? blip.getAttribute('r:embed') ?? ''
    const path   = rId ? relMap.get(rId) : undefined
    const dataUrl = path ? mediaMap.get(path) : undefined
    if (dataUrl) return `<img src="${escAttr(dataUrl)}" />`
  }
  return ''
}

// ─── Run → inline HTML ────────────────────────────────────────────────────────
function convertRun(r: Element): string {
  if (wEl(r, 'br')) return '<br />'
  const t = wEl(r, 't')
  if (!t) return ''
  const raw = t.textContent ?? ''
  if (!raw) return ''

  const rPr = wEl(r, 'rPr')
  const styles: string[] = []
  let bold = false, italic = false, under = false, strike = false, sub = false, sup = false

  if (rPr) {
    // Marks – Word can set w:val="false" to explicitly disable a toggle
    const bEl = wEl(rPr, 'b');   bold   = !!bEl  && wVal(bEl)  !== 'false' && wVal(bEl)  !== '0'
    const iEl = wEl(rPr, 'i');   italic = !!iEl  && wVal(iEl)  !== 'false' && wVal(iEl)  !== '0'
    const uEl = wEl(rPr, 'u');   under  = !!uEl  && wVal(uEl)  !== 'none'  && wVal(uEl)  !== ''
    const sEl = wEl(rPr, 'strike') ?? wEl(rPr, 'dstrike')
    strike = !!sEl && wVal(sEl) !== 'false'

    const va = wVal(wEl(rPr, 'vertAlign'))
    sub = va === 'subscript'
    sup = va === 'superscript'

    // Text colour – skip auto and plain black
    const colorVal = wVal(wEl(rPr, 'color'))
    if (colorVal && colorVal !== 'auto' && colorVal.toLowerCase() !== '000000')
      styles.push(`color:#${colorVal}`)

    // Font size stored in half-points (28 half-pts = 14 pt)
    const szVal = parseInt(wVal(wEl(rPr, 'sz')) || '0')
    if (szVal > 0) styles.push(`font-size:${szVal / 2}pt`)

    // Font family – prefer ASCII face, fall back to hAnsi / cs
    const fonts = wEl(rPr, 'rFonts')
    if (fonts) {
      const font = wVal(fonts, 'ascii') || wVal(fonts, 'hAnsi') || wVal(fonts, 'cs')
      if (font) styles.push(`font-family:${font}`)
    }
  }

  let html = esc(raw)
  if (styles.length) html = `<span style="${styles.join(';')}">${html}</span>`
  if (sub)    html = `<sub>${html}</sub>`
  if (sup)    html = `<sup>${html}</sup>`
  if (strike) html = `<s>${html}</s>`
  if (under)  html = `<u>${html}</u>`
  if (italic) html = `<em>${html}</em>`
  if (bold)   html = `<strong>${html}</strong>`
  return html
}

// ─── Runs collector (handles hyperlinks, drawings, track-changes) ─────────────
function collectRuns(
  parent: Element,
  relMap: Map<string, string>,
  mediaMap: Map<string, string>,
): string {
  const parts: string[] = []
  for (const child of Array.from(parent.childNodes)) {
    if (!(child instanceof Element)) continue
    const n = child.localName
    if (n === 'r') {
      // Image runs: <w:r><w:drawing> or <w:r><w:pict> — must be handled before text-run path
      const drawing = wEl(child, 'drawing') ?? wEl(child, 'pict')
      if (drawing) {
        parts.push(convertDrawing(drawing, relMap, mediaMap))
      } else {
        parts.push(convertRun(child))
      }
    } else if (n === 'hyperlink') {
      const rId   = child.getAttributeNS(R, 'id') ?? child.getAttribute('r:id') ?? ''
      const href  = relMap.get(rId) ?? ''
      const inner = collectRuns(child, relMap, mediaMap)
      parts.push(href
        ? `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : inner)
    } else if (n === 'drawing' || n === 'pict') {
      parts.push(convertDrawing(child, relMap, mediaMap))
    } else if (n === 'ins') {
      // Track-changes: include inserted text, discard deleted runs
      parts.push(collectRuns(child, relMap, mediaMap))
    }
    // bookmarkStart, bookmarkEnd, proofErr, del → silently skip
  }
  return parts.join('')
}


// ─── Table ────────────────────────────────────────────────────────────────────
function convertTable(
  tbl: Element,
  styleMap: Map<string, string>,
  numMap: Map<string, ListInfo>,
  relMap: Map<string, string>,
  mediaMap: Map<string, string>,
): string {
  const rows: string[] = []
  for (const child of Array.from(tbl.childNodes)) {
    if (!(child instanceof Element) || child.localName !== 'tr') continue
    const cells: string[] = []
    for (const tc of Array.from(child.childNodes)) {
      if (!(tc instanceof Element) || tc.localName !== 'tc') continue
      // Each table cell may contain multiple paragraphs
      const inner = wEls(tc, 'p')
        .map(p => convertParagraph(p, styleMap, numMap, relMap, mediaMap))
        .join('')
      cells.push(`<td>${inner}</td>`)
    }
    rows.push(`<tr>${cells.join('')}</tr>`)
  }
  return `<table><tbody>${rows.join('')}</tbody></table>`
}

// ─── Paragraph ────────────────────────────────────────────────────────────────
/**
 * Converts a <w:p> element.
 * List paragraphs are returned with a __LIST__… sentinel so the body walker
 * can group them into proper <ul>/<ol> trees.
 */
function convertParagraph(
  p: Element,
  styleMap: Map<string, string>,
  numMap: Map<string, ListInfo>,
  relMap: Map<string, string>,
  mediaMap: Map<string, string>,
): string {
  const pPr    = wEl(p, 'pPr')
  const pStyle = wVal(wEl(pPr, 'pStyle'))

  // ── Horizontal rule via paragraph border ─────────────────────────────────
  // Only an EMPTY paragraph with a bottom border is a divider.
  // Word commonly applies decorative bottom borders to paragraphs that still
  // contain text (e.g. underline-style headings) — those must NOT become <hr>.
  const hasText = wEls(p, 't').some(t => (t.textContent ?? '').trim() !== '')
  if (!hasText) {
    const pBdr = wEl(pPr, 'pBdr')
    if (pBdr) {
      const btm = wEl(pBdr, 'bottom')
      if (btm && wVal(btm) !== 'none') return '<hr />'
    }
  }
  // Horizontal rule via explicit Word style
  if (styleMap.get(pStyle) === 'hr') return '<hr />'

  // ── List paragraph ────────────────────────────────────────────────────────
  const numPr = wEl(pPr, 'numPr')
  const numId = wVal(wEl(numPr, 'numId'))
  const ilvl  = parseInt(wVal(wEl(numPr, 'ilvl')) || '0')
  if (numId && numId !== '0') {
    const info    = numMap.get(`${numId}:${ilvl}`) ?? { type: 'ul' as const, level: ilvl }
    const content = collectRuns(p, relMap, mediaMap)
    // Sentinel format consumed by convertBody's list-grouping pass
    return `__LIST__${info.type}__${info.level}__${content}__ENDLIST__`
  }

  // ── Block tag + alignment ─────────────────────────────────────────────────
  const tag = styleMap.get(pStyle) || 'p'

  const jcVal = wVal(wEl(pPr, 'jc'))
  const align = jcVal === 'center' ? 'center'
    : jcVal === 'right'            ? 'right'
    : jcVal === 'both'             ? 'justify'
    : ''
  const styleAttr = align ? ` style="text-align:${align}"` : ''

  const content = collectRuns(p, relMap, mediaMap)

  // Separator token (*** / --- / ___ / === / ~~~) typed directly in Word
  if (/^(\*{3,}|-{3,}|_{3,}|={3,}|~{3,})$/.test(content.replace(/<[^>]*>/g, '').trim()))
    return '<hr />'

  if (tag === 'blockquote') return `<blockquote><p${styleAttr}>${content}</p></blockquote>`
  return `<${tag}${styleAttr}>${content}</${tag}>`
}

// ─── Document body walker ─────────────────────────────────────────────────────
/**
 * Walks <w:body>, converts each child, then groups consecutive list-sentinel
 * strings into properly nested <ul>/<ol> trees.
 */
function convertBody(
  docXml: Document,
  styleMap: Map<string, string>,
  numMap: Map<string, ListInfo>,
  relMap: Map<string, string>,
  mediaMap: Map<string, string>,
): string {
  const body = docXml.getElementsByTagNameNS(W, 'body')[0]
  if (!body) return ''

  // First pass: collect raw paragraph/table strings
  const raw: string[] = []
  for (const child of Array.from(body.childNodes)) {
    if (!(child instanceof Element)) continue
    if (child.localName === 'p')   raw.push(convertParagraph(child, styleMap, numMap, relMap, mediaMap))
    if (child.localName === 'tbl') raw.push(convertTable(child, styleMap, numMap, relMap, mediaMap))
    // sectPr (page setup) and other structural nodes are skipped
  }

  // Second pass: resolve __LIST__… sentinels into <ul>/<ol><li> nesting
  const LIST_RE = /^__LIST__(ul|ol)__(\d+)__(.*)__ENDLIST__$/s
  type Frame = { tag: 'ul' | 'ol'; level: number }
  const html: string[] = []
  const stack: Frame[] = []

  const closeDownTo = (targetLevel: number) => {
    while (stack.length > 0 && stack[stack.length - 1].level > targetLevel)
      html.push(`</${stack.pop()!.tag}>`)
  }
  const closeAll = () => { while (stack.length) html.push(`</${stack.pop()!.tag}>`) }

  for (const part of raw) {
    const m = LIST_RE.exec(part)
    if (m) {
      const type  = m[1] as 'ul' | 'ol'
      const level = parseInt(m[2])
      const inner = m[3]

      // Close any lists that are deeper than the current item's level
      closeDownTo(level - 1)

      // Open a new list if the stack is empty, shallower, or wrong type
      const top = stack[stack.length - 1]
      if (!top || top.level < level) {
        html.push(`<${type}>`)
        stack.push({ tag: type, level })
      }
      html.push(`<li>${inner}</li>`)
    } else {
      closeAll()
      html.push(part)
    }
  }
  closeAll()
  return html.join('')
}

// ─── DOMPurify config ─────────────────────────────────────────────────────────
const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3',
  'strong', 'em', 'u', 's', 'sub', 'sup',
  'a', 'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'br', 'hr', 'span',
]
const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'title', 'width', 'height',
  'colspan', 'rowspan', 'start', 'type',
  'style',  // ← required for font / colour / size / alignment
]
// DOMPurify will strip any CSS property not in this list (XSS prevention)
const ALLOWED_CSS = ['color', 'background-color', 'font-size', 'font-family', 'text-align']

// ─── Main export ──────────────────────────────────────────────────────────────
export async function importDocx(file: File): Promise<ProseMirrorNode> {
  // 1. Read the file as an ArrayBuffer
  let buf: ArrayBuffer
  try { buf = await file.arrayBuffer() }
  catch (e) { throw new Error(`Failed to read file: ${(e as Error).message}`) }

  // 2. Unzip – native DecompressionStream, no JSZip
  let files: Map<string, Uint8Array>
  try { files = await readZip(buf) }
  catch (e) { throw new Error(`Not a valid DOCX file: ${(e as Error).message}`) }

  const getXml = (name: string): Document | null => {
    const data = files.get(name)
    if (!data) return null
    return new DOMParser().parseFromString(new TextDecoder().decode(data), 'text/xml')
  }

  // 3. Parse the four XML components we need
  const docXml = getXml('word/document.xml')
  if (!docXml) throw new Error('word/document.xml not found – is this a valid DOCX?')

  const stylesXml = getXml('word/styles.xml')
  const numXml    = getXml('word/numbering.xml')
  const relsXml   = getXml('word/_rels/document.xml.rels')

  // 4. Build lookup maps
  const styleMap = buildStyleMap(stylesXml)
  const numMap   = buildNumberingMap(numXml)
  const relMap   = buildRelMap(relsXml)
  const mediaMap = await buildMediaMap(files)

  // 5. Walk document.xml and emit HTML
  const raw = convertBody(docXml, styleMap, numMap, relMap, mediaMap)

  // 6. Sanitize – allow inline styles but restrict to safe CSS properties
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // @ts-expect-error – ALLOWED_CSS_PROPERTIES not yet in @types/dompurify
    ALLOWED_CSS_PROPERTIES: ALLOWED_CSS,
  })

  // 7. Parse HTML → ProseMirror document
  return fromHTML(clean)
}
