import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Unmiss R7 - ระบบสารสนเทศข้อมูลกำลังพล',
  description: 'ระบบสารสนเทศข้อมูลกำลังพล กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน ผลัดที่ 7 (UNMISS R7)',
  applicationName: 'Unmiss R7',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon.png?v=2', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unmiss R7',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0e2617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png?v=2" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-blue-100">
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
