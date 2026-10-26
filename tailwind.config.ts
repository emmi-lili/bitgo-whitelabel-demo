import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        appBg: '#F3F4F6',
        appCard: '#FFFFFF',
        appMuted: '#8E8E93',
        appDark: '#121214',
        pillBg: '#E9EBEF',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        '4xl': '2rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [forms, containerQueries],
} satisfies Config
