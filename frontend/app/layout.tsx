import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'SafaiPay - Intelligent Waste-to-Value Marketplace',
  description: 'Verified Waste Collection, Transparent Pricing & Settlement Platform',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16865F',
};

const antiFlickerScript = `
(function() {
  try {
    var pref = localStorage.getItem('safaipay_theme_preference') || 'light';
    if (pref === 'system') {
      pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      try { localStorage.setItem('safaipay_theme_preference', pref); } catch (e) {}
    }
    var isDark = pref === 'dark';
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <script dangerouslySetInnerHTML={{ __html: antiFlickerScript }} />
      </head>
      <body className="bg-theme-bg text-theme-text min-h-screen antialiased selection:bg-theme-bright-mint selection:text-theme-deep-green font-sans transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
