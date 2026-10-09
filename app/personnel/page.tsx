'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Download, 
  UserPlus, 
  FileSpreadsheet, 
  RotateCcw,
  Users,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import PersonnelTable from '@/components/PersonnelTable';
import PersonnelCard from '@/components/PersonnelCard';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { personnelService } from '@/lib/personnelService';
import { Personnel, splitFullNameTh, formatFullNameTh } from '@/types/personnel';
import { useAuth } from '@/context/AuthContext';

export default function PersonnelDirectoryPage() {
  const { isAdmin } = useAuth();
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default to 'card' on mobile, 'table' on desktop
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilters, setShowFilters] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterRank, setFilterRank] = useState('ALL');
  const [filterDutyStatus, setFilterDutyStatus] = useState<string>('ALL');

  // Delete state
  const [targetPersonnel, setTargetPersonnel] = useState<Personnel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const data = await personnelService.getAll();
      setPersonnelList(data);
    } catch (err) {
      console.error('Error fetching personnel list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unmiss_view_mode') as 'card' | 'table' | null;
      if (saved === 'card' || saved === 'table') {
        setViewMode(saved);
      } else {
        setViewMode('card');
      }
    }
  }, []);

  const handleSetViewMode = (mode: 'card' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('unmiss_view_mode', mode);
    } catch {}
  };

  // Filter options lists
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    personnelList.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set).sort();
  }, [personnelList]);

  const rankOptions = useMemo(() => {
    const set = new Set<string>();
    personnelList.forEach((p) => {
      if (p.rank_en) set.add(p.rank_en);
    });
    return Array.from(set).sort();
  }, [personnelList]);

  // Filtered personnel calculation
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const termDigits = term.replace(/[^0-9]/g, '');

    return personnelList.filter((p) => {
      const pFull = String(p.full_name_th || '').toLowerCase();
      const pRank = String(p.rank_th || '').toLowerCase();
      const pFirst = String(p.first_name_th || '').toLowerCase();
      const pLast = String(p.last_name_th || '').toLowerCase();
      const pNick = String(p.nickname || '').toLowerCase();
      const pFirstEn = String(p.first_name_en || '').toLowerCase();
      const pLastEn = String(p.last_name_en || '').toLowerCase();
      const pMil = String(p.military_id || '').toLowerCase();
      const pCit = String(p.citizen_id || '').replace(/[^0-9]/g, '');
      const pPhone = String(p.phone_number || '');

      const matchesSearch =
        !term ||
        pFull.includes(term) ||
        pRank.includes(term) ||
        pFirst.includes(term) ||
        pLast.includes(term) ||
        pNick.includes(term) ||
        pFirstEn.includes(term) ||
        pLastEn.includes(term) ||
        pMil.includes(term) ||
        (Boolean(termDigits) && pCit.includes(termDigits)) ||
        pPhone.includes(term);

      const matchesDept =
        filterDepartment === 'ALL' || p.department === filterDepartment;

      const matchesRank =
        filterRank === 'ALL' || p.rank_en === filterRank;

      const matchesDuty =
        filterDutyStatus === 'ALL' || p.duty_status === filterDutyStatus;

      return matchesSearch && matchesDept && matchesRank && matchesDuty;
    });
  }, [personnelList, searchTerm, filterDepartment, filterRank, filterDutyStatus]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDepartment('ALL');
    setFilterRank('ALL');
    setFilterDutyStatus('ALL');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    filterDepartment !== 'ALL' || 
    filterRank !== 'ALL' ||
    filterDutyStatus !== 'ALL';

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (personnelList.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    // 1. Sheet 1: Exact Supabase Table Columns (Separated individual columns)
    const supabaseRows = filteredList.map((p) => {
      const split = splitFullNameTh(p.full_name_th || '');
      const rank_th = p.rank_th || split.rank_th || '';
      const first_name_th = p.first_name_th || split.first_name_th || '';
      const last_name_th = p.last_name_th || split.last_name_th || '';
      const full_name_th = p.full_name_th || formatFullNameTh(rank_th, first_name_th, last_name_th) || '';

      return {
        id: p.id || '',
        service_code: p.service_code || '',
        seq_no: p.seq_no ?? '',
        rank_th: rank_th,
        first_name_th: first_name_th,
        last_name_th: last_name_th,
        full_name_th: full_name_th,
        nickname: p.nickname || '',
        rank_en: p.rank_en || '',
        first_name_en: p.first_name_en || '',
        last_name_en: p.last_name_en || '',
        military_id: p.military_id || '',
        citizen_id: p.citizen_id || '',
        field_position: p.field_position || '',
        regular_position: p.regular_position || '',
        duty_status: p.duty_status || '',
        salary_step: p.salary_step || '',
        blood_group: p.blood_group || '',
        phone_number: p.phone_number || '',
        department: p.department || '',
        religion: p.religion || '',
        birth_date: p.birth_date || '',
        passport_no: p.passport_no || '',
        photo_url: p.photo_url || '',
        gender: p.gender || p.custom_fields?.gender || '',
        age: p.age !== undefined && p.age !== null ? p.age : (p.custom_fields?.age ?? ''),
        email: p.email || p.custom_fields?.email || '',
        line_id: p.line_id || p.custom_fields?.line_id || '',
        affiliation: p.affiliation || p.custom_fields?.affiliation || '',
        commander: p.commander || p.custom_fields?.commander || '',
        rank_date: p.rank_date || p.custom_fields?.rank_date || '',
        personnel_category: p.personnel_category || p.custom_fields?.personnel_category || '',
        reserve_code: p.reserve_code || p.custom_fields?.reserve_code || '',
        notes: p.notes || p.custom_fields?.notes || '',
      };
    });

    // 2. Sheet 2: Thai Report Format with every single field separated and labeled in Thai
    const thaiReportRows = filteredList.map((p) => {
      const split = splitFullNameTh(p.full_name_th || '');
      const rank_th = p.rank_th || split.rank_th || '';
      const first_name_th = p.first_name_th || split.first_name_th || '';
      const last_name_th = p.last_name_th || split.last_name_th || '';
      const full_name_th = p.full_name_th || formatFullNameTh(rank_th, first_name_th, last_name_th) || '';

      return {
        'ลำดับ (No)': p.seq_no ?? '',
        'รหัสกำลังพล / PKF ID': p.service_code || '',
        'ยศ (ไทย)': rank_th,
        'ชื่อ (ไทย)': first_name_th,
        'นามสกุล (ไทย)': last_name_th,
        'ยศ ชื่อ-นามสกุล (ไทย)': full_name_th,
        'ชื่อเล่น': p.nickname || '',
        'RANK (EN)': p.rank_en || '',
        'NAME (EN)': p.first_name_en || '',
        'LASTNAME (EN)': p.last_name_en || '',
        'หมายเลขประจำตัวทหาร': p.military_id || '',
        'หมายเลขประชาชน': p.citizen_id || '',
        'หนังสือเดินทาง (PASSPORT)': p.passport_no || '',
        'ส่วนงาน / กองร้อย': p.department || '',
        'ตำแหน่งปกติ': p.regular_position || '',
        'ตำแหน่งในสนาม': p.field_position || '',
        'สังกัดเหล่าทัพ (ทบ./ทท./ทร.)': p.duty_status || '',
        'สังกัดเดิม': p.affiliation || p.custom_fields?.affiliation || '',
        'ผู้บังคับบัญชา': p.commander || p.custom_fields?.commander || '',
        'ประเภทกำลังพล': p.personnel_category || p.custom_fields?.personnel_category || '',
        'ยศปัจจุบันเมื่อ': p.rank_date || p.custom_fields?.rank_date || '',
        'ขั้นเงินเดือน': p.salary_step || '',
        'กลุ่มเลือด': p.blood_group || '',
        'เบอร์ติดต่อ': p.phone_number || '',
        'อีเมล': p.email || p.custom_fields?.email || '',
        'Line ID': p.line_id || p.custom_fields?.line_id || '',
        'เพศ': p.gender || p.custom_fields?.gender || '',
        'อายุ': p.age !== undefined && p.age !== null ? p.age : (p.custom_fields?.age ?? ''),
        'ศาสนา': p.religion || '',
        'วัน เดือน ปี เกิด': p.birth_date || '',
        'รหัสกำลังพลสำรอง': p.reserve_code || p.custom_fields?.reserve_code || '',
        'หมายเหตุ': p.notes || p.custom_fields?.notes || '',
        'ลิงก์รูปถ่าย': p.photo_url || '',
        'รหัสประจำตัว (UUID)': p.id || '',
      };
    });

    const workbook = XLSX.utils.book_new();

    // Sheet 1: personnel (Supabase 1:1 format)
    const wsSupabase = XLSX.utils.json_to_sheet(supabaseRows);
    XLSX.utils.book_append_sheet(workbook, wsSupabase, 'personnel');

    // Sheet 2: รายงานทำเนียบกำลังพล (Thai report)
    const wsThai = XLSX.utils.json_to_sheet(thaiReportRows);
    XLSX.utils.book_append_sheet(workbook, wsThai, 'รายงานทำเนียบกำลังพล');

    const todayStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `ทำเนียบกำลังพล_Unmiss_R7_Supabase_${todayStr}.xlsx`);
  };

  // Delete Handler (Admin Only)
  const handleDeleteConfirm = async () => {
    if (!targetPersonnel || !isAdmin) return;
    setIsDeleting(true);
    try {
      await personnelService.delete(targetPersonnel.id);
      setPersonnelList((prev) => prev.filter((p) => p.id !== targetPersonnel.id));
      setTargetPersonnel(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-slate-800 flex-shrink-0" />
            <span>ทำเนียบกำลังพล Unmiss R7</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            ค้นหา ตรวจสอบข้อมูล และโทรติดต่อได้ทันที
          </p>
        </div>

        {/* Action Buttons: Conditioned on Role (Admin Only) */}
        {isAdmin && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold shadow-xs transition-all active:scale-95 flex-shrink-0"
            >
              <Download className="w-4.5 h-4.5 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            <Link
              href="/personnel/import"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold shadow-xs transition-all flex-shrink-0"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" />
              <span>นำเข้า Excel</span>
            </Link>
            <Link
              href="/personnel/new"
              className="inline-flex items-center space-x-2 px-4.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black shadow-xs transition-all active:scale-95 flex-shrink-0"
            >
              <UserPlus className="w-4.5 h-4.5 text-amber-400" />
              <span>เพิ่มกำลังพล</span>
            </Link>
          </div>
        )}
      </div>

      {/* Sticky Mobile Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 sticky top-18 z-30">
        <div className="flex items-center gap-2.5">
          {/* Instant Search Input */}
          <div className="relative flex-1">
            <Search className="w-5.5 h-5.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา: ชื่อ, เลขทหาร, เลขประชาชน, เบอร์..."
              className="w-full pl-12 pr-10 py-3 sm:py-3.5 rounded-2xl border border-slate-200 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/70 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-sm font-bold flex items-center space-x-1.5 transition-all active:scale-95 ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
            title="ตัวกรองข้อมูล"
          >
            <Filter className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            )}
          </button>

          {/* Table / Card View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleSetViewMode('card')}
              className={`p-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองการ์ด (Card View)"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              className={`p-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองตาราง (Table View)"
            >
              <List className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">ตาราง</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-slate-600 truncate flex-wrap gap-1.5">
              <span className="font-semibold">กำลังกรอง:</span>
              {filterDepartment !== 'ALL' && (
                <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-xl font-bold truncate">
                  {filterDepartment}
                </span>
              )}
              {filterRank !== 'ALL' && (
                <span className="bg-slate-100 text-slate-900 px-3 py-1 rounded-xl font-bold">
                  {filterRank}
                </span>
              )}
              {filterDutyStatus !== 'ALL' && (
                <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl font-bold">
                  สังกัด: {filterDutyStatus}
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 flex-shrink-0 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ล้างตัวกรอง</span>
            </button>
          </div>
        )}

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 border-t border-slate-100 animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">สังกัดเหล่าทัพ</label>
              <select
                value={filterDutyStatus}
                onChange={(e) => setFilterDutyStatus(e.target.value)}
                className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">สังกัดทั้งหมด (All)</option>
                <option value="ทบ.">ทบ. (กองทัพบก)</option>
                <option value="ทท.">ทท. (กองบัญชาการกองทัพไทย)</option>
                <option value="ทร.">ทร. (กองทัพเรือ)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">ส่วนงาน / ฝ่าย / ตอน</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">ทั้งหมดทุกส่วนงาน</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1.5 text-sm sm:text-base">ชั้นยศ (Rank EN)</label>
              <select
                value={filterRank}
                onChange={(e) => setFilterRank(e.target.value)}
                className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">ทุกชั้นยศ</option>
                {rankOptions.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary Status Counter */}
      <div className="flex items-center justify-between text-sm sm:text-base text-slate-600 px-1 font-medium">
        <span>
          พบกำลังพล <strong className="text-slate-900 font-black">{filteredList.length}</strong> นาย (ทั้งหมด {personnelList.length} นาย)
        </span>
        {hasActiveFilters && (
          <span className="text-amber-800 font-bold text-xs sm:text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            ตัวกรองทำงานอยู่
          </span>
        )}
      </div>

      {/* Content Rendering: Mobile Card View (Default) or Table */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
          <p className="text-xs sm:text-sm text-gray-400">กำลังโหลดข้อมูลกำลังพล...</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredList.map((p) => (
            <PersonnelCard key={p.id} personnel={p} />
          ))}
          {filteredList.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl border border-gray-200 p-10 text-center text-gray-500 text-sm">
              ไม่พบข้อมูลกำลังพลตามคำค้นหา
            </div>
          )}
        </div>
      ) : (
        <PersonnelTable
          personnelList={filteredList}
          onDeleteRequest={(p) => setTargetPersonnel(p)}
          isAdmin={isAdmin}
        />
      )}

      {/* Delete Confirmation Modal (Admin only) */}
      {isAdmin && (
        <DeleteConfirmModal
          isOpen={Boolean(targetPersonnel)}
          name={targetPersonnel?.full_name_th || ''}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTargetPersonnel(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
