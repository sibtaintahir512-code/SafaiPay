import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Theme Tokens (mapped to CSS variables)
        theme: {
          bg: 'var(--theme-bg)',
          surface: 'var(--theme-surface)',
          elevated: 'var(--theme-elevated)',
          'deep-green': 'var(--theme-deep-green)',
          primary: 'var(--theme-primary)',
          'bright-green': 'var(--theme-bright-green)',
          text: 'var(--theme-text)',
          secondary: 'var(--theme-secondary-text)',
          border: 'var(--theme-border)',
          'soft-mint': 'var(--theme-soft-mint)',
          'bright-mint': 'var(--theme-bright-mint)',
          yellow: 'var(--theme-yellow)',
          error: 'var(--theme-error)',
          success: 'var(--theme-success)',
          warning: 'var(--theme-warning)',
          input: 'var(--theme-input)',
          focus: 'var(--theme-focus)',
          icon: 'var(--theme-icon)',
        },
        brand: {
          emerald: {
            400: '#2FA37A',
            500: '#10B981',
            600: '#16865F',
            700: '#146B4D',
          },
          teal: {
            900: '#073D3B',
            950: '#061A1A',
          },
          gold: {
            500: '#F4B400',
          },
          mint: {
            50: '#E1F4EB',
            300: '#9EE3C4',
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'eco-sm': '0 1px 3px 0 rgba(7, 61, 59, 0.08)',
        'eco-md': '0 4px 6px -1px rgba(7, 61, 59, 0.12)',
        'eco-lg': '0 10px 15px -3px rgba(7, 61, 59, 0.15)',
        'eco-hero': '0 20px 25px -5px rgba(7, 61, 59, 0.18)',
        'theme-card': 'var(--theme-shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
