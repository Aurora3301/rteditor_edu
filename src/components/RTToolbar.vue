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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h8a4 4 0 0 1 0 8H6V4zm0 8h9a4 4 0 0 1 0 8H6v-8z"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 20H9.5a3.5 3.5 0 0 1 0-7h5"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
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
        X<sub style="font-size:9px">2</sub>
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
        X<sup style="font-size:9px">2</sup>
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

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Text Color + Highlight -->
    <div class="rte-toolbar__group">
      <!-- Text Color trigger -->
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Text Color"
        title="Text Color"
        @click="openTextColorPicker"
      >
        <span style="display:flex;flex-direction:column;align-items:center;gap:1px">
          <strong style="font-size:13px;line-height:1">A</strong>
          <span :style="activeTextColor ? `background:${activeTextColor}` : 'background:currentColor'" style="width:14px;height:3px;border-radius:1px;display:block"></span>
        </span>
      </button>

      <!-- Highlight Color trigger -->
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Highlight Color"
        title="Highlight Color"
        @click="openHighlightPicker"
      >
        <span style="display:flex;flex-direction:column;align-items:center;gap:1px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l-6 6v3h3l6-6"/><path d="M22 5.5a2.121 2.121 0 0 0-3-3l-6.5 6.5 3 3L22 5.5z"/></svg>
          <span :style="activeHighlight ? `background:${activeHighlight}` : 'background:#ffff00'" style="width:14px;height:3px;border-radius:1px;display:block"></span>
        </span>
      </button>
    </div>

    <!-- Text Color — centered modal (same pattern as Math Formula) -->
    <Teleport to="body">
      <div
        v-if="showTextColorPicker"
        class="rte-dialog-overlay"
        role="presentation"
        @mousedown.self="showTextColorPicker = false"
        @keydown.esc="showTextColorPicker = false"
      >
        <div class="rte-dialog rte-color-dialog" role="dialog" aria-modal="true" aria-label="Text Color">
          <div class="rte-math-modal__header">
            <h3 class="rte-math-modal__title">Text Color</h3>
            <button class="rte-math-modal__close" aria-label="Close" @click="showTextColorPicker = false">✕</button>
          </div>
          <RTColorPicker
            :model-value="activeTextColor"
            label="Text Color"
            @update:model-value="(c) => { commands.setTextColor(c); showTextColorPicker = false }"
            @remove="commands.removeTextColor(); showTextColorPicker = false"
          />
        </div>
      </div>
    </Teleport>

    <!-- Highlight Color — centered modal (same pattern as Math Formula) -->
    <Teleport to="body">
      <div
        v-if="showHighlightPicker"
        class="rte-dialog-overlay"
        role="presentation"
        @mousedown.self="showHighlightPicker = false"
        @keydown.esc="showHighlightPicker = false"
      >
        <div class="rte-dialog rte-color-dialog" role="dialog" aria-modal="true" aria-label="Highlight Color">
          <div class="rte-math-modal__header">
            <h3 class="rte-math-modal__title">Highlight Color</h3>
            <button class="rte-math-modal__close" aria-label="Close" @click="showHighlightPicker = false">✕</button>
          </div>
          <RTColorPicker
            :model-value="activeHighlight"
            label="Highlight Color"
            @update:model-value="(c) => { commands.setHighlight(c); showHighlightPicker = false }"
            @remove="commands.removeHighlight(); showHighlightPicker = false"
          />
        </div>
      </div>
    </Teleport>

    <!-- Row break -->
    <div class="rte-toolbar__break"></div>

    <!-- ═══ ROW 2 ═══ -->

    <!-- Block type dropdown (Google Docs style) -->
    <div class="rte-toolbar__group">
      <select
        class="rte-toolbar__block-select"
        :value="activeState.blockType"
        aria-label="Text style"
        title="Text style"
        @change="onBlockTypeChange"
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Line spacing picker -->
    <div class="rte-toolbar__group">
      <select
        class="rte-toolbar__spacing-select"
        :value="currentSpacing"
        aria-label="Line spacing"
        title="Line & paragraph spacing"
        @change="onSpacingChange"
      >
        <option value="1.0">Single (1.0)</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2.0">Double (2.0)</option>
      </select>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Table -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Insert Table"
        title="Insert Table"
        @click="$emit('insert-table')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" font-size="7" fill="currentColor" stroke="none" font-weight="bold">1</text><text x="2" y="14" font-size="7" fill="currentColor" stroke="none" font-weight="bold">2</text><text x="2" y="20" font-size="7" fill="currentColor" stroke="none" font-weight="bold">3</text></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><line x1="20" y1="16" x2="14" y2="22" stroke-width="2"/><line x1="14" y1="16" x2="20" y2="22" stroke-width="2"/></svg>
      </button>
    </div>

    <div class="rte-toolbar__separator" role="separator"></div>

    <!-- Group: Word Count + Export + Emoji -->
    <div class="rte-toolbar__group">
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Insert Math"
        title="Insert Math Formula (LaTeX)"
        @click="$emit('math-open')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4l4 16"/><path d="M12 4l4 16"/><path d="M3 12h18"/><path d="M9 8h6"/></svg>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Word Count"
        title="Word Count"
        @click="$emit('word-count')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="14" y2="18"/><text x="17" y="20" font-size="7" fill="currentColor" stroke="none" font-weight="bold">#</text></svg>
      </button>
      <RTExportMenu
        @export-pdf="$emit('export-pdf')"
        @export-docx="$emit('export-docx')"
      />
      <!-- Import Word -->
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Import Word Document"
        title="Import Word (.docx)"
        @click="wordInput?.click()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      </button>
      <input ref="wordInput" type="file" accept=".docx" style="display:none" @change="onWordImport" />
      <button
        type="button"
        class="rte-toolbar__button"
        aria-label="Emoji"
        title="Insert Emoji"
        @click="$emit('emoji-open')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      </button>

      <!-- Comment button — distinct from highlight, uses fixed #CDBDEB colour -->
      <div class="rte-toolbar__separator" role="separator"></div>
      <button
        type="button"
        class="rte-toolbar__button rte-toolbar__button--comment"
        aria-label="Add Comment"
        title="Add Comment (select text first)"
        @click="$emit('add-remark')"
      >
        <span class="rte-toolbar__comment-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <!-- small colour swatch showing the comment colour (yellow, same as highlight) -->
          <span
            class="rte-toolbar__comment-swatch"
            style="background:#fef9c3; border: 1px solid #f59e0b"
          ></span>
        </span>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7v6h6"/><path d="M3 13C5 7 10 3 16 3a9 9 0 0 1 5 16.5"/></svg>
      </button>
      <button
        type="button"
        class="rte-toolbar__button"
        :disabled="!activeState.canRedo"
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        @click="commands.redo()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M21 13C19 7 14 3 8 3a9 9 0 0 0-5 16.5"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import RTColorPicker from './RTColorPicker.vue'
import RTExportMenu from './RTExportMenu.vue'
import type { EditorActiveState } from '../composables/useEditor'

const props = defineProps<{
  /** Current active formatting state */
  activeState: EditorActiveState
  /** Command functions to call */
  commands: {
    toggleBold: () => void
    toggleItalic: () => void
    toggleUnderline: () => void
    toggleStrike: () => void
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
    setTextColor: (color: string) => void
    removeTextColor: () => void
    setHighlight: (color: string) => void
    removeHighlight: () => void
    insertTable: (rows: number, cols: number, hasHeader: boolean) => void
  }
}>()

const emit = defineEmits<{
  'image-select': [file: File]
  'word-import': [file: File]
  'insert-table': []
  'word-count': []
  'math-open': []
  'export-pdf': []
  'export-docx': []
  'emoji-open': []
  'add-remark': []
  'spacing-change': [lineHeight: string, paraSpacing: string]
}>()

const showTextColorPicker = ref(false)
const showHighlightPicker = ref(false)
const activeTextColor = computed(() => props.activeState.textColor)
const activeHighlight = computed(() => props.activeState.highlight)

// Toggle helpers — pickers are now centered modals (dialog-overlay pattern).
// The overlay's @mousedown.self and @keydown.esc handle closing; no position
// calculation or outside-click listeners needed.
function openTextColorPicker() {
  showTextColorPicker.value = !showTextColorPicker.value
  showHighlightPicker.value = false
}
function openHighlightPicker() {
  showHighlightPicker.value = !showHighlightPicker.value
  showTextColorPicker.value = false
}

// Line spacing: maps preset value → [lineHeight, paragraphGap]
const spacingPresets: Record<string, [string, string]> = {
  '1.0':  ['1.0',  '0px'],
  '1.15': ['1.15', '4px'],
  '1.5':  ['1.5',  '6px'],
  '2.0':  ['2.0',  '10px'],
}
const currentSpacing = ref('1.5')

function onSpacingChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  currentSpacing.value = val
  const [lh, ps] = spacingPresets[val] ?? ['1.5', '6px']
  emit('spacing-change', lh, ps)
}

const imageInput = ref<HTMLInputElement | null>(null)
const wordInput = ref<HTMLInputElement | null>(null)

function onBlockTypeChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val === 'paragraph') {
    props.commands.setParagraph()
  } else if (val === 'h1') {
    props.commands.setHeading(1)
  } else if (val === 'h2') {
    props.commands.setHeading(2)
  } else if (val === 'h3') {
    props.commands.setHeading(3)
  }
}

function onImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) { emit('image-select', file); input.value = '' }
}

function onWordImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) { emit('word-import', file); input.value = '' }
}
</script>
