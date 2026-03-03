<template>
  <div
    v-if="visible"
    class="rte-slash-menu"
    :style="style"
    role="listbox"
    aria-label="Slash commands"
  >
    <input
      ref="filterRef"
      v-model="filter"
      class="rte-slash-menu__filter"
      type="text"
      placeholder="Type to filter..."
      aria-label="Filter commands"
      @keydown="onKeydown"
    />
    <ul class="rte-slash-menu__list">
      <li
        v-for="(cmd, index) in filteredCommands"
        :key="cmd.id"
        class="rte-slash-menu__item"
        :class="{ 'rte-slash-menu__item--active': index === selectedIndex }"
        role="option"
        :aria-selected="index === selectedIndex"
        @click="execute(cmd)"
        @mouseenter="selectedIndex = index"
      >
        <span class="rte-slash-menu__icon">{{ cmd.icon }}</span>
        <span class="rte-slash-menu__label">{{ cmd.label }}</span>
      </li>
      <li v-if="filteredCommands.length === 0" class="rte-slash-menu__empty">No results</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface SlashCommand {
  id: string
  icon: string
  label: string
  action: () => void
}

const props = defineProps<{
  visible: boolean
  top: number
  left: number
  commands: SlashCommand[]
}>()

const emit = defineEmits<{
  close: []
}>()

const filter = ref('')
const selectedIndex = ref(0)
const filterRef = ref<HTMLInputElement | null>(null)

const style = computed(() => ({
  top: `${props.top}px`,
  left: `${props.left}px`,
}))

const filteredCommands = computed(() =>
  filter.value
    ? props.commands.filter(c => c.label.toLowerCase().includes(filter.value.toLowerCase()))
    : props.commands
)

watch(() => props.visible, (val) => {
  if (val) {
    filter.value = ''
    selectedIndex.value = 0
    nextTick(() => filterRef.value?.focus())
  }
})

watch(filteredCommands, () => { selectedIndex.value = 0 })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const cmd = filteredCommands.value[selectedIndex.value]
    if (cmd) execute(cmd)
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

function execute(cmd: SlashCommand) {
  cmd.action()
  emit('close')
}
</script>

