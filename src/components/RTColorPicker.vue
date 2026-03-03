<template>
  <div class="rte-color-picker" role="dialog" :aria-label="label">
    <!-- 60 color swatches: 10 per row, 6 rows -->
    <div class="rte-color-picker__swatches" role="grid" :aria-label="label + ' presets'">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="rte-color-picker__swatch"
        :style="{ backgroundColor: color }"
        :aria-label="color"
        :aria-pressed="modelValue === color"
        @click="select(color)"
      />
    </div>

    <!-- Custom hex input -->
    <div class="rte-color-picker__custom">
      <span class="rte-color-picker__hash">#</span>
      <input
        v-model="hexInput"
        class="rte-color-picker__hex"
        type="text"
        maxlength="6"
        placeholder="RRGGBB"
        aria-label="Custom hex color"
        @keydown.enter="applyHex"
      />
      <button type="button" class="rte-color-picker__apply" @click="applyHex">OK</button>
    </div>

    <!-- Remove color -->
    <button type="button" class="rte-color-picker__remove" @click="$emit('remove')">
      ✕ Remove
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string | null
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [color: string]
  'remove': []
}>()

const hexInput = ref('')

// 60 preset colors (10 per row × 6 rows)
const colors = [
  // Row 1: Blacks & Grays
  '#000000','#1a1a1a','#333333','#4d4d4d','#666666','#808080','#999999','#b3b3b3','#cccccc','#ffffff',
  // Row 2: Reds & Pinks
  '#ff0000','#ff3333','#ff6666','#ff9999','#ffcccc','#ff1493','#ff69b4','#ff007f','#c71585','#8b0000',
  // Row 3: Oranges & Yellows
  '#ff6600','#ff8c00','#ffa500','#ffcc00','#ffff00','#ffe066','#ffd700','#daa520','#b8860b','#8b6914',
  // Row 4: Greens
  '#00ff00','#32cd32','#228b22','#006400','#90ee90','#00fa9a','#00ff7f','#3cb371','#2e8b57','#006400',
  // Row 5: Blues & Purples
  '#0000ff','#1e90ff','#00bfff','#87ceeb','#add8e6','#4169e1','#0000cd','#00008b','#191970','#000080',
  // Row 6: Purples & Browns
  '#800080','#9400d3','#8b008b','#da70d6','#ee82ee','#dda0dd','#a52a2a','#800000','#8b4513','#d2691e',
]

function select(color: string) {
  emit('update:modelValue', color)
}

function applyHex() {
  const val = hexInput.value.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(val)) {
    emit('update:modelValue', '#' + val)
    hexInput.value = ''
  }
}
</script>

