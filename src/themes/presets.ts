import type { ThemeOverrides } from '../types'
import { defineTheme } from '../types'

/** Blue Steel theme — cool blue tones */
export const blueSteel = defineTheme({
  '--rte-accent': '#2563eb',
  '--rte-accent-hover': '#1d4ed8',
  '--rte-bg-active': '#eff6ff',
  '--rte-border': '#bfdbfe',
})

/** Forest theme — earthy green tones */
export const forest = defineTheme({
  '--rte-accent': '#16a34a',
  '--rte-accent-hover': '#15803d',
  '--rte-bg-active': '#f0fdf4',
  '--rte-border': '#bbf7d0',
})

/** Rose theme — warm pink tones */
export const rose = defineTheme({
  '--rte-accent': '#e11d48',
  '--rte-accent-hover': '#be123c',
  '--rte-bg-active': '#fff1f2',
  '--rte-border': '#fecdd3',
})

/** Amber theme — warm orange tones */
export const amber = defineTheme({
  '--rte-accent': '#d97706',
  '--rte-accent-hover': '#b45309',
  '--rte-bg-active': '#fffbeb',
  '--rte-border': '#fde68a',
})

/** All preset themes */
export const presetThemes = {
  blueSteel,
  forest,
  rose,
  amber,
} as const

