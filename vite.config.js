import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    sourcemap: false, // Never expose source code in production builds
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy pages into their own async chunks
          'page-calendar':    ['./src/pages/Calendar.jsx'],
          'page-faith':       ['./src/pages/Faith.jsx', './src/pages/AdhkarPage.jsx', './src/pages/HadithsLibrary.jsx'],
          'page-profile':     ['./src/pages/Profile.jsx', './src/pages/Settings.jsx'],
          'habits-ui':        [
            './src/components/habits/HabitDetailDrawer.jsx',
            './src/components/habits/WeeklyMatrixView.jsx',
            './src/components/habits/HabitStatsPanel.jsx',
            './src/components/habits/NewHabitModal.jsx',
            './src/components/habits/HabitCard.jsx',
            './src/components/habits/HabitHeader.jsx',
            './src/components/habits/HabitDateStrip.jsx',
            './src/components/habits/HabitAreaTabs.jsx',
          ],
        },
      },
    },
  },
})

