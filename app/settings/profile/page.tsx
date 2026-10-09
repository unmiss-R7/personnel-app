'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ShieldCheck, 
  ShieldAlert,
  LogOut, 
  KeyRound, 
  ArrowLeft,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  MessageSquare,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Sparkles,
  Building2,
  Briefcase,
  IdCard,
  CreditCard,
  HeartPulse,
  Calendar,
  Globe,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { personnelService } from '@/lib/personnelService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { Personnel, splitFullNameTh, formatFullNameTh } from '@/types/personnel';

export default function UserProfileSettingsPage() {
  const router = useRouter();
  const { 
    user, 
    personnelData, 
    isAdmin, 
    updateSelfProfile, 
    changePassword, 
    logout, 
    refreshUserData,
    switchActivePersonnel,
    toggleRole 
  } = useAuth();

  // All personnel for switcher modal
  const [allPersonnelList, setAllPersonnelList] = useState<Personnel[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState('');
  const [switcherDutyFilter, setSwitcherDutyFilter] = useState<string>('all');

  // Sync state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

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

  // Admin-only editable official fields
  const [isAdminEditMode, setIsAdminEditMode] = useState(false);
  const [adminDepartment, setAdminDepartment] = useState('');
  const [adminRegularPosition, setAdminRegularPosition] = useState('');
  const [adminFieldPosition, setAdminFieldPosition] = useState('');
  const [adminDutyStatus, setAdminDutyStatus] = useState('');
  const [adminBloodGroup, setAdminBloodGroup] = useState('');
  const [adminReligion, setAdminReligion] = useState('');
  const [adminBirthDate, setAdminBirthDate] = useState('');
  const [adminPassportNo, setAdminPassportNo] = useState('');
  const [adminSalaryStep, setAdminSalaryStep] = useState('');

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

  // Initial load of all personnel for search/switch
  useEffect(() => {
    async function loadAll() {
      setIsLoadingAll(true);
      try {
        const list = await personnelService.getAll();
        setAllPersonnelList(list);
      } catch (err) {
        console.error('Failed to load personnel list', err);
      } finally {
        setIsLoadingAll(false);
      }
    }
    loadAll();
    setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Sync form inputs when personnelData or user changes
  useEffect(() => {
    const custom = personnelData?.custom_fields || {};

    if (personnelData) {
      const split = splitFullNameTh(personnelData.full_name_th || '');
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

      // Admin fields
      setAdminDepartment(personnelData.department || '');
      setAdminRegularPosition(personnelData.regular_position || '');
      setAdminFieldPosition(personnelData.field_position || '');
      setAdminDutyStatus(personnelData.duty_status || 'ทบ.');
      setAdminBloodGroup(personnelData.blood_group || '');
      setAdminReligion(personnelData.religion || '');
      setAdminBirthDate(personnelData.birth_date || '');
      setAdminPassportNo(personnelData.passport_no || '');
      setAdminSalaryStep(personnelData.salary_step || '');
    } else if (user) {
      const split = splitFullNameTh(user.displayName || '');
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

      setAdminDepartment(user.department || '');
      setAdminRegularPosition('');
      setAdminFieldPosition('');
      setAdminDutyStatus('ทบ.');
      setAdminBloodGroup('');
      setAdminReligion('');
      setAdminBirthDate('');
      setAdminPassportNo('');
      setAdminSalaryStep('');
    }
  }, [personnelData, user]);

  // Handle Manual Refresh from live Supabase
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    try {
      await refreshUserData();
      const list = await personnelService.getAll();
      setAllPersonnelList(list);
      setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setProfileSuccessMsg('ซิงค์ข้อมูลล่าสุดจากฐานข้อมูล Supabase สำเร็จ');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch {
      setProfileErrorMsg('ไม่สามารถซิงค์ข้อมูลกับ Supabase ได้ในขณะนี้');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Submit Profile Changes
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

      if (isAdmin && isAdminEditMode) {
        payload.department = adminDepartment.trim();
        payload.regular_position = adminRegularPosition.trim();
        payload.field_position = adminFieldPosition.trim();
        payload.duty_status = adminDutyStatus.trim();
        payload.blood_group = adminBloodGroup.trim();
        payload.religion = adminReligion.trim();
        payload.birth_date = adminBirthDate.trim() || null;
        payload.passport_no = adminPassportNo.trim();
        payload.salary_step = adminSalaryStep.trim();
      }

      const ok = await updateSelfProfile(payload);

      if (ok) {
        setProfileSuccessMsg('บันทึกข้อมูลไปยังฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว');
        setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  // Filtered list for personnel switcher
  const filteredPersonnel = useMemo(() => {
    const q = switcherSearch.trim().toLowerCase();
    return allPersonnelList.filter((p) => {
      // Duty Status Filter
      if (switcherDutyFilter !== 'all') {
        const duty = (p.duty_status || '').trim();
        if (duty !== switcherDutyFilter) return false;
      }

      if (!q) return true;

      const fullTh = (p.full_name_th || '').toLowerCase();
      const firstTh = (p.first_name_th || '').toLowerCase();
      const lastTh = (p.last_name_th || '').toLowerCase();
      const nick = (p.nickname || '').toLowerCase();
      const mil = (p.military_id || '').toLowerCase();
      const cit = (p.citizen_id || '').toLowerCase();
      const pkf = (p.service_code || '').toLowerCase();
      const dept = (p.department || '').toLowerCase();
      const pos = (p.field_position || p.regular_position || '').toLowerCase();

      return (
        fullTh.includes(q) ||
        firstTh.includes(q) ||
        lastTh.includes(q) ||
        nick.includes(q) ||
        mil.includes(q) ||
        cit.includes(q) ||
        pkf.includes(q) ||
        dept.includes(q) ||
        pos.includes(q)
      );
    });
  }, [allPersonnelList, switcherSearch, switcherDutyFilter]);

  // Duty status styling
  const getDutyBadge = (duty?: string | null) => {
    const d = (duty || '').trim();
    if (d === 'ทบ.') {
      return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', label: 'สังกัด ทบ. (กองทัพบก)' };
    }
    if (d === 'ทท.') {
      return { bg: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-500', label: 'สังกัด ทท. (กองบัญชาการกองทัพไทย)' };
    }
    if (d === 'ทร.') {
      return { bg: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-500', label: 'สังกัด ทร. (กองทัพเรือ)' };
    }
    return { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500', label: d || 'ทบ.' };
  };

  const currentDuty = getDutyBadge(personnelData?.duty_status);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 sm:pb-16 px-3.5 sm:px-0">
      {/* 1. Header & Live Supabase Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs transition-transform active:scale-95"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ตั้งค่าผู้ใช้ (User Settings)
              </h1>
              {isSupabaseConfigured() && (
                <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Supabase Live</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              ข้อมูลกำลังพลส่วนตัวและความปลอดภัยของบัญชี (เชื่อมต่อฐานข้อมูลจริง Supabase)
            </p>
          </div>
        </div>

        {/* Action Buttons: Switch Personnel & Refresh Sync */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span>สลับดูบัญชีกำลังพล ({allPersonnelList.length || 315} นาย)</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title="รีเฟรชข้อมูลจาก Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden md:inline">{isRefreshing ? 'กำลังซิงค์...' : 'รีเฟรช'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {lastSyncTime && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-2xl text-xs text-slate-600 font-medium">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>เชื่อมต่อฐานข้อมูล Supabase: <strong>ตาราง personnel</strong> (อัปเดตล่าสุด: {lastSyncTime} น.)</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">ลำดับที่: {personnelData?.seq_no || '-'}</span>
        </div>
      )}

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

      {/* 2. User Hero Profile Card (Real Supabase Live Data) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Real Avatar Photo */}
          <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
            {personnelData?.photo_url || user?.photo_url ? (
              <img
                src={personnelData?.photo_url || user?.photo_url || ''}
                alt="Profile"
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            ) : (
              <div className="text-center p-3">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-1" />
                <span className="text-2xs text-slate-400 font-bold block">ไม่มีรูปถ่าย</span>
              </div>
            )}
            {/* Seq badge */}
            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-2xs font-mono font-black">
              #{personnelData?.seq_no || 1}
            </div>
          </div>

          {/* Profile Identity Details */}
          <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {personnelData?.full_name_th || user?.displayName || 'กำลังพล'}
                </h2>
                {personnelData?.nickname && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs sm:text-sm font-bold">
                    ชื่อเล่น: &ldquo;{personnelData.nickname}&rdquo;
                  </span>
                )}
              </div>

              {(personnelData?.rank_en || personnelData?.first_name_en) && (
                <p className="text-xs sm:text-sm text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                  {personnelData?.rank_en} {personnelData?.first_name_en} {personnelData?.last_name_en}
                </p>
              )}
            </div>

            {/* Badges: Role, Duty Status, PKF ID */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Role Badge */}
              <div className="inline-flex items-center space-x-1.5">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold ${
                  isAdmin 
                    ? 'bg-slate-900 text-amber-400 border border-slate-800' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4" />}
                  <span>{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งานทั่วไป (User)'}</span>
                </span>
                <button
                  type="button"
                  onClick={toggleRole}
                  className="px-2.5 py-1 rounded-full text-2xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                  title="สลับสิทธิ์การใช้งานเพื่อทดสอบ"
                >
                  สลับเป็น {isAdmin ? 'User' : 'Admin'}
                </button>
              </div>

              {/* Duty Status Badge (ทบ. / ทท. / ทร.) */}
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentDuty.bg}`}>
                <span className={`w-2 h-2 rounded-full ${currentDuty.dot}`} />
                <span>{currentDuty.label}</span>
              </span>

              {/* PKF ID */}
              {personnelData?.service_code && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-800 border border-sky-300">
                  <span>PKF:</span>
                  <span>{personnelData.service_code}</span>
                </span>
              )}
            </div>

            {/* Real Positions & Department */}
            <div className="pt-2 text-xs sm:text-sm space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-slate-600 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>ส่วนงาน: <strong className="text-slate-900">{personnelData?.department || user?.department || 'Unmiss R7'}</strong></span>
                </span>
                {personnelData?.field_position && (
                  <span className="flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>ตำแหน่งในสนาม: <strong className="text-blue-900">{personnelData.field_position}</strong></span>
                  </span>
                )}
              </div>
              {personnelData?.regular_position && (
                <p className="text-slate-500 font-medium">
                  ตำแหน่งปกติ: <span className="text-slate-800 font-semibold">{personnelData.regular_position}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real Supabase Official Information Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
              <IdCard className="w-5 h-5 text-indigo-600" />
              <span>ข้อมูลประจำตัวและราชการในฐานข้อมูลจริง (Supabase)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              ข้อมูลทั้งหมด 17+ ฟิลด์ที่บันทึกอยู่ในตาราง <code>personnel</code> บน Supabase
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminEditMode(!isAdminEditMode)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isAdminEditMode 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAdminEditMode ? 'ปิดโหมด Admin Edit' : 'แก้ไขข้อมูลราชการ (Admin)'}</span>
            </button>
          )}
        </div>

        {/* Real DB Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
          {/* 1. PKF */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">หมายเลข PKF ID</span>
            <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.service_code || '-'}
            </span>
          </div>

          {/* 2. Seq No */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ลำดับที่ในทำเนียบ (Seq No.)</span>
            <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.seq_no ?? '-'}
            </span>
          </div>

          {/* 3. Military ID */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">เลขประจำตัวทหาร (10 หลัก)</span>
            <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.military_id || user?.military_id || '-'}
            </span>
          </div>

          {/* 4. Citizen ID */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">เลขประจำตัวประชาชน (13 หลัก)</span>
            <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.citizen_id || user?.citizen_id || '-'}
            </span>
          </div>

          {/* 5. Field Position */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 sm:col-span-2">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ตำแหน่งในสนาม (Field Position)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminFieldPosition}
                onChange={(e) => setAdminFieldPosition(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-blue-900 block truncate mt-0.5">
                {personnelData?.field_position || '-'}
              </span>
            )}
          </div>

          {/* 6. Regular Position */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 sm:col-span-2">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ตำแหน่งปกติ (Regular Position)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminRegularPosition}
                onChange={(e) => setAdminRegularPosition(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.regular_position || '-'}
              </span>
            )}
          </div>

          {/* 7. Department */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 sm:col-span-2">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ส่วนงาน / กองร้อย (Department)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminDepartment}
                onChange={(e) => setAdminDepartment(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.department || user?.department || '-'}
              </span>
            )}
          </div>

          {/* 8. Duty Status (สังกัด ทบ./ทท./ทร.) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">สังกัด (duty_status)</span>
            {isAdminEditMode ? (
              <select
                value={adminDutyStatus}
                onChange={(e) => setAdminDutyStatus(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              >
                <option value="ทบ.">ทบ. (กองทัพบก)</option>
                <option value="ทท.">ทท. (กองทัพไทย)</option>
                <option value="ทร.">ทร. (กองทัพเรือ)</option>
              </select>
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.duty_status || 'ทบ.'}
              </span>
            )}
          </div>

          {/* 9. Passport No */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">หนังสือเดินทาง (Passport)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminPassportNo}
                onChange={(e) => setAdminPassportNo(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.passport_no || '-'}
              </span>
            )}
          </div>

          {/* 10. Salary Step */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 sm:col-span-2">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ชั้นเงินเดือน (Salary Step)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminSalaryStep}
                onChange={(e) => setAdminSalaryStep(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.salary_step || '-'}
              </span>
            )}
          </div>

          {/* 11. Blood Group */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">หมู่โลหิต (Blood)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminBloodGroup}
                onChange={(e) => setAdminBloodGroup(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.blood_group || '-'}
              </span>
            )}
          </div>

          {/* 12. Religion */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ศาสนา (Religion)</span>
            {isAdminEditMode ? (
              <input
                type="text"
                value={adminReligion}
                onChange={(e) => setAdminReligion(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.religion || '-'}
              </span>
            )}
          </div>

          {/* 13. Birth Date */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">วันเกิด (Birth Date)</span>
            {isAdminEditMode ? (
              <input
                type="date"
                value={adminBirthDate}
                onChange={(e) => setAdminBirthDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
              />
            ) : (
              <span className="font-mono font-bold text-slate-900 block truncate mt-0.5">
                {personnelData?.birth_date || '-'}
              </span>
            )}
          </div>

          {/* 14. Gender */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">เพศ (Gender)</span>
            <span className="font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.custom_fields?.gender || '-'}
            </span>
          </div>

          {/* 15. Age */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">อายุ (Age)</span>
            <span className="font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.custom_fields?.age ? `${personnelData.custom_fields.age} ปี` : '-'}
            </span>
          </div>

          {/* 16. Personnel Category */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">ประเภทกำลังพล</span>
            <span className="font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.custom_fields?.personnel_category || '-'}
            </span>
          </div>

          {/* 17. Notes / Origin */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 sm:col-span-2">
            <span className="text-2xs sm:text-xs text-slate-400 block font-semibold">หน่วยเดิม / กำเนิด (Notes)</span>
            <span className="font-bold text-slate-900 block truncate mt-0.5">
              {personnelData?.custom_fields?.notes || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Profile Edit Form: Direct Update to Supabase */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>แก้ไขข้อมูลส่วนตัวและช่องทางติดต่อ</span>
            </h3>
            <span className="text-2xs sm:text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              บันทึกตรงเข้า Supabase
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            ท่านสามารถปรับปรุงข้อมูลยศ ชื่อ สกุล ชื่อเล่น เบอร์โทรศัพท์ อีเมล และ Line ID ข้อมูลจะอัปเดตลงฐานข้อมูลจริงทันที
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Thai Name Parts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                ยศ (ไทย)
              </label>
              <input
                type="text"
                value={rankTh}
                onChange={(e) => setRankTh(e.target.value)}
                placeholder="เช่น พ.ท. หรือ ส.อ."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                ชื่อ (ไทย) *
              </label>
              <input
                type="text"
                value={firstNameTh}
                onChange={(e) => setFirstNameTh(e.target.value)}
                placeholder="เช่น วีระพงศ์"
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                สกุล (ไทย) *
              </label>
              <input
                type="text"
                value={lastNameTh}
                onChange={(e) => setLastNameTh(e.target.value)}
                placeholder="เช่น จันทรศิริภาส"
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Nickname, Phone, Email, Line ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                ชื่อเล่น (Nickname)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น เด่น"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                เบอร์โทรศัพท์ (Phone)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="เช่น 089-876-4145"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                อีเมล (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น soldier@hotmail.com"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">
                Line ID
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="เช่น zodiak"
                  className="w-full pl-10 pr-3 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* English Name Parts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">RANK (EN)</label>
              <input
                type="text"
                value={rankEn}
                onChange={(e) => setRankEn(e.target.value)}
                placeholder="เช่น LT COL"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">NAME (EN)</label>
              <input
                type="text"
                value={firstNameEn}
                onChange={(e) => setFirstNameEn(e.target.value)}
                placeholder="เช่น WEERAPONG"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">LASTNAME (EN)</label>
              <input
                type="text"
                value={lastNameEn}
                onChange={(e) => setLastNameEn(e.target.value)}
                placeholder="เช่น JANTARASIRIPAS"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base sm:text-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
          >
            {isSavingProfile ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Save className="w-5 h-5 text-amber-400" />
            )}
            <span>{isSavingProfile ? 'กำลังบันทึกไปยัง Supabase...' : 'บันทึกการแก้ไขข้อมูลลงฐานข้อมูลจริง'}</span>
          </button>
        </form>
      </div>

      {/* 5. Password Change Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3.5">
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
            <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">รหัสผ่านใหม่ (New Password) *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">ยืนยันรหัสผ่านใหม่อีกครั้ง *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPass}
            className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-base transition-all active:scale-95 disabled:opacity-50"
          >
            {isChangingPass ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>

      {/* 6. Sign Out Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black text-base sm:text-lg flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-2xs"
        >
          <LogOut className="w-5 h-5" />
          <span>ออกจากระบบ (Sign Out)</span>
        </button>
      </div>

      {/* 7. Personnel Switcher Modal (ค้นหาและสลับไปยังกำลังพลจริงใน Supabase 315 นาย) */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>เลือกสลับบัญชีกำลังพล (ฐานข้อมูล Supabase)</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  เลือกดูหรือจัดการข้อมูลของกำลังพลรายใดก็ได้จากทั้งหมด {allPersonnelList.length} นาย
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={switcherSearch}
                  onChange={(e) => setSwitcherSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, สกุล, ยศ, เลขทหาร, เลขประชาชน, หรือ PKF..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  autoFocus
                />
              </div>

              {/* Filter Chips by duty_status */}
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span className="text-slate-400">สังกัด:</span>
                {[
                  { key: 'all', label: 'ทั้งหมด' },
                  { key: 'ทบ.', label: 'ทบ. (กองทัพบก)' },
                  { key: 'ทท.', label: 'ทท. (กองทัพไทย)' },
                  { key: 'ทร.', label: 'ทร. (กองทัพเรือ)' },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setSwitcherDutyFilter(chip.key)}
                    className={`px-2.5 py-1 rounded-xl transition-all ${
                      switcherDutyFilter === chip.key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Personnel List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
              {filteredPersonnel.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">ไม่พบข้อมูลกำลังพลที่ตรงกับคำค้นหา</p>
                </div>
              ) : (
                filteredPersonnel.map((p) => {
                  const isCurrent = personnelData?.id === p.id;
                  const duty = getDutyBadge(p.duty_status);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        switchActivePersonnel(p);
                        setIsSwitcherOpen(false);
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-blue-50/80 border border-blue-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-11 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt={p.full_name_th}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-300" />
                          )}
                        </div>

                        {/* Name & Position */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xs font-mono font-bold text-slate-400">#{p.seq_no}</span>
                            <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                              {p.full_name_th}
                            </h4>
                            {p.nickname && (
                              <span className="text-2xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold">
                                {p.nickname}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {p.field_position || p.regular_position || p.department || '-'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-2xs px-2 py-0.5 rounded-md font-bold border ${duty.bg}`}>
                              {p.duty_status || 'ทบ.'}
                            </span>
                            {p.service_code && (
                              <span className="text-2xs font-mono text-slate-400">
                                {p.service_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full text-2xs font-black bg-blue-600 text-white">
                            กำลังใช้งาน
                          </span>
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
