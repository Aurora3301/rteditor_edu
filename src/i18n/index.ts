import { ref, inject, provide, type InjectionKey, type Ref } from 'vue'
import { en, type Messages } from './en'
import { zhTW } from './zh-TW'

export type Locale = 'en' | 'zh-TW'

// All available message bundles
const messages: Record<Locale, Messages> = {
  'en': en,
  'zh-TW': zhTW,
}

// Vue injection key
export const I18N_KEY: InjectionKey<{
  locale: Ref<Locale>
  t: (key: string, params?: Record<string, string>) => string
}> = Symbol('rte-i18n')

/**
 * Provide i18n to the editor component tree.
 * Called once in RTEditor.vue.
 */
export function provideI18n(locale: Locale = 'en') {
  const currentLocale = ref<Locale>(locale)

  function t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.')
    let result: any = messages[currentLocale.value]
    for (const k of keys) {
      result = result?.[k]
    }
    if (typeof result !== 'string') {
      // Fallback to English
      result = keys.reduce((obj: any, k) => obj?.[k], messages['en'])
    }
    if (typeof result !== 'string') return key // Return key if not found

    // Replace {param} placeholders
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, v)
      }
    }
    return result
  }

  const i18n = { locale: currentLocale, t }
  provide(I18N_KEY, i18n)
  return i18n
}

/**
 * Use i18n in any child component.
 */
export function useI18n() {
  const i18n = inject(I18N_KEY)
  if (!i18n) {
    // Fallback if used outside provider (e.g., in tests)
    return {
      locale: ref<Locale>('en'),
      t: (key: string) => {
        const keys = key.split('.')
        let result: any = en
        for (const k of keys) result = result?.[k]
        return typeof result === 'string' ? result : key
      },
    }
  }
  return i18n
}

export { en, zhTW }
export type { Messages }
