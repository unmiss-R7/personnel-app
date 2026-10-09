'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Lock, 
  CreditCard, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Info 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [citizenId, setCitizenId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!citizenId.trim() || !password) {
      setError('กรุณากรอกเลขประจำตัวประชาชนและรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(citizenId, password);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.message || 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-3 py-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white p-1 mx-auto shadow-md border border-slate-200/90 flex items-center justify-center">
            <Image
              src="/icons/logo.png"
              alt="Unmiss R7 Logo"
              width={88}
              height={88}
              className="w-full h-full object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs sm:text-sm font-bold border border-sky-300">
            UNMISS R7
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Unmiss R7
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-semibold">
            กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน ผลัด 7
          </p>
        </div>

        {/* Notice Info Box */}
        <div className="bg-blue-50 border border-blue-200/90 rounded-2xl p-4.5 text-sm sm:text-base text-blue-950 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 font-black text-blue-950 text-sm sm:text-base">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>คำแนะนำการเข้าสู่ระบบ:</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-blue-900 font-medium">
            • <strong>ชื่อผู้ใช้</strong>: ระบุเลขประจำตัวประชาชน 13 หลัก<br />
            • <strong>เข้าสู่ระบบครั้งแรก</strong>: ให้ใส่รหัสผ่านเป็น <u>เลขประจำตัวทหาร 10 หลัก</u> และระบบจะให้ท่านตั้งรหัสผ่านใหม่ทันที
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm sm:text-base font-bold text-red-700 flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
              เลขประจำตัวประชาชน (13 หลัก) *
            </label>
            <div className="relative">
              <CreditCard className="w-5.5 h-5.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                placeholder="เช่น 1-7099-00124-91-2 หรือ 1709900124912"
                required
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
              รหัสผ่าน (ครั้งแรกใช้เลขประจำตัวทหาร 10 หลัก) *
            </label>
            <div className="relative">
              <Lock className="w-5.5 h-5.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน หรือเลขทหาร 10 หลัก"
                required
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <ArrowRight className="w-5 h-5 text-amber-400" />
            )}
            <span>{isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
