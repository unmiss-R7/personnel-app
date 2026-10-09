import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ForcePasswordChangeModal from '@/components/ForcePasswordChangeModal';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { AuthProvider } from '@/context/AuthContext';

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
          <ServiceWorkerRegister />
          <Navbar />
          {/* pb-28 on mobile creates generous space for MobileBottomNav */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
            {children}
          </main>
          
          {/* Mobile Bottom Tab Bar */}
          <MobileBottomNav />

          {/* Mandatory First-Time Password Change Modal */}
          <ForcePasswordChangeModal />

          {/* Footer (hidden on mobile) */}
          <footer className="hidden md:block bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-gray-700">UNMISS Rotation 7 Personnel Information System (Unmiss R7)</p>
              <p className="text-gray-400 mt-1">กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน ผลัดที่ 7 • Progressive Web App (PWA)</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
