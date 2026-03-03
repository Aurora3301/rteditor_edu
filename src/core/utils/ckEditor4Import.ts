/**
 * Convert CKEditor 4 HTML output to rteditor-compatible HTML.
 * Strips CKEditor-specific classes, data attributes, and normalises formatting tags.
 */
export function importFromCKEditor4(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  cleanNode(doc.body)

  return doc.body.innerHTML
}

function cleanNode(node: Element | ChildNode): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element

    // Remove all data-cke-* and class="cke_*" attributes
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-cke') || attr.name === 'contenteditable') {
        el.removeAttribute(attr.name)
      }
    })

    // Strip cke_ classes, keep others
    if (el.className) {
      const cleaned = Array.from(el.classList)
        .filter(c => !c.startsWith('cke_') && !c.startsWith('cke-'))
        .join(' ')
      if (cleaned) el.className = cleaned
      else el.removeAttribute('class')
    }

    // Normalise tags
    const tag = el.tagName.toLowerCase()

    // <b> → <strong>
    if (tag === 'b') {
      replaceTag(el, 'strong')
      return
    }
    // <i> → <em>
    if (tag === 'i') {
      replaceTag(el, 'em')
      return
    }
    // <strike> or <del> → <s>
    if (tag === 'strike' || tag === 'del') {
      replaceTag(el, 's')
      return
    }

    // Remove empty spans injected by CKEditor
    if (tag === 'span' && !el.attributes.length && el.childNodes.length > 0) {
      const parent = el.parentNode!
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      return
    }

    // Recurse into children
    Array.from(el.childNodes).forEach(child => cleanNode(child))
  }
}

function replaceTag(el: Element, newTag: string): void {
  const newEl = document.createElement(newTag)
  Array.from(el.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value))
  while (el.firstChild) newEl.appendChild(el.firstChild)
  el.parentNode!.replaceChild(newEl, el)
  // Recurse into new element children
  Array.from(newEl.childNodes).forEach(child => cleanNode(child))
}

