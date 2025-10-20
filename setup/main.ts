import { defineAppSetup } from '@slidev/types'
import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import ja from '../locales/ja.json'

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    ja
  }
})

export default defineAppSetup(({ app }) => {
  app.use(i18n)
})
