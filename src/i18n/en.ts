export const en = {
  toolbar: {
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strike: 'Strikethrough',
    code: 'Inline Code',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    paragraph: 'Paragraph',
    bulletList: 'Bullet List',
    orderedList: 'Ordered List',
    blockquote: 'Blockquote',
    horizontalRule: 'Horizontal Rule',
    insertImage: 'Insert Image',
    subscript: 'Subscript',
    superscript: 'Superscript',
    fontFamily: 'Font Family',
    fontSize: 'Font Size',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    alignJustify: 'Justify',
    clearFormatting: 'Clear Formatting',
    undo: 'Undo',
    redo: 'Redo',
    link: 'Link',
    editLink: 'Edit Link',
    removeLink: 'Remove Link',
  },
  shortcuts: {
    bold: 'Ctrl+B',
    italic: 'Ctrl+I',
    underline: 'Ctrl+U',
    strike: 'Ctrl+Shift+X',
    code: 'Ctrl+E',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Shift+Z',
  },
  editor: {
    placeholder: 'Start typing...',
  },
  upload: {
    uploading: 'Uploading...',
    error: 'Upload failed',
    retry: 'Retry',
    remove: 'Remove',
    fileTooLarge: 'File exceeds maximum size of {maxSize}',
    invalidType: 'File type not allowed',
  },
  dialog: {
    cancel: 'Cancel',
    apply: 'Apply',
    close: 'Close',
  },
  link: {
    insertLink: 'Insert Link',
    editLink: 'Edit Link',
    url: 'URL',
    text: 'Text',
    openInNewTab: 'Open in new tab',
    remove: 'Remove Link',
  },
  comment: {
    addComment: 'Add Comment',
    comments: 'Comments',
    resolve: 'Resolve',
    delete: 'Delete',
    placeholder: 'Write a comment...',
  },
  export: {
    exportAs: 'Export as',
    word: 'Word (.docx)',
    pdf: 'PDF',
  },
  import: {
    importDocument: 'Import Document',
    importing: 'Importing...',
    error: 'Import failed',
  },
} as const

// Recursively widen literal string types to `string`
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

export type Messages = DeepStringify<typeof en>
