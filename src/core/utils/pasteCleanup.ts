/**
 * pasteCleanup.ts
 *
 * Strips Microsoft Word and Google Docs junk from pasted HTML before
 * it reaches ProseMirror's parser, producing clean, minimal markup.
 */

/**
 * Clean pasted HTML from Word / Google Docs.
 * Returns a sanitised HTML string safe to pass into fromHTML().
 */
export function cleanPastedHTML(html: string): string {
  // 1. Remove Word XML processing instructions and namespaced tags
  let clean = html
    .replace(/<\?xml[^>]*>/gi, '')
    .replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '')
    .replace(/<o:[^/][^>]*\/>/gi, '')
    .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '')
    .replace(/<w:[^/][^>]*\/>/gi, '')
    .replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '')

  // 2. Remove Word-specific conditional comments <!--[if ...]>...<![endif]-->
  clean = clean.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')

  // 3. Strip mso-* inline styles and class="Mso*" attributes
  clean = clean.replace(/\s?style="[^"]*mso-[^"]*"/gi, '')
  clean = clean.replace(/\s?class="Mso[^"]*"/gi, '')

  // 4. Remove all style attributes entirely (Word embeds huge inline styles)
  //    but preserve essential structural attributes (href, src, colspan, etc.)
  clean = clean.replace(/\s?style="[^"]*"/gi, '')

  // 5. Google Docs: remove internal ID and data-* clutter
  clean = clean.replace(/\s?id="docs-internal-[^"]*"/gi, '')
  clean = clean.replace(/\s?data-[a-z-]+="[^"]*"/gi, '')

  // 6. Remove empty class attributes left behind
  clean = clean.replace(/\s?class=""/gi, '')

  // 7. Collapse multiple blank lines / whitespace runs
  clean = clean.replace(/(\r?\n){3,}/g, '\n\n').trim()

  return clean
}

