import { computed, ref } from 'vue'
import en from './messages/en'
import vi from './messages/vi'
import zhTW from './messages/zh-TW'

export const SUPPORTED_LOCALES = ['en', 'vi', 'zh-TW'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const LS_LOCALE_KEY = 'erp.locale'

const messages = {
  en,
  vi,
  'zh-TW': zhTW,
} as const

function resolveDefaultLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en'

  const savedLocale = localStorage.getItem(LS_LOCALE_KEY)
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)) {
    return savedLocale as SupportedLocale
  }

  const browserLocale = navigator.language
  if (browserLocale.startsWith('vi')) return 'vi'
  if (browserLocale.toLowerCase().startsWith('zh-tw')) return 'zh-TW'

  return 'en'
}

const activeLocale = ref<SupportedLocale>(resolveDefaultLocale())

export function persistLocale(locale: SupportedLocale) {
  localStorage.setItem(LS_LOCALE_KEY, locale)
}

export function setLocale(locale: SupportedLocale) {
  activeLocale.value = locale
  persistLocale(locale)
  syncDocumentLocale(locale)
}

export function t(key: string, params?: Record<string, string | number>): string {
  const message = resolvePath(messages[activeLocale.value], key)
  if (typeof message === 'string') return interpolate(message, params)

  const fallback = resolvePath(messages.en, key)
  return typeof fallback === 'string' ? interpolate(fallback, params) : key
}

export function useI18n() {
  return {
    locale: computed({
      get: () => activeLocale.value,
      set: (value: SupportedLocale) => setLocale(value),
    }),
    t,
  }
}

function resolvePath(target: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return (acc as Record<string, unknown>)[segment]
    }
    return undefined
  }, target)
}

function interpolate(message: string, params?: Record<string, string | number>) {
  if (!params) return message

  return Object.entries(params).reduce((result, [token, value]) => {
    return result.replaceAll(`{${token}}`, String(value))
  }, message)
}

function syncDocumentLocale(locale: SupportedLocale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
}

syncDocumentLocale(activeLocale.value)
