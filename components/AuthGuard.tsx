'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ForcePasswordChangeModal from '@/components/ForcePasswordChangeModal';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isLoginPage) {
        // บังคับให้ login หากไม่มี session หรือไม่เคย login มาก่อน
        router.replace('/login');
      } else if (user && isLoginPage) {
        // หากมี session เข้าสู่ระบบอยู่แล้ว และเปิดหน้า /login ให้นำกลับหน้าแรก
        router.replace('/');
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // ขณะกำลังโหลดตรวจสอบ session จาก localStorage / Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white p-1 shadow-md border border-slate-200 flex items-center justify-center mb-4">
          <Image
            src="/icons/logo.png"
            alt="Unmiss R7 Logo"
            width={72}
            height={72}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm sm:text-base">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</span>
        </div>
      </div>
    );
  }

  // หากไม่มี session และอยู่นอกหน้า /login ให้แสดงหน้าจอเตรียมเข้าสู่ระบบระหว่าง redirect
  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white p-1 shadow-md border border-slate-200 flex items-center justify-center mb-4">
          <Image
            src="/icons/logo.png"
            alt="Unmiss R7 Logo"
            width={72}
            height={72}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm sm:text-base">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>กรุณาเข้าสู่ระบบ กำลังนำท่านไปยังหน้า Login...</span>
        </div>
      </div>
    );
  }

  // หากอยู่หน้า /login ให้แสดงเฉพาะฟอร์ม Login เต็มหน้าจอ
  if (isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-slate-50">
        {children}
      </div>
    );
  }

  // เมื่อเข้าสู่ระบบแล้ว ให้แสดงโครงสร้างแอปพลิเคชันหลักตามปกติ
  return (
    <>
      <ServiceWorkerRegister />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-8">
        {children}
      </main>
      <MobileBottomNav />
      <ForcePasswordChangeModal />
      <footer className="hidden md:block bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-gray-700">UNMISS Rotation 7 Personnel Information System (Unmiss R7)</p>
          <p className="text-gray-400 mt-1">กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน ผลัดที่ 7 • Progressive Web App (PWA)</p>
        </div>
      </footer>
    </>
  );
}
