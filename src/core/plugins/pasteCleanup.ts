/**
 * pasteCleanup.ts (ProseMirror plugin)
 *
 * Intercepts paste events containing HTML from Word / Google Docs,
 * strips junk markup, then re-dispatches as clean HTML into the editor.
 */
import { Plugin } from 'prosemirror-state'
import { fromHTML } from '../serializers/html'
import { cleanPastedHTML } from '../utils/pasteCleanup'

export function createPasteCleanupPlugin(): Plugin {
  return new Plugin({
    props: {
      handlePaste(view, event) {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        const html = clipboardData.getData('text/html')

        // Only intercept if there is HTML content (plain text paste = let ProseMirror handle)
        if (!html) return false

        // Only clean if it looks like it came from Word or Google Docs
        const isWordPaste = /mso-|class="Mso|<o:|<w:/i.test(html)
        const isGDocsPaste = /docs-internal-guid|id="docs-internal/i.test(html)

        if (!isWordPaste && !isGDocsPaste) return false

        event.preventDefault()

        const clean = cleanPastedHTML(html)
        const doc = fromHTML(clean)

        const { state, dispatch } = view
        const tr = state.tr.replaceSelectionWith(doc, false)
        dispatch(tr.scrollIntoView())

        return true
      },
    },
  })
}

