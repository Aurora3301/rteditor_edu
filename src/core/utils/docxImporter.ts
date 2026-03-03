/**
 * docxImporter.ts
 * Converts a .docx File to a ProseMirror document using mammoth.js.
 *
 * Fixes applied over vanilla mammoth output:
 *  - Paragraph-border separators (*** / --- / ___ / ===) → <hr>
 *  - Word "Horizontal Line" paragraph style → <hr>
 *  - Subscript/superscript runs preserved
 *  - Empty paragraphs collapsed
 *  - DOMPurify whitelist sanitization (XSS prevention)
 */
import mammoth from 'mammoth'
import DOMPurify from 'dompurify'
import { fromHTML } from '../serializers/html'
import type { Node as ProseMirrorNode } from 'prosemirror-model'

// ── Mammoth style map ─────────────────────────────────────────────────────────
// Maps named Word paragraph/run styles that mammoth doesn't handle by default.
const STYLE_MAP = [
  // Word "Horizontal Line" autocorrect style (*** / --- / ___ + Enter)
  "p[style-name='Horizontal Line'] => hr:fresh",
  // Common heading aliases used in some Word templates
  "p[style-name='heading 1'] => h1:fresh",
  "p[style-name='heading 2'] => h2:fresh",
  "p[style-name='heading 3'] => h3:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  // Subtitle
  "p[style-name='Subtitle'] => p:fresh",
  // Code / preformatted
  "p[style-name='Code'] => pre > code:fresh",
  // Superscript / subscript run styles
  "r[style-name='Superscript'] => sup",
  "r[style-name='Subscript']   => sub",
]

// ── DOMPurify allowlist ───────────────────────────────────────────────────────
const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'sub', 'sup',
  'a', 'ul', 'ol', 'li', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'br', 'hr', 'span', 'pre', 'code',
]
const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'title', 'width', 'height',
  'colspan', 'rowspan',
  'start', 'type',
]

// ── Post-processing: catch separator patterns mammoth misses ──────────────────
/**
 * Mammoth sometimes cannot map Word paragraph-border separators to <hr> even
 * with a style map, because those borders live in paragraph XML (<w:pBdr>),
 * not in a named style. We catch the most common patterns here.
 *
 * Patterns that Word's AutoFormat converts to a border:
 *   ***   → triple wavy line
 *   ---   → single line
 *   ___   → single line
 *   ===   → double line
 *   ~~~   → wavy line
 */
function postProcess(html: string): string {
  // Replace paragraphs whose only content is a separator token with <hr>
  // Handles: <p>***</p>, <p>---</p>, <p>___</p>, <p>===</p>, <p>~~~</p>
  // and variants with leading/trailing spaces or <br>
  let out = html.replace(
    /<p[^>]*>\s*(?:<br\s*\/?>)?\s*(\*{3,}|-{3,}|_{3,}|={3,}|~{3,})\s*(?:<br\s*\/?>)?\s*<\/p>/gi,
    '<hr />'
  )

  // Also collapse completely empty paragraphs that carry no semantic meaning
  // (Word often emits these between sections)
  out = out.replace(/<p[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>/gi, '')

  return out
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function importDocx(file: File): Promise<ProseMirrorNode> {
  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await file.arrayBuffer()
  } catch (err) {
    throw new Error(`Failed to read file: ${(err as Error).message}`)
  }

  let result: Awaited<ReturnType<typeof mammoth.convertToHtml>>
  try {
    result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: STYLE_MAP,
        includeDefaultStyleMap: true,
      }
    )
  } catch (err) {
    throw new Error(`Invalid or unsupported DOCX file: ${(err as Error).message}`)
  }

  // 1. Post-process mammoth output (separator → <hr>, empty <p> collapse)
  const processed = postProcess(result.value)

  // 2. Sanitize with DOMPurify to prevent XSS from malicious DOCX payloads
  const clean = DOMPurify.sanitize(processed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })

  return fromHTML(clean)
}

