'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  LogOut, 
  KeyRound, 
  ArrowLeft,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Save,
  Loader2,
  AlertCircle,
  Camera
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AvatarUploader from '@/components/AvatarUploader';
import { splitFullNameTh, formatFullNameTh, Personnel } from '@/types/personnel';

export default function UserProfileSettingsPage() {
  const router = useRouter();
  const { 
    user, 
    personnelData, 
    updateSelfProfile, 
    changePassword, 
    logout 
  } = useAuth();

  // Photo state
  const [photoUrl, setPhotoUrl] = useState('');

  // Editable Profile Form State
  const [rankTh, setRankTh] = useState('');
  const [firstNameTh, setFirstNameTh] = useState('');
  const [lastNameTh, setLastNameTh] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [lineId, setLineId] = useState('');
  const [rankEn, setRankEn] = useState('');
  const [firstNameEn, setFirstNameEn] = useState('');
  const [lastNameEn, setLastNameEn] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password change form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Sync form inputs when personnelData or user changes
  useEffect(() => {
    const custom = personnelData?.custom_fields || {};

    if (personnelData) {
      const split = splitFullNameTh(personnelData.full_name_th || '');
      setPhotoUrl(personnelData.photo_url || '');
      setRankTh(personnelData.rank_th || split.rank_th || '');
      setFirstNameTh(personnelData.first_name_th || split.first_name_th || '');
      setLastNameTh(personnelData.last_name_th || split.last_name_th || '');
      setNickname(personnelData.nickname || '');
      setPhoneNumber(personnelData.phone_number || '');
      setEmail(custom.email || '');
      setLineId(custom.line_id || '');
      setRankEn(personnelData.rank_en || '');
      setFirstNameEn(personnelData.first_name_en || '');
      setLastNameEn(personnelData.last_name_en || '');
    } else if (user) {
      const split = splitFullNameTh(user.displayName || '');
      setPhotoUrl(user.photo_url || '');
      setRankTh(user.rank_th || split.rank_th || '');
      setFirstNameTh(user.first_name_th || split.first_name_th || '');
      setLastNameTh(user.last_name_th || split.last_name_th || '');
      setNickname(user.nickname || '');
      setPhoneNumber(user.phone_number || '');
      setEmail('');
      setLineId('');
      setRankEn(user.rank_en || '');
      setFirstNameEn(user.first_name_en || '');
      setLastNameEn(user.last_name_en || '');
    }
  }, [personnelData, user]);

  // Submit Profile Changes (บันทึกรูปถ่าย ข้อมูลส่วนตัว และช่องทางติดต่อ)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    if (!firstNameTh.trim() || !lastNameTh.trim()) {
      setProfileErrorMsg('กรุณากรอกชื่อและนามสกุลภาษาไทย');
      return;
    }

    setIsSavingProfile(true);
    try {
      const combinedFullName = formatFullNameTh(rankTh.trim(), firstNameTh.trim(), lastNameTh.trim());
      
      const payload: Partial<Personnel> = {
        photo_url: photoUrl.trim() || null,
        rank_th: rankTh.trim(),
        first_name_th: firstNameTh.trim(),
        last_name_th: lastNameTh.trim(),
        full_name_th: combinedFullName,
        nickname: nickname.trim(),
        phone_number: phoneNumber.trim(),
        rank_en: rankEn.trim().toUpperCase(),
        first_name_en: firstNameEn.trim(),
        last_name_en: lastNameEn.trim(),
        custom_fields: {
          email: email.trim() || null,
          line_id: lineId.trim() || null,
        },
      };

      const ok = await updateSelfProfile(payload);

      if (ok) {
        setProfileSuccessMsg('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว');
        setTimeout(() => setProfileSuccessMsg(''), 4000);
      } else {
        setProfileErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setProfileErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!newPassword || newPassword.length < 4) {
      setPasswordErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setIsChangingPass(true);
    try {
      const ok = await changePassword(newPassword);
      if (ok) {
        setPasswordSuccessMsg('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(''), 4000);
      } else {
        setPasswordErrorMsg('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch {
      setPasswordErrorMsg('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Compute English full name
  const englishFullName = [rankEn, firstNameEn, lastNameEn].filter(Boolean).join(' ') ||
    [personnelData?.rank_en, personnelData?.first_name_en, personnelData?.last_name_en].filter(Boolean).join(' ') || '';

  // Compute Thai full name
  const thaiFullName = formatFullNameTh(rankTh, firstNameTh, lastNameTh) ||
    personnelData?.full_name_th ||
    user?.displayName ||
    'กำลังพล';

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-28 sm:pb-16 px-3.5 sm:px-0">
      {/* 1. Header */}
      <div className="flex items-center space-x-3 pt-2">
        <Link
          href="/"
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs transition-transform active:scale-95"
          title="กลับหน้าหลัก"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ตั้งค่าผู้ใช้
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
            ข้อมูลกำลังพลส่วนตัวและความปลอดภัยของบัญชี
          </p>
        </div>
      </div>

      {/* 2. การ์ดด้านบนที่แสดงรูปบุคคล: แสดงรูปบุคคล ชื่อไทย และ ภาษาอังกฤษ (ข้อมูลอื่นไม่ต้องแสดง) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* รูปบุคคล */}
          <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs">
            {photoUrl || personnelData?.photo_url || user?.photo_url ? (
              <img
                src={photoUrl || personnelData?.photo_url || user?.photo_url || ''}
                alt="Profile"
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            ) : (
              <User className="w-12 h-12 text-slate-300" />
            )}
          </div>

          {/* ชื่อไทย และ ภาษาอังกฤษ */}
          <div className="min-w-0 flex-1 self-center">
            {/* ชื่อไทย */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {thaiFullName}
            </h2>

            {/* ภาษาอังกฤษ */}
            {englishFullName && (
              <p className="text-sm sm:text-base text-slate-500 font-mono font-bold uppercase tracking-wider mt-1.5">
                {englishFullName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notification Messages */}
      {profileSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm sm:text-base font-bold text-emerald-800 flex items-center space-x-2.5 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {profileErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm sm:text-base font-bold text-red-700 flex items-center space-x-2.5 shadow-2xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {/* 3. ฟอร์มแก้ไขรูปถ่าย ข้อมูลส่วนตัว และช่องทางติดต่อ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>แก้ไขรูปถ่าย ข้อมูลส่วนตัว และช่องทางติดต่อ</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            ท่านสามารถอัปโหลดเปลี่ยนรูปถ่าย และแก้ไขข้อมูลประจำตัวและช่องทางติดต่อได้ที่นี่
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {/* ส่วนแก้ไขรูปถ่าย (Photo Upload) */}
          <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-sm sm:text-base font-bold text-slate-800">
              <Camera className="w-4.5 h-4.5 text-blue-600" />
              <span>แก้ไขรูปถ่ายข้าราชการ</span>
            </div>
            <AvatarUploader
              currentUrl={photoUrl}
              onUrlChange={(url) => setPhotoUrl(url)}
            />
          </div>

          {/* ส่วนข้อมูลส่วนตัว (ยศ ชื่อ สกุล ชื่อเล่น) */}
          <div className="space-y-3.5">
            <h4 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-1.5">
              ข้อมูลส่วนตัว (ภาษาไทย)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  ยศ (ไทย)
                </label>
                <input
                  type="text"
                  value={rankTh}
                  onChange={(e) => setRankTh(e.target.value)}
                  placeholder="เช่น พ.ท. หรือ ส.อ."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  ชื่อ (ไทย) *
                </label>
                <input
                  type="text"
                  value={firstNameTh}
                  onChange={(e) => setFirstNameTh(e.target.value)}
                  placeholder="เช่น วีระพงศ์"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  สกุล (ไทย) *
                </label>
                <input
                  type="text"
                  value={lastNameTh}
                  onChange={(e) => setLastNameTh(e.target.value)}
                  placeholder="เช่น จันทรศิริภาส"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                ชื่อเล่น (Nickname)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น เด่น"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* ส่วนช่องทางติดต่อ (เบอร์โทร อีเมล Line ID) */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-1.5">
              ช่องทางติดต่อ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="เช่น 089-876-4145"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="เช่น soldier@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  Line ID
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="เช่น line_id"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนชื่อ-สกุลภาษาอังกฤษ */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-100 pb-1.5">
              ชื่อ - สกุล (ภาษาอังกฤษ)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">RANK (EN)</label>
                <input
                  type="text"
                  value={rankEn}
                  onChange={(e) => setRankEn(e.target.value)}
                  placeholder="เช่น LT COL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">NAME (EN)</label>
                <input
                  type="text"
                  value={firstNameEn}
                  onChange={(e) => setFirstNameEn(e.target.value)}
                  placeholder="เช่น WEERAPONG"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">LASTNAME (EN)</label>
                <input
                  type="text"
                  value={lastNameEn}
                  onChange={(e) => setLastNameEn(e.target.value)}
                  placeholder="เช่น JANTARASIRIPAS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
          >
            {isSavingProfile ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Save className="w-5 h-5 text-amber-400" />
            )}
            <span>{isSavingProfile ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}</span>
          </button>
        </form>
      </div>

      {/* 4. ส่วนเปลี่ยนรหัสผ่านส่วนตัว */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <span>เปลี่ยนรหัสผ่านส่วนตัว</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            กำหนดรหัสผ่านใหม่สำหรับการเข้าสู่ระบบในครั้งถัดไป
          </p>
        </div>

        {passwordSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm sm:text-base font-bold text-emerald-800 flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm sm:text-base font-bold text-red-700 flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">รหัสผ่านใหม่ (New Password) *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">ยืนยันรหัสผ่านใหม่อีกครั้ง *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPass}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isChangingPass ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>

      {/* 5. ปุ่มออกจากระบบ (Sign Out) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black text-base flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-2xs"
        >
          <LogOut className="w-5 h-5" />
          <span>ออกจากระบบ (Sign Out)</span>
        </button>
      </div>
    </div>
  );
}
