<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="rte-bubble-menu"
      :style="menuStyle"
      role="toolbar"
      aria-label="Formatting"
    >
      <!-- Link editing mode -->
      <template v-if="isLinkMode">
        <div class="rte-bubble-menu__link-display">
          <a
            :href="linkAttrs?.href"
            target="_blank"
            rel="noopener noreferrer"
            class="rte-bubble-menu__link-url"
          >
            {{ linkAttrs?.href }}
          </a>
          <button
            type="button"
            class="rte-bubble-menu__btn"
            aria-label="Edit Link"
            title="Edit Link"
            @click="onEditLink"
          >
            ✏️
          </button>
          <button
            type="button"
            class="rte-bubble-menu__btn"
            aria-label="Remove Link"
            title="Remove Link"
            @click="commands.removeLink()"
          >
            🔗✕
          </button>
        </div>
      </template>

      <!-- Link input mode -->
      <template v-else-if="isInputMode">
        <div class="rte-bubble-menu__link-input">
          <input
            ref="linkInputRef"
            v-model="linkInputValue"
            type="url"
            placeholder="https://..."
            class="rte-bubble-menu__input"
            @keydown.enter.prevent="onSubmitLink"
            @keydown.escape.prevent="onCancelLink"
          />
          <button
            type="button"
            class="rte-bubble-menu__btn rte-bubble-menu__btn--primary"
            aria-label="Apply Link"
            @click="onSubmitLink"
          >
            ✓
          </button>
          <button
            type="button"
            class="rte-bubble-menu__btn"
            aria-label="Cancel"
            @click="onCancelLink"
          >
            ✕
          </button>
        </div>
      </template>

      <!-- Selection toolbar mode -->
      <template v-else>
        <button type="button" class="rte-bubble-menu__btn" :class="{ 'rte-bubble-menu__btn--active': activeState.bold }" :aria-pressed="activeState.bold" aria-label="Bold" @click="commands.toggleBold()"><strong>B</strong></button>
        <button type="button" class="rte-bubble-menu__btn" :class="{ 'rte-bubble-menu__btn--active': activeState.italic }" :aria-pressed="activeState.italic" aria-label="Italic" @click="commands.toggleItalic()"><em>I</em></button>
        <button type="button" class="rte-bubble-menu__btn" :class="{ 'rte-bubble-menu__btn--active': activeState.underline }" :aria-pressed="activeState.underline" aria-label="Underline" @click="commands.toggleUnderline()"><u>U</u></button>
        <button type="button" class="rte-bubble-menu__btn" :class="{ 'rte-bubble-menu__btn--active': activeState.strike }" :aria-pressed="activeState.strike" aria-label="Strikethrough" @click="commands.toggleStrike()"><s>S</s></button>
        <div class="rte-bubble-menu__separator"></div>
        <button type="button" class="rte-bubble-menu__btn" :class="{ 'rte-bubble-menu__btn--active': activeState.link }" aria-label="Link" @click="onAddLink">🔗</button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { EditorView } from 'prosemirror-view'
import type { EditorActiveState } from '../composables/useEditor'

const props = defineProps<{
  view: EditorView | null
  activeState: EditorActiveState
  commands: Record<string, (...args: any[]) => void>
}>()

const menuRef = ref<HTMLElement | null>(null)
const linkInputRef = ref<HTMLInputElement | null>(null)
const linkInputValue = ref('')

// Mode: 'selection' | 'link-display' | 'link-input'
const mode = ref<'selection' | 'link-display' | 'link-input'>('selection')

const linkAttrs = computed(() => props.activeState.linkAttrs)

const isLinkMode = computed(() => mode.value === 'link-display')
const isInputMode = computed(() => mode.value === 'link-input')

// Position state
const coords = ref<{ left: number; top: number } | null>(null)

const visible = computed(() => {
  if (!props.view) return false
  if (mode.value === 'link-input') return true

  const state = props.view.state
  const { selection } = state

  // Show when there's a text selection (non-empty)
  if (!selection.empty) return true

  // Show when cursor is inside a link
  if (props.activeState.link && props.activeState.linkAttrs) return true

  return false
})

const menuStyle = computed(() => {
  if (!coords.value) return { display: 'none' }
  return {
    position: 'absolute' as const,
    left: `${coords.value.left}px`,
    top: `${coords.value.top}px`,
    zIndex: 9999,
  }
})

function updatePosition() {
  if (!props.view || !visible.value) {
    coords.value = null
    return
  }

  const { state } = props.view
  const { from, to } = state.selection

  const start = props.view.coordsAtPos(from)
  const end = props.view.coordsAtPos(to)

  // Center horizontally, position above selection
  const centerX = (start.left + end.left) / 2
  const topY = Math.min(start.top, end.top) - 8

  coords.value = {
    left: centerX + window.scrollX,
    top: topY + window.scrollY,
  }

  // After render, adjust for menu dimensions and viewport
  nextTick(() => {
    const menu = menuRef.value
    if (!menu) return
    const rect = menu.getBoundingClientRect()
    let adjustedLeft = centerX - rect.width / 2 + window.scrollX
    let adjustedTop = topY - rect.height + window.scrollY

    // Clamp to viewport
    adjustedLeft = Math.max(8, Math.min(adjustedLeft, window.innerWidth - rect.width - 8))
    adjustedTop = Math.max(8, adjustedTop)

    coords.value = { left: adjustedLeft, top: adjustedTop }
  })
}

// Update mode based on active state
watch(() => [props.activeState.link, props.activeState.linkAttrs, visible.value], () => {
  if (!visible.value) {
    mode.value = 'selection'
    return
  }

  const state = props.view?.state
  if (!state) return

  if (!state.selection.empty) {
    // Text selection: show selection toolbar
    if (mode.value !== 'link-input') {
      mode.value = 'selection'
    }
  } else if (props.activeState.link && props.activeState.linkAttrs) {
    // Cursor in a link: show link display
    if (mode.value !== 'link-input') {
      mode.value = 'link-display'
    }
  }
}, { immediate: true })

// Update position when visibility or selection changes
watch(visible, (val) => {
  if (val) {
    nextTick(updatePosition)
  }
})

// Listen to editor transactions for position updates
let updateTimer: ReturnType<typeof setTimeout> | null = null

function onTransaction() {
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    updatePosition()
  }, 16) // ~60fps
}

function onAddLink() {
  linkInputValue.value = linkAttrs.value?.href || ''
  mode.value = 'link-input'
  nextTick(() => {
    linkInputRef.value?.focus()
  })
}

function onEditLink() {
  linkInputValue.value = linkAttrs.value?.href || ''
  mode.value = 'link-input'
  nextTick(() => {
    linkInputRef.value?.focus()
    linkInputRef.value?.select()
  })
}

function onSubmitLink() {
  const href = linkInputValue.value.trim()
  if (href) {
    props.commands.setLink(href)
  }
  mode.value = 'selection'
  props.view?.focus()
}

function onCancelLink() {
  mode.value = 'selection'
  props.view?.focus()
}

// Scroll/resize listener to update position
function onScrollResize() {
  if (visible.value) updatePosition()
}

onMounted(() => {
  window.addEventListener('scroll', onScrollResize, true)
  window.addEventListener('resize', onScrollResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScrollResize, true)
  window.removeEventListener('resize', onScrollResize)
  if (updateTimer) clearTimeout(updateTimer)
})

// Expose the onTransaction callback so parent can call it
defineExpose({ onTransaction })
</script>

