// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: 'assets/css/tailwind.css'
  },
  // Private keys: override with MONGODB_URI, JWT_SECRET in .env
  // See: https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET
  }
})
