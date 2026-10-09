'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminOnlyGuardProps {
  children: React.ReactNode;
}

export default function AdminOnlyGuard({ children }: AdminOnlyGuardProps) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-lg font-bold text-gray-900">
          ไม่มีสิทธิ์เข้าถึงหน้านี้
        </h2>

        <p className="text-xs text-gray-500 leading-relaxed">
          หน้านี้เปิดให้เฉพาะ <strong>ผู้ดูแลระบบ (Admin)</strong> เท่านั้น บัญชีปัจจุบันของท่านคือสิทธิ์ <strong>ผู้ใช้งานทั่วไป (User)</strong>
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/personnel"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าทำเนียบ</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <span>เข้าสู่ระบบใหม่</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
