/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: {
            400: '#2FA37A',
            600: '#1B7F5C',
            700: '#146B4D',
          },
          teal: {
            900: '#0F3D3E',
            950: '#0B2F30',
          },
          gold: {
            500: '#F2A900',
          },
          mint: {
            50: '#E6F4EC',
            300: '#9FE6C6',
          },
        },
        eco: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          border: 'var(--border)',
          text: 'var(--text)',
          mute: 'var(--text-mute)',
          soft: 'var(--text-soft)',
          emerald: '#1B7F5C',
          'emerald-hover': '#146B4D',
          'emerald-light': '#2FA37A',
          teal: '#0F3D3E',
          'teal-dark': '#0B2F30',
          gold: '#F2A900',
          mint: '#E6F4EC',
          'mint-light': '#9FE6C6',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'eco-sm': '0 1px 3px 0 rgba(15, 61, 62, 0.08)',
        'eco-md': '0 4px 6px -1px rgba(15, 61, 62, 0.12)',
        'eco-lg': '0 10px 15px -3px rgba(15, 61, 62, 0.15)',
        'eco-hero': '0 20px 25px -5px rgba(15, 61, 62, 0.18)',
      },
    },
  },
  plugins: [],
};
