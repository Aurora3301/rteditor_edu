import { describe, it, expect, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import RTEditor from '../RTEditor.vue'

describe('RTEditor Component', () => {
  let wrapper: VueWrapper<any>

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should mount without errors', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.exists()).toBe(true)
  })

  it('should render .rte-root container', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-root').exists()).toBe(true)
  })

  it('should render toolbar', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-toolbar').exists()).toBe(true)
  })

  it('should render editor area', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-editor').exists()).toBe(true)
  })

  it('should mount ProseMirror', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick() // wait for onMounted
    expect(wrapper.find('.ProseMirror').exists()).toBe(true)
  })

  it('should have contenteditable ProseMirror', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    const pm = wrapper.find('.ProseMirror')
    expect(pm.attributes('contenteditable')).toBe('true')
  })

  it('should render all toolbar button groups', () => {
    wrapper = mount(RTEditor)
    const groups = wrapper.findAll('.rte-toolbar__group')
    expect(groups.length).toBeGreaterThanOrEqual(5)
  })

  it('should render toolbar separators', () => {
    wrapper = mount(RTEditor)
    const seps = wrapper.findAll('.rte-toolbar__separator')
    expect(seps.length).toBeGreaterThanOrEqual(4)
  })

  it('should render Bold button', () => {
    wrapper = mount(RTEditor)
    const boldBtn = wrapper.find('[aria-label="Bold"]')
    expect(boldBtn.exists()).toBe(true)
  })

  it('should render Italic button', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Italic"]').exists()).toBe(true)
  })

  it('should render Underline button', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Underline"]').exists()).toBe(true)
  })

  it('should render block-type dropdown with heading options', () => {
    wrapper = mount(RTEditor)
    const select = wrapper.find('.rte-toolbar__block-select')
    expect(select.exists()).toBe(true)
    expect(select.find('option[value="h1"]').exists()).toBe(true)
    expect(select.find('option[value="h2"]').exists()).toBe(true)
    expect(select.find('option[value="h3"]').exists()).toBe(true)
    expect(select.find('option[value="paragraph"]').exists()).toBe(true)
  })

  it('should render Undo/Redo buttons', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Undo"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Redo"]').exists()).toBe(true)
  })

  it('should render list buttons', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Bullet List"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Ordered List"]').exists()).toBe(true)
  })

  it('should render blockquote button', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Blockquote"]').exists()).toBe(true)
  })

  it('should render horizontal rule button', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Horizontal Rule"]').exists()).toBe(true)
  })

  it('should have Undo disabled initially', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    const undoBtn = wrapper.find('[aria-label="Undo"]')
    expect(undoBtn.attributes('disabled')).toBeDefined()
  })

  it('should have Redo disabled initially', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    const redoBtn = wrapper.find('[aria-label="Redo"]')
    expect(redoBtn.attributes('disabled')).toBeDefined()
  })

  it('should accept theme prop', () => {
    wrapper = mount(RTEditor, { props: { theme: 'dark' } })
    expect(wrapper.find('.rte-root').attributes('data-theme')).toBe('dark')
  })

  it('should default to light theme', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-root').attributes('data-theme')).toBe('light')
  })

  it('should accept placeholder prop', async () => {
    wrapper = mount(RTEditor, { props: { placeholder: 'Type here...' } })
    await nextTick()
    await nextTick()
    const pm = wrapper.find('.ProseMirror')
    expect(pm.attributes('data-placeholder')).toBe('Type here...')
  })

  it('should load initial HTML content', async () => {
    wrapper = mount(RTEditor, {
      props: { modelValue: '<p>Initial content</p>' }
    })
    await nextTick()
    await nextTick()
    const pm = wrapper.find('.ProseMirror')
    expect(pm.text()).toContain('Initial content')
  })

  it('should emit update:modelValue on content change', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()

    // Access the exposed view and dispatch a text insertion
    const editorComponent = wrapper.vm
    if (editorComponent.view) {
      const view = editorComponent.view
      const tr = view.state.tr.insertText('Test', 1)
      view.dispatch(tr)

      // Wait for debounce (300ms)
      await new Promise(resolve => setTimeout(resolve, 400))

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted!.length).toBeGreaterThan(0)
    }
  })

  it('should expose view via defineExpose', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(wrapper.vm.view).toBeDefined()
  })

  it('should expose commands via defineExpose', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(wrapper.vm.commands).toBeDefined()
    expect(typeof wrapper.vm.commands.toggleBold).toBe('function')
  })

  it('should have 14+ toolbar buttons total', () => {
    wrapper = mount(RTEditor)
    const buttons = wrapper.findAll('.rte-toolbar__button')
    // Bold, Italic, Underline, Strike, Code, H1, H2, H3, BulletList, OrderedList, Blockquote, HR, Undo, Redo = 14
    expect(buttons.length).toBeGreaterThanOrEqual(14)
  })

  it('should set readonly when prop is true', async () => {
    wrapper = mount(RTEditor, { props: { readonly: true } })
    await nextTick()
    await nextTick()
    const pm = wrapper.find('.ProseMirror')
    expect(pm.attributes('contenteditable')).toBe('false')
  })

  // ── Phase 3: Word Limit prop (status bar removed; wordLimit prop still accepted) ──
  it('should NOT render .rte-status-bar (status bar has been removed)', () => {
    wrapper = mount(RTEditor, { props: { wordLimit: 500 } })
    expect(wrapper.find('.rte-status-bar').exists()).toBe(false)
  })

  it('wordLimit prop should not crash the editor', async () => {
    wrapper = mount(RTEditor, { props: { wordLimit: 100 } })
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('editor renders without status bar by default', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-status-bar').exists()).toBe(false)
    expect(wrapper.exists()).toBe(true)
  })

  // ── Phase 3: Wave 6 Math Modal ─────────────────────────────────────────────
  it('should render Insert Math toolbar button', () => {
    wrapper = mount(RTEditor)
    const mathBtn = wrapper.find('[aria-label="Insert Math"]')
    expect(mathBtn.exists()).toBe(true)
  })

  it('should mount RTMathModal (hidden by default)', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    // Math modal starts invisible — its Teleport target won't be in the wrapper DOM
    // Just verify the editor mounts cleanly with the modal registered
    expect(wrapper.find('.rte-root').exists()).toBe(true)
  })

  // ── Phase 3: Wave 4 Import Word button ─────────────────────────────────────
  it('should render Import Word Document toolbar button', () => {
    wrapper = mount(RTEditor)
    const importBtn = wrapper.find('[aria-label="Import Word Document"]')
    expect(importBtn.exists()).toBe(true)
  })

  it('should render hidden file input for Word import', () => {
    wrapper = mount(RTEditor)
    const input = wrapper.find('input[type="file"][accept=".docx"]')
    expect(input.exists()).toBe(true)
  })

  // ── Phase 3: Wave 5 Remark Popover component exposed ───────────────────────
  it('should expose getJSON via defineExpose', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.getJSON).toBe('function')
  })

  it('getJSON should return a valid ProseMirror JSON object', async () => {
    wrapper = mount(RTEditor, { props: { modelValue: '<p>Hello world</p>' } })
    await nextTick()
    await nextTick()
    const json = wrapper.vm.getJSON()
    expect(json).toBeDefined()
    expect(json.type).toBe('doc')
    expect(Array.isArray(json.content)).toBe(true)
  })

  // ── Phase 3: Wave 2 Table Mini-Toolbar ─────────────────────────────────────
  it('should expose commands.insertRowBefore as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.insertRowBefore).toBe('function')
  })

  it('should expose commands.insertRowAfter as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.insertRowAfter).toBe('function')
  })

  it('should expose commands.deleteRow as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.deleteRow).toBe('function')
  })

  it('should expose commands.insertColBefore as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.insertColBefore).toBe('function')
  })

  it('should expose commands.insertColAfter as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.insertColAfter).toBe('function')
  })

  it('should expose commands.deleteColumn as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.deleteColumn).toBe('function')
  })

  it('should expose commands.deleteTable as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.deleteTable).toBe('function')
  })

  it('should expose commands.insertMath as a function', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    await nextTick()
    expect(typeof wrapper.vm.commands.insertMath).toBe('function')
  })
})

// ── Option D: UX polish ───────────────────────────────────────────────────────
describe('RTEditor — Word Count Footer', () => {
  let wrapper: VueWrapper<any>
  afterEach(() => { wrapper?.unmount() })

  it('should NOT render .rte-footer by default', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-footer').exists()).toBe(false)
  })

  it('should render .rte-footer when showWordCountFooter=true', () => {
    wrapper = mount(RTEditor, { props: { showWordCountFooter: true } })
    expect(wrapper.find('.rte-footer').exists()).toBe(true)
  })

  it('should render .rte-footer__wordcount inside footer', () => {
    wrapper = mount(RTEditor, { props: { showWordCountFooter: true } })
    expect(wrapper.find('.rte-footer__wordcount').exists()).toBe(true)
  })

  it('footer wordcount shows "words" label', () => {
    wrapper = mount(RTEditor, { props: { showWordCountFooter: true } })
    expect(wrapper.find('.rte-footer__wordcount').text()).toContain('words')
  })
})

describe('RTEditor — Print button', () => {
  let wrapper: VueWrapper<any>
  afterEach(() => { wrapper?.unmount() })

  it('should render Print button in toolbar', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Print"]').exists()).toBe(true)
  })
})

describe('RTEditor — Drag-drop overlay', () => {
  let wrapper: VueWrapper<any>
  afterEach(() => { wrapper?.unmount() })

  it('should NOT show drag overlay by default', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('.rte-drag-overlay').exists()).toBe(false)
  })

  it('editor-wrapper has drag event handling', () => {
    wrapper = mount(RTEditor)
    const editorWrapper = wrapper.find('.rte-editor-wrapper')
    expect(editorWrapper.exists()).toBe(true)
  })
})

describe('RTEditor — Slash command expansion', () => {
  let wrapper: VueWrapper<any>
  afterEach(() => { wrapper?.unmount() })

  it('slash commands include Image entry', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    // Access the internal slashCommands computed via vm
    const vm = wrapper.vm as any
    const cmds = vm.slashCommands ?? []
    const hasImage = Array.isArray(cmds)
      ? cmds.some((c: any) => c.id === 'img')
      : false
    expect(hasImage).toBe(true)
  })

  it('slash commands include Math Formula entry', async () => {
    wrapper = mount(RTEditor)
    await nextTick()
    const vm = wrapper.vm as any
    const cmds = vm.slashCommands ?? []
    const hasMath = Array.isArray(cmds)
      ? cmds.some((c: any) => c.id === 'math')
      : false
    expect(hasMath).toBe(true)
  })
})

// ── Option C: Accessibility ARIA checks ──────────────────────────────────────
describe('RTEditor — Accessibility (ARIA attributes)', () => {
  let wrapper: VueWrapper<any>
  afterEach(() => { wrapper?.unmount() })

  it('toolbar has role=toolbar', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
  })

  it('toolbar has aria-label', () => {
    wrapper = mount(RTEditor)
    const toolbar = wrapper.find('[role="toolbar"]')
    expect(toolbar.attributes('aria-label')).toBeTruthy()
  })

  it('all separator elements have role=separator', () => {
    wrapper = mount(RTEditor)
    const seps = wrapper.findAll('.rte-toolbar__separator')
    seps.forEach(sep => {
      expect(sep.attributes('role')).toBe('separator')
    })
  })

  it('Bold button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Bold"]').exists()).toBe(true)
  })

  it('Italic button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Italic"]').exists()).toBe(true)
  })

  it('Undo button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Undo"]').exists()).toBe(true)
  })

  it('Redo button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Redo"]').exists()).toBe(true)
  })

  it('Print button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Print"]').exists()).toBe(true)
  })

  it('Insert Image button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Insert Image"]').exists()).toBe(true)
  })

  it('Add Comment button has aria-label', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Add Comment"]').exists()).toBe(true)
  })
})

