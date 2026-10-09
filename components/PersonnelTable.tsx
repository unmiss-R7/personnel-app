import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Eye, Edit3, Trash2, Phone } from 'lucide-react';
import { Personnel } from '@/types/personnel';

interface PersonnelTableProps {
  personnelList: Personnel[];
  onDeleteRequest: (personnel: Personnel) => void;
  isAdmin?: boolean;
}

export default function PersonnelTable({ 
  personnelList, 
  onDeleteRequest,
  isAdmin = false
}: PersonnelTableProps) {
  if (personnelList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
        ไม่พบข้อมูลกำลังพลตามเงื่อนไขที่ค้นหา
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base text-slate-800">
          <thead className="bg-slate-50 border-b border-slate-200 text-sm sm:text-base font-black text-slate-800">
            <tr>
              <th scope="col" className="px-4 py-4 text-center w-16">ลำดับ</th>
              <th scope="col" className="px-3 py-4 w-14 text-center">รูปถ่าย</th>
              <th scope="col" className="px-4 py-4">ยศ ชื่อ-นามสกุล (ไทย / อังกฤษ)</th>
              <th scope="col" className="px-4 py-4">ตำแหน่ง</th>
              <th scope="col" className="px-4 py-4">ส่วนงาน/กองร้อย</th>
              <th scope="col" className="px-3 py-4 text-center">กลุ่มเลือด</th>
              <th scope="col" className="px-4 py-4">เบอร์ติดต่อ</th>
              <th scope="col" className="px-4 py-4 text-right w-28">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {personnelList.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                {/* Sequence No */}
                <td className="px-4 py-3 text-center font-bold text-slate-900">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-900 text-sm font-black">
                    {p.seq_no}
                  </span>
                </td>

                {/* Avatar */}
                <td className="px-3 py-2.5 text-center">
                  <div className="relative w-9 h-11 sm:w-10 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs mx-auto">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.full_name_th}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </td>

                {/* Names */}
                <td className="px-4 py-3.5">
                  <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2 flex-wrap gap-1">
                    <Link href={`/personnel/${p.id}`} className="hover:text-blue-600 transition-colors">
                      {p.full_name_th || [p.rank_th, p.first_name_th, p.last_name_th].filter(Boolean).join(' ') || 'ไม่ระบุชื่อ'}
                    </Link>
                    {p.nickname && (
                      <span className="text-xs sm:text-sm text-slate-500 font-semibold">
                        ({p.nickname})
                      </span>
                    )}
                    {p.duty_status && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                        p.duty_status === 'ทบ.' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                        p.duty_status === 'ทท.' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                        p.duty_status === 'ทร.' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {p.duty_status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-400 mt-0.5 font-medium">
                    {p.rank_en} {p.first_name_en} {p.last_name_en}
                  </div>
                </td>

                {/* Positions */}
                <td className="px-4 py-3.5 text-sm sm:text-base">
                  <div className="text-slate-800 font-semibold">
                    {p.regular_position || '-'}
                  </div>
                </td>

                {/* Department */}
                <td className="px-4 py-3.5 text-sm sm:text-base text-slate-700 whitespace-nowrap font-medium">
                  {p.department || '-'}
                </td>

                {/* Blood Group */}
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                  {p.blood_group ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-red-50 text-red-700 border border-red-200">
                      {p.blood_group}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>

                {/* Phone */}
                <td className="px-4 py-3.5 text-sm sm:text-base font-mono whitespace-nowrap">
                  {p.phone_number ? (
                    <a
                      href={`tel:${String(p.phone_number).replace(/[^0-9]/g, '')}`}
                      className="text-slate-800 hover:text-emerald-700 flex items-center space-x-1.5 font-bold"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>{String(p.phone_number)}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-1.5">
                    <Link
                      href={`/personnel/${p.id}`}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                      title="ดูโปรไฟล์"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>

                    {/* Admin-only Edit & Delete Actions */}
                    {isAdmin && (
                      <>
                        <Link
                          href={`/personnel/${p.id}/edit`}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors active:scale-95"
                          title="แก้ไข (Admin)"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDeleteRequest(p)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                          title="ลบข้อมูล (Admin)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
