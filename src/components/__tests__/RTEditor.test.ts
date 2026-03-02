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

  it('should render Heading buttons', () => {
    wrapper = mount(RTEditor)
    expect(wrapper.find('[aria-label="Heading 1"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Heading 2"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Heading 3"]').exists()).toBe(true)
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
})

