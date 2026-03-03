<template>
  <div class="rte-toolbar" role="toolbar" aria-label="Formatting toolbar">

    <!-- Group 1: Inline formatting -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.bold }"
        :aria-pressed="activeState.bold"
        aria-label="Bold"
        title="Bold (Ctrl+B)"
        @click="commands.toggleBold()"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.italic }"
        :aria-pressed="activeState.italic"
        aria-label="Italic"
        title="Italic (Ctrl+I)"
        @click="commands.toggleItalic()"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.underline }"
        :aria-pressed="activeState.underline"
        aria-label="Underline"
        title="Underline (Ctrl+U)"
        @click="commands.toggleUnderline()"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.strike }"
        :aria-pressed="activeState.strike"
        aria-label="Strikethrough"
        title="Strikethrough (Ctrl+Shift+X)"
        @click="commands.toggleStrike()"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.code }"
        :aria-pressed="activeState.code"
        aria-label="Inline Code"
        title="Code (Ctrl+E)"
        @click="commands.toggleCode()"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.subscript }"
        :aria-pressed="activeState.subscript"
        aria-label="Subscript"
        title="Subscript"
        @click="commands.toggleSubscript()"
      >
        X₂
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.superscript }"
        :aria-pressed="activeState.superscript"
        aria-label="Superscript"
        title="Superscript"
        @click="commands.toggleSuperscript()"
      >
        X²
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Font Family + Font Size -->
    <div class="rte-toolbar__group">
      <select
        class="rte-toolbar__select"
        :value="activeState.fontFamily || ''"
        aria-label="Font Family"
        title="Font Family"
        @change="commands.setFontFamily(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Font</option>
        <option value="Inter">Inter</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Georgia">Georgia</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="Trebuchet MS">Trebuchet MS</option>
      </select>
      <select
        class="rte-toolbar__select rte-toolbar__select--size"
        :value="activeState.fontSize || ''"
        aria-label="Font Size"
        title="Font Size"
        @change="commands.setFontSize(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Size</option>
        <option value="8px">8</option>
        <option value="9px">9</option>
        <option value="10px">10</option>
        <option value="11px">11</option>
        <option value="12px">12</option>
        <option value="14px">14</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="20px">20</option>
        <option value="24px">24</option>
        <option value="28px">28</option>
        <option value="32px">32</option>
        <option value="36px">36</option>
        <option value="48px">48</option>
        <option value="72px">72</option>
      </select>
    </div>

    <!-- Row break -->
    <div class="rte-toolbar__break"></div>

    <!-- ═══ ROW 2 ═══ -->

    <!-- Group 2: Block type -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.heading1 }"
        :aria-pressed="activeState.heading1"
        aria-label="Heading 1"
        title="Heading 1"
        @click="commands.setHeading(1)"
      >
        H1
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.heading2 }"
        :aria-pressed="activeState.heading2"
        aria-label="Heading 2"
        title="Heading 2"
        @click="commands.setHeading(2)"
      >
        H2
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.heading3 }"
        :aria-pressed="activeState.heading3"
        aria-label="Heading 3"
        title="Heading 3"
        @click="commands.setHeading(3)"
      >
        H3
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Text Alignment -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': !activeState.textAlign || activeState.textAlign === 'left' }"
        :aria-pressed="!activeState.textAlign || activeState.textAlign === 'left'"
        aria-label="Align Left"
        title="Align Left"
        @click="commands.setTextAlign(null)"
      >
        ≡←
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'center' }"
        :aria-pressed="activeState.textAlign === 'center'"
        aria-label="Align Center"
        title="Align Center"
        @click="commands.setTextAlign('center')"
      >
        ≡↔
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'right' }"
        :aria-pressed="activeState.textAlign === 'right'"
        aria-label="Align Right"
        title="Align Right"
        @click="commands.setTextAlign('right')"
      >
        ≡→
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'justify' }"
        :aria-pressed="activeState.textAlign === 'justify'"
        aria-label="Justify"
        title="Justify"
        @click="commands.setTextAlign('justify')"
      >
        ≡≡
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group 3: Lists + Blockquote -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.bulletList }"
        :aria-pressed="activeState.bulletList"
        aria-label="Bullet List"
        title="Bullet List"
        @click="commands.toggleBulletList()"
      >
        •≡
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.orderedList }"
        :aria-pressed="activeState.orderedList"
        aria-label="Ordered List"
        title="Ordered List"
        @click="commands.toggleOrderedList()"
      >
        1.
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.blockquote }"
        :aria-pressed="activeState.blockquote"
        aria-label="Blockquote"
        title="Blockquote"
        @click="commands.toggleBlockquote()"
      >
        ❝
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group 4: Insert -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Insert Image"
        title="Insert Image"
        @click="imageInput?.click()"
      >
        🖼️
      </button>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onImageSelect"
      />
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Horizontal Rule"
        title="Horizontal Rule"
        @click="commands.insertHorizontalRule()"
      >
        ―
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :class="{ 'rte-toolbar__button--active': activeState.dragActive }"
        :aria-pressed="activeState.dragActive"
        aria-label="Drag Content"
        title="Drag Content (select text first)"
        @click="commands.toggleDrag()"
      >
        ✥
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Clear Formatting -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Clear Formatting"
        title="Clear Formatting"
        @click="commands.clearFormatting()"
      >
        T̶ₓ
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group 5: History -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        :disabled="!activeState.canUndo"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        @click="commands.undo()"
      >
        ↩
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :disabled="!activeState.canRedo"
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        @click="commands.redo()"
      >
        ↪
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EditorActiveState } from '../composables/useEditor'

defineProps<{
  /** Current active formatting state */
  activeState: EditorActiveState
  /** Command functions to call */
  commands: {
    toggleBold: () => void
    toggleItalic: () => void
    toggleUnderline: () => void
    toggleStrike: () => void
    toggleCode: () => void
    toggleSubscript: () => void
    toggleSuperscript: () => void
    setFontFamily: (family: string | null) => void
    setFontSize: (size: string | null) => void
    setHeading: (level: 1 | 2 | 3) => void
    setParagraph: () => void
    setTextAlign: (alignment: string | null) => void
    toggleBulletList: () => void
    toggleOrderedList: () => void
    toggleBlockquote: () => void
    insertHorizontalRule: () => void
    clearFormatting: () => void
    undo: () => void
    redo: () => void
    toggleDrag: () => void
  }
}>()

const emit = defineEmits<{
  'image-select': [file: File]
}>()

const imageInput = ref<HTMLInputElement | null>(null)

function onImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('image-select', file)
    input.value = '' // Reset so same file can be selected again
  }
}
</script>
