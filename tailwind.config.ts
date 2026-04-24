import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.vue',
    './components/**/*.vue',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{ts,js}'
  ]
} satisfies Config
