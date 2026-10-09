'use client';

import React from 'react';
import Link from 'next/link';
import { User, Phone, Building2, ChevronRight, Shield, Edit3, Droplet } from 'lucide-react';
import { Personnel } from '@/types/personnel';
import { useAuth } from '@/context/AuthContext';

interface PersonnelCardProps {
  personnel: Personnel;
}

export default function PersonnelCard({ personnel }: PersonnelCardProps) {
  const { isAdmin } = useAuth();
  const [imgError, setImgError] = React.useState(false);
  const cleanPhone = personnel.phone_number ? String(personnel.phone_number).replace(/[^0-9]/g, '') : '';
  const displayName = personnel.full_name_th || [personnel.rank_th, personnel.first_name_th, personnel.last_name_th].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group active:scale-[0.99] relative">
      <div>
        {/* Top Badges Row: Sequence Number, Blood Group, Duty Status */}
        <div className="flex items-center justify-between gap-1.5 mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-400 font-mono text-xs font-black shadow-2xs">
              No. {personnel.seq_no}
            </span>
            {personnel.blood_group && (
              <span className="inline-flex items-center space-x-0.5 text-[11px] font-black px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                <Droplet className="w-2.5 h-2.5 fill-red-500 text-red-500 inline" />
                <span>{personnel.blood_group}</span>
              </span>
            )}
          </div>

          <div>
            {personnel.duty_status === 'ทบ.' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                ทบ.
              </span>
            )}
            {personnel.duty_status === 'ทท.' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                ทท.
              </span>
            )}
            {personnel.duty_status === 'ทร.' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                ทร.
              </span>
            )}
            {!['ทบ.', 'ทท.', 'ทร.'].includes(personnel.duty_status || '') && personnel.duty_status && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {personnel.duty_status}
              </span>
            )}
          </div>
        </div>

        {/* Profile Avatar & Names */}
        <Link href={`/personnel/${personnel.id}`} className="flex items-start space-x-3.5 group/link">
          {/* Portrait Photo Frame */}
          <div className="relative w-[64px] h-[82px] sm:w-[70px] sm:h-[88px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs group-hover/link:shadow-md transition-shadow">
            {personnel.photo_url && !imgError ? (
              <img
                src={personnel.photo_url}
                alt={displayName}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <User className="w-6 h-6 text-slate-400" />
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">ไม่มีรูป</span>
              </div>
            )}
          </div>

          {/* Names and Service Code */}
          <div className="min-w-0 flex-1">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors leading-snug break-words">
              {displayName}
            </h4>

            {/* Nickname & UN ID */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {personnel.nickname && (
                <span className="inline-flex items-center text-xs text-slate-700 font-semibold bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-md">
                  ชื่อเล่น <strong className="text-slate-950 ml-1">{personnel.nickname}</strong>
                </span>
              )}
              {personnel.service_code && (
                <span className="text-[11px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                  {personnel.service_code}
                </span>
              )}
            </div>

            {(personnel.rank_en || personnel.first_name_en) && (
              <p className="text-xs font-mono text-slate-500 mt-1 truncate font-medium">
                {personnel.rank_en} {personnel.first_name_en} {personnel.last_name_en}
              </p>
            )}
          </div>
        </Link>

        {/* Department & Position Details */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs sm:text-sm text-slate-700">
          <div className="flex items-center space-x-2 truncate">
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="truncate font-semibold text-slate-800">{personnel.department || 'ไม่ระบุสังกัด'}</span>
          </div>
          <div className="flex items-center space-x-2 truncate">
            <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate text-slate-600 font-normal">{personnel.regular_position || '-'}</span>
          </div>
        </div>
      </div>

      {/* Action Footer: Quick Call + View Profile */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {cleanPhone ? (
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-2xs border border-emerald-200/60"
            title={`โทรออก ${personnel.phone_number}`}
          >
            <Phone className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span className="font-mono">{personnel.phone_number}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">ไม่มีเบอร์โทร</span>
        )}

        <div className="flex items-center space-x-1">
          {isAdmin && (
            <Link
              href={`/personnel/${personnel.id}/edit`}
              className="text-slate-400 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="แก้ไขข้อมูล (Admin)"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
          )}

          <Link
            href={`/personnel/${personnel.id}`}
            className="inline-flex items-center space-x-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors active:scale-95"
          >
            <span>ดูโปรไฟล์</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
