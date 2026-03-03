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
 * When Word's AutoFormat converts *** / --- / ___ / === / ~~~ + Enter into a
 * paragraph border (dotted / solid / double line), mammoth outputs one of:
 *
 *   a) <p>***</p>          — if mammoth preserved the original text
 *   b) <p></p>             — if the border is on an empty paragraph
 *   c) <p class="..."></p> — with a style class that has a bottom border
 *
 * Strategy:
 *   1. Convert explicit separator tokens (*** etc.) inside <p> → <hr>
 *   2. Convert paragraphs whose sole inline style has a border-bottom → <hr>
 *   3. Do NOT blindly remove all empty <p> — they are valid spacing in Word
 *      documents. Only remove runs of 3+ consecutive empty paragraphs, which
 *      are almost certainly artefacts rather than content.
 */
function postProcess(html: string): string {
  let out = html

  // 1. Explicit separator token → <hr>
  //    Catches: <p>***</p>, <p>---</p>, <p>___</p>, <p>===</p>, <p>~~~</p>
  out = out.replace(
    /<p[^>]*>\s*(?:<br\s*\/?>)?\s*(\*{3,}|-{3,}|_{3,}|={3,}|~{3,})\s*(?:<br\s*\/?>)?\s*<\/p>/gi,
    '<hr />',
  )

  // 2. Paragraph with an inline border-bottom style (mammoth sometimes emits
  //    these for Word paragraph borders created via *** / --- AutoFormat)
  //    Only match empty-content paragraphs to avoid stripping real content
  out = out.replace(
    /<p([^>]*style="[^"]*border-bottom[^"]*"[^>]*)>\s*(?:<br\s*\/?>)?\s*<\/p>/gi,
    '<hr />',
  )

  // 3. Remove only RUNS of 3 or more consecutive empty paragraphs (artefacts),
  //    keeping 1–2 empties that the author may have intentionally left in.
  out = out.replace(/(<p[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>\s*){3,}/gi, '')

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

