'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronRight, 
  User, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Phone,
  MessageSquare,
  Copy,
  Check,
  SlidersHorizontal,
  FileText,
  Briefcase,
  HeartPulse,
  Mail
} from 'lucide-react';
import { personnelService, REMOVED_FIELD_KEYS, SYSTEM_PRIVATE_FIELD_KEYS } from '@/lib/personnelService';
import { Personnel, FieldDefinition, DisplayFieldSetting } from '@/types/personnel';
import { useAuth } from '@/context/AuthContext';
import QuickActionBar from '@/components/QuickActionBar';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

function formatBirthDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Handle standard YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
        const thaiYear = year > 2400 ? year : year + 543;
        return `${day} ${thaiMonths[month]} ${thaiYear}`;
      }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const thaiYear = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

export default function PersonnelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isAdmin } = useAuth();

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>([]);
  const [displayFields, setDisplayFields] = useState<DisplayFieldSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [personnelData, fields, baseDisplay] = await Promise.all([
          personnelService.getById(id),
          personnelService.getFieldDefinitions(),
          personnelService.fetchDisplayFields(),
        ]);
        setPersonnel(personnelData);
        setFieldDefs(fields);

        if (personnelData?.custom_fields) {
          const existingKeys = new Set(baseDisplay.map((f) => f.key));
          const extraFields: DisplayFieldSetting[] = [];
          Object.keys(personnelData.custom_fields).forEach((k) => {
            if (
              !existingKeys.has(k) &&
              !REMOVED_FIELD_KEYS.has(k) &&
              !SYSTEM_PRIVATE_FIELD_KEYS.has(k) &&
              !k.startsWith('__')
            ) {
              const def = fields.find((f) => f.field_key === k);
              extraFields.push({
                key: k,
                label: def?.field_label || k,
                category: 'ข้อมูลเสริม (Custom)',
                visible: true,
                description: `ฟิลด์เสริม (${k})`,
              });
            }
          });
          if (extraFields.length > 0) {
            setDisplayFields([...baseDisplay, ...extraFields]);
          } else {
            setDisplayFields(baseDisplay);
          }
        } else {
          setDisplayFields(baseDisplay);
        }
      } catch (err) {
        console.error('Error fetching personnel detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const isFieldVisible = (key: string): boolean => {
    const found = displayFields.find((f) => f.key === key);
    return found ? found.visible : false;
  };

  const getFieldValue = (key: string): string => {
    if (!personnel) return '-';

    let val: any = (personnel as any)[key];
    if (val === undefined || val === null || val === '') {
      if (personnel.custom_fields && personnel.custom_fields[key] !== undefined && personnel.custom_fields[key] !== null) {
        val = personnel.custom_fields[key];
      }
    }

    if (val === undefined || val === null || val === '' || val === '-') {
      return '-';
    }

    if (key === 'birth_date') {
      return formatBirthDate(String(val));
    }

    return String(val);
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleDeleteConfirm = async () => {
    if (!personnel) return;
    setIsDeleting(true);
    try {
      await personnelService.delete(personnel.id);
      router.push('/personnel');
    } catch (err) {
      console.error('Error deleting personnel:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <p className="text-xs text-gray-500 font-medium">กำลังโหลดข้อมูลกำลังพล...</p>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto mt-8 shadow-xs">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <h2 className="text-base font-bold text-gray-800">ไม่พบข้อมูลกำลังพล</h2>
        <p className="text-xs text-gray-400 mt-1 mb-5">ข้อมูลอาจถูกลบไปแล้ว</p>
        <Link
          href="/personnel"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่หน้ารายชื่อ</span>
        </Link>
      </div>
    );
  }

  // Label-Value Item with tap-to-copy & responsive sizing
  const GridItem = ({ 
    label, 
    value, 
    fieldKey,
  }: { 
    label: string; 
    value?: string | number | null;
    fieldKey?: string;
  }) => {
    const valStr = value !== undefined && value !== null && value !== '' ? String(value) : '-';
    const isCopied = copiedField === label;
    const isEmail = fieldKey === 'email' || label.toLowerCase().includes('อีเมล') || label.toLowerCase().includes('email');
    const isPhone = fieldKey === 'phone_number' || label.includes('เบอร์');
    const isNotes = fieldKey === 'notes' || label.includes('หมายเหตุ');
    const isBlood = fieldKey === 'blood_group' || label === 'กลุ่มเลือด';
    const isLine = fieldKey === 'line_id' || label.toLowerCase().includes('line');

    // Give ample width to wide content:
    // Email spans full width on mobile (col-span-2) and 2 columns on tablet/desktop (sm:col-span-2 lg:col-span-2)
    // Notes spans full row (col-span-2 sm:col-span-3 lg:col-span-4)
    let colSpanClass = 'col-span-1';
    if (isEmail) {
      colSpanClass = 'col-span-2 sm:col-span-2 lg:col-span-2';
    } else if (isNotes) {
      colSpanClass = 'col-span-2 sm:col-span-3 lg:col-span-4';
    }

    return (
      <div 
        onClick={() => valStr !== '-' && handleCopy(valStr, label)}
        className={`${colSpanClass} bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-blue-300 transition-all cursor-pointer relative group active:scale-[0.99] flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-tight flex items-center space-x-1.5">
            {isEmail && <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            {isPhone && <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {isLine && <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {isNotes && <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />}
            <span>{label}</span>
          </span>
          {valStr !== '-' && (
            <div className="flex items-center space-x-1 text-slate-400 group-hover:text-blue-600 transition-colors">
              <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                {isCopied ? 'คัดลอกแล้ว' : 'แตะเพื่อคัดลอก'}
              </span>
              <span>
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex items-center justify-between mt-0.5">
          {isEmail && valStr !== '-' ? (
            <a
              href={`mailto:${valStr}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm sm:text-base md:text-lg font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline break-all tracking-tight select-all leading-snug"
              title={`ส่งอีเมลถึง ${valStr}`}
            >
              {valStr}
            </a>
          ) : isPhone && valStr !== '-' ? (
            <a
              href={`tel:${valStr.replace(/[^0-9]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="text-base sm:text-lg md:text-xl font-mono font-black text-slate-900 hover:text-emerald-700 break-words"
            >
              {valStr}
            </a>
          ) : (
            <span 
              className={`
                ${isBlood ? 'text-red-600 font-black text-xl sm:text-2xl' : ''}
                ${isEmail ? 'text-sm sm:text-base md:text-lg font-mono font-bold text-slate-900 break-all' : ''}
                ${isNotes ? 'text-sm sm:text-base font-medium text-slate-800 break-words' : ''}
                ${!isBlood && !isEmail && !isNotes ? 'text-base sm:text-lg md:text-xl font-black text-slate-900 break-words' : ''}
              `}
            >
              {valStr}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-28 md:pb-12">
      {/* 1. Mobile-friendly Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between bg-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs">
        <Link 
          href="/personnel" 
          className="inline-flex items-center space-x-2 text-base font-bold text-slate-800 hover:text-blue-600 transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>รายชื่อทั้งหมด</span>
        </Link>
        <div className="flex items-center space-x-2 text-sm sm:text-base text-slate-500 font-medium">
          <span>ลำดับ</span>
          <span className="font-black text-slate-950 bg-amber-100 text-amber-950 px-3.5 py-1 rounded-xl font-mono text-sm sm:text-base border border-amber-300">
            No. {personnel.seq_no}
          </span>
        </div>
      </div>

      {/* Main Profile Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-8">
        
        {/* 2. Centered Profile Header */}
        <div className="flex flex-col items-center text-center">
          {/* Rounded portrait photo */}
          <div className="relative w-[130px] h-[168px] sm:w-[160px] sm:h-[208px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center mb-3 ring-2 ring-slate-100 flex-shrink-0">
            {personnel.photo_url && !imgError ? (
              <img
                src={personnel.photo_url}
                alt={personnel.full_name_th || 'รูปประจำตัว'}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
                loading="eager"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 bg-slate-50">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                <span className="text-xs sm:text-sm text-slate-400 mt-1.5 font-semibold">ไม่มีรูปถ่าย</span>
              </div>
            )}
          </div>

          {/* Thai Rank & Full Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {personnel.full_name_th}
          </h1>

          {/* English Rank & Name */}
          {(personnel.rank_en || personnel.first_name_en || personnel.last_name_en) && (
            <p className="text-sm sm:text-base font-mono text-slate-500 font-semibold mt-1">
              {[personnel.rank_en, personnel.first_name_en, personnel.last_name_en].filter(Boolean).join(' ')}
            </p>
          )}

          {/* PKF Number badge (shows only the PKF number) */}
          {personnel.service_code && (
            <div className="mt-2.5">
              <span className="inline-flex items-center text-sm sm:text-base font-mono font-bold text-sky-900 bg-sky-50 border border-sky-200/90 px-4 py-1 rounded-full shadow-2xs tracking-wide">
                {personnel.service_code}
              </span>
            </div>
          )}

          {/* Nickname (on its own line below PKF number) */}
          {personnel.nickname && (
            <div className="mt-2">
              <span className="inline-flex items-center text-sm sm:text-base font-bold text-slate-800 bg-amber-50 border border-amber-200/90 px-4 py-1 rounded-full shadow-2xs">
                <span className="text-amber-800 font-semibold">ชื่อเล่น:</span>
                <strong className="text-slate-950 font-black ml-1.5">{personnel.nickname}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="my-5 sm:my-8 border-slate-100" />

        {/* Admin Quick Link to Display Fields Settings */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-2xl px-4.5 py-3 text-sm sm:text-base">
            <div className="flex items-center space-x-2.5 text-slate-800 font-bold">
              <SlidersHorizontal className="w-4.5 h-4.5 text-blue-600" />
              <span>การ์ดฟิลด์ข้อมูลที่เปิดแสดงผล</span>
            </div>
            <Link
              href="/settings/fields"
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
            >
              <span>ตั้งค่าเปิด/ปิดการ์ดฟิลด์</span>
              <ChevronRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        )}

        {/* 3. Detailed Grid Layout: Grouped by categories and controlled by Display Settings */}
        <div className="space-y-6">
          {[
            { name: 'ข้อมูลยศและชื่อ', icon: <FileText className="w-4 h-4 text-blue-600" /> },
            { name: 'ข้อมูลสังกัดและตำแหน่ง', icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
            { name: 'ข้อมูลส่วนตัวและการแพทย์', icon: <HeartPulse className="w-4 h-4 text-rose-600" /> },
            { name: 'ข้อมูลเสริม (Custom)', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
          ].map(({ name, icon }) => {
            const catFields = displayFields.filter((f) => f.category === name && f.visible);
            if (catFields.length === 0) return null;

            return (
              <div key={name} className="space-y-3">
                <div className="flex items-center space-x-2 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">
                  {icon}
                  <span>{name}</span>
                  <span className="text-xs font-mono text-slate-400 font-medium">
                    ({catFields.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {catFields.map((field) => {
                    const val = getFieldValue(field.key);
                    return (
                      <GridItem
                        key={field.key}
                        label={field.label}
                        value={val}
                        fieldKey={field.key}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Bottom Action Controls */}
        <div className="hidden md:flex items-center justify-between mt-8 pt-5 border-t border-gray-200">
          <Link
            href="/personnel"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ารายชื่อ</span>
          </Link>

          <QuickActionBar
            personnelId={personnel.id}
            phoneNumber={personnel.phone_number}
            onDeleteClick={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/* 5. Mobile Quick Action Bar (Floating at bottom for one-thumb reach) */}
      <div className="md:hidden">
        <QuickActionBar
          personnelId={personnel.id}
          phoneNumber={personnel.phone_number}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        name={personnel.full_name_th}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
