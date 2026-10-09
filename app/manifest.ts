import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unmiss R7 - ระบบสารสนเทศข้อมูลกำลังพล',
    short_name: 'Unmiss R7',
    description: 'ระบบสารสนเทศข้อมูลกำลังพล กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน ผลัดที่ 7 (UNMISS R7)',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'th',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
