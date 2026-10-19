'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Loader2, 
  Trash2,
  Table,
  Info,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminOnlyGuard from '@/components/AdminOnlyGuard';
import { personnelService } from '@/lib/personnelService';
import { Personnel, splitFullNameTh, formatFullNameTh } from '@/types/personnel';

export default function ExcelImportPage() {
  return (
    <AdminOnlyGuard>
      <ExcelImportComponent />
    </AdminOnlyGuard>
  );
}

// Helper to parse dates in various Excel formats (serial number, DD/MM/YYYY, YYYY-MM-DD)
function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  if (!s) return null;

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = parseInt(dmyMatch[3], 10);
    if (year > 2400) year -= 543; // Buddhist era to CE
    return `${year}-${month}-${day}`;
  }

  // Excel serial date number
  const num = Number(s);
  if (!isNaN(num) && num > 1000 && num < 100000) {
    const utcDays = Math.floor(num - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return s;
}

// Helper to normalize phone number
function normalizePhone(val: any): string {
  if (!val) return '';
  const digits = String(val).replace(/[^0-9]/g, '');
  if (digits.length === 9) return '0' + digits;
  return String(val).trim();
}

// Helper to normalize blood group
function normalizeBlood(val: any): string {
  if (!val) return 'O';
  const s = String(val).trim().toUpperCase();
  if (s === 'โอ' || s === 'O') return 'O';
  if (s === 'เอ' || s === 'A') return 'A';
  if (s === 'บี' || s === 'B') return 'B';
  if (s === 'เอบี' || s === 'AB') return 'AB';
  return s || 'O';
}

// Helper for extracting strings with flexible key matching
function getVal(row: any, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

function ExcelImportComponent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<Array<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Download Template Excel (.xlsx) matching exact Supabase database schema
  const handleDownloadTemplate = () => {
    // Sheet 1: แบบฟอร์มภาษาไทย (ตามฐานข้อมูล Supabase)
    const thaiTemplateData = [
      {
        'ลำดับ (No)': 1,
        'รหัสกำลังพล / PKF ID': 'PKF-THAI-00001',
        'ยศ (ไทย)': 'พ.ท.',
        'ชื่อ (ไทย)': 'สมชาย',
        'นามสกุล (ไทย)': 'รักชาติ',
        'ยศ ชื่อ-นามสกุล (ไทย)': 'พ.ท. สมชาย รักชาติ',
        'ชื่อเล่น': 'ชาย',
        'RANK (EN)': 'LTC',
        'NAME (EN)': 'SOMCHAI',
        'LASTNAME (EN)': 'RAKCHART',
        'หมายเลขประจำตัวทหาร': '1399900881',
        'หมายเลขประชาชน': '1-1002-99887-12-3',
        'หนังสือเดินทาง (PASSPORT)': 'AA1234567',
        'ส่วนงาน / กองร้อย': 'บก.ร้อย',
        'ตำแหน่งปกติ': 'ผบ.ร้อย',
        'ตำแหน่งในสนาม': 'ผบ.ร้อย.ช่าง',
        'สังกัดเหล่าทัพ (ทบ./ทท./ทร.)': 'ทบ.',
        'สังกัดเดิม': 'กช.',
        'ผู้บังคับบัญชา': 'ผบ.กกล.เฉพาะกิจ',
        'ประเภทกำลังพล': 'สัญญาบัตร',
        'ยศปัจจุบันเมื่อ': '2022-10-01',
        'ขั้นเงินเดือน': 'น.๔/๑๙.๕',
        'กลุ่มเลือด': 'O',
        'เบอร์ติดต่อ': '089-111-2233',
        'อีเมล': 'somchai@example.com',
        'Line ID': 'somchai_line',
        'เพศ': 'ชาย',
        'อายุ': 42,
        'ศาสนา': 'พุทธ',
        'วัน เดือน ปี เกิด': '1984-05-20',
        'รหัสกำลังพลสำรอง': '',
        'หมายเหตุ': 'กำลังพลหลัก',
        'ลิงก์รูปถ่าย': '',
      },
      {
        'ลำดับ (No)': 2,
        'รหัสกำลังพล / PKF ID': 'PKF-THAI-00002',
        'ยศ (ไทย)': 'จ.ส.อ.',
        'ชื่อ (ไทย)': 'สมศักดิ์',
        'นามสกุล (ไทย)': 'มั่นคง',
        'ยศ ชื่อ-นามสกุล (ไทย)': 'จ.ส.อ. สมศักดิ์ มั่นคง',
        'ชื่อเล่น': 'ศักดิ์',
        'RANK (EN)': 'SGM',
        'NAME (EN)': 'SOMSAK',
        'LASTNAME (EN)': 'MANKHONG',
        'หมายเลขประจำตัวทหาร': '1400201234',
        'หมายเลขประชาชน': '3-1005-00123-45-6',
        'หนังสือเดินทาง (PASSPORT)': 'AA7654321',
        'ส่วนงาน / กองร้อย': 'กองร้อยทหารช่างก่อสร้าง',
        'ตำแหน่งปกติ': 'จ่ากองร้อย',
        'ตำแหน่งในสนาม': 'หน.ชป.ช่าง',
        'สังกัดเหล่าทัพ (ทบ./ทท./ทร.)': 'ทบ.',
        'สังกัดเดิม': 'ช.พัน.๑๑๑',
        'ผู้บังคับบัญชา': 'ผบ.ร้อย.ช่าง',
        'ประเภทกำลังพล': 'ประทวน',
        'ยศปัจจุบันเมื่อ': '2023-04-01',
        'ขั้นเงินเดือน': 'ป.๓/๒๒.๐',
        'กลุ่มเลือด': 'B',
        'เบอร์ติดต่อ': '081-234-5678',
        'อีเมล': 'somsak@example.com',
        'Line ID': 'somsak_line',
        'เพศ': 'ชาย',
        'อายุ': 38,
        'ศาสนา': 'พุทธ',
        'วัน เดือน ปี เกิด': '1988-11-15',
        'รหัสกำลังพลสำรอง': '',
        'หมายเหตุ': '',
        'ลิงก์รูปถ่าย': '',
      },
      {
        'ลำดับ (No)': 3,
        'รหัสกำลังพล / PKF ID': 'PKF-THAI-00003',
        'ยศ (ไทย)': 'ร.อ.หญิง',
        'ชื่อ (ไทย)': 'กัญญา',
        'นามสกุล (ไทย)': 'ใจดี',
        'ยศ ชื่อ-นามสกุล (ไทย)': 'ร.อ.หญิง กัญญา ใจดี',
        'ชื่อเล่น': 'ก้อย',
        'RANK (EN)': 'CPT',
        'NAME (EN)': 'KANYA',
        'LASTNAME (EN)': 'JAIDEE',
        'หมายเลขประจำตัวทหาร': '1410509876',
        'หมายเลขประชาชน': '1-1008-88776-54-3',
        'หนังสือเดินทาง (PASSPORT)': 'AA9876543',
        'ส่วนงาน / กองร้อย': 'หมวดพยาบาล',
        'ตำแหน่งปกติ': 'นายทหารพยาบาล',
        'ตำแหน่งในสนาม': 'หน.มว.พยาบาล',
        'สังกัดเหล่าทัพ (ทบ./ทท./ทร.)': 'ทบ.',
        'สังกัดเดิม': 'พบ.',
        'ผู้บังคับบัญชา': 'ผบ.ร้อย',
        'ประเภทกำลังพล': 'สัญญาบัตร',
        'ยศปัจจุบันเมื่อ': '2024-01-15',
        'ขั้นเงินเดือน': 'น.๒/๑๒.๕',
        'กลุ่มเลือด': 'A',
        'เบอร์ติดต่อ': '086-999-8877',
        'อีเมล': 'kanya@example.com',
        'Line ID': 'kanya_med',
        'เพศ': 'หญิง',
        'อายุ': 34,
        'ศาสนา': 'พุทธ',
        'วัน เดือน ปี เกิด': '1992-03-10',
        'รหัสกำลังพลสำรอง': 'ส1',
        'หมายเหตุ': 'กำลังพลสายแพทย์',
        'ลิงก์รูปถ่าย': '',
      }
    ];

    // Sheet 2: Database Format (EN) matching exact Supabase column names
    const enTemplateData = thaiTemplateData.map((t) => ({
      seq_no: t['ลำดับ (No)'],
      service_code: t['รหัสกำลังพล / PKF ID'],
      rank_th: t['ยศ (ไทย)'],
      first_name_th: t['ชื่อ (ไทย)'],
      last_name_th: t['นามสกุล (ไทย)'],
      full_name_th: t['ยศ ชื่อ-นามสกุล (ไทย)'],
      nickname: t['ชื่อเล่น'],
      rank_en: t['RANK (EN)'],
      first_name_en: t['NAME (EN)'],
      last_name_en: t['LASTNAME (EN)'],
      military_id: t['หมายเลขประจำตัวทหาร'],
      citizen_id: t['หมายเลขประชาชน'],
      passport_no: t['หนังสือเดินทาง (PASSPORT)'],
      department: t['ส่วนงาน / กองร้อย'],
      regular_position: t['ตำแหน่งปกติ'],
      field_position: t['ตำแหน่งในสนาม'],
      duty_status: t['สังกัดเหล่าทัพ (ทบ./ทท./ทร.)'],
      affiliation: t['สังกัดเดิม'],
      commander: t['ผู้บังคับบัญชา'],
      personnel_category: t['ประเภทกำลังพล'],
      rank_date: t['ยศปัจจุบันเมื่อ'],
      salary_step: t['ขั้นเงินเดือน'],
      blood_group: t['กลุ่มเลือด'],
      phone_number: t['เบอร์ติดต่อ'],
      email: t['อีเมล'],
      line_id: t['Line ID'],
      gender: t['เพศ'],
      age: t['อายุ'],
      religion: t['ศาสนา'],
      birth_date: t['วัน เดือน ปี เกิด'],
      reserve_code: t['รหัสกำลังพลสำรอง'],
      notes: t['หมายเหตุ'],
      photo_url: t['ลิงก์รูปถ่าย'],
    }));

    const workbook = XLSX.utils.book_new();

    const setColWidths = (ws: XLSX.WorkSheet, rows: Record<string, any>[]) => {
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      ws['!cols'] = headers.map((key) => {
        let maxLen = key.length;
        for (let i = 0; i < rows.length; i++) {
          const val = rows[i][key];
          if (val !== null && val !== undefined) {
            const strLen = String(val).length;
            if (strLen > maxLen) maxLen = strLen;
          }
        }
        return { wch: Math.max(maxLen + 4, 12) };
      });
    };

    const wsThai = XLSX.utils.json_to_sheet(thaiTemplateData);
    setColWidths(wsThai, thaiTemplateData);
    XLSX.utils.book_append_sheet(workbook, wsThai, 'แบบฟอร์มนำเข้า (ภาษาไทย)');

    const wsEn = XLSX.utils.json_to_sheet(enTemplateData);
    setColWidths(wsEn, enTemplateData);
    XLSX.utils.book_append_sheet(workbook, wsEn, 'Database Format (EN)');

    XLSX.writeFile(workbook, 'Template_นำเข้าข้อมูลกำลังพล_Unmiss_R7_Supabase.xlsx');
  };

  // 2. Parse uploaded file with flexible header recognition
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rawRows.length === 0) {
        setErrorMsg('ไม่พบข้อมูลในไฟล์ Excel ที่เลือก');
        setIsProcessing(false);
        return;
      }

      // Column mapping normalizer matching all Supabase columns & Thai headers
      const mapped: Array<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>> = rawRows.map((row, idx) => {
        const seq_no = Number(getVal(row, 'ลำดับ (No)', 'ลำดับ', 'seq_no', 'No', 'No.', 'no')) || idx + 1;
        const service_code = getVal(row, 'รหัสกำลังพล / PKF ID', 'รหัสกำลังพล (Service Code)', 'รหัสกำลังพล', 'PKF ID', 'service_code', 'UN ID') || `PKF-THAI-${String(seq_no).padStart(5, '0')}`;
        
        const rawRankTh = getVal(row, 'ยศ (ไทย)', 'ยศ', 'rank_th');
        const rawFirstNameTh = getVal(row, 'ชื่อ (ไทย)', 'ชื่อ', 'first_name_th');
        const rawLastNameTh = getVal(row, 'นามสกุล (ไทย)', 'สกุล (ไทย)', 'นามสกุล', 'สกุล', 'last_name_th');
        const rawFullNameTh = getVal(row, 'ยศ ชื่อ-นามสกุล (ไทย)', 'ยศ ชื่อ-นามสกุล', 'ชื่อ-สกุล', 'full_name_th', 'fullname');

        const split = splitFullNameTh(rawFullNameTh);
        const rank_th = rawRankTh || split.rank_th || null;
        const first_name_th = rawFirstNameTh || split.first_name_th || null;
        const last_name_th = rawLastNameTh || split.last_name_th || null;
        const full_name_th = rawFullNameTh || formatFullNameTh(rank_th, first_name_th, last_name_th) || '';

        const nickname = getVal(row, 'ชื่อเล่น', 'nickname') || null;
        const rank_en = getVal(row, 'RANK (EN)', 'RANK', 'Rank', 'rank_en') || null;
        const first_name_en = getVal(row, 'NAME (EN)', 'NAME', 'Name', 'first_name_en') || null;
        const last_name_en = getVal(row, 'LASTNAME (EN)', 'LASTNAME', 'Lastname', 'last_name_en') || null;
        const military_id = getVal(row, 'หมายเลขประจำตัวทหาร', 'หมายเลขประจำตัว', 'เลขประจำตัวทหาร', 'military_id') || null;
        const citizen_id = getVal(row, 'หมายเลขประชาชน', 'เลขประจำตัวประชาชน', 'citizen_id') || null;
        const passport_no = getVal(row, 'หนังสือเดินทาง (PASSPORT)', 'หนังสือเดินทาง', 'PASSPORT', 'passport_no', 'passport') || null;
        const department = getVal(row, 'ส่วนงาน / กองร้อย', 'ส่วนงาน/กองร้อย', 'ส่วนงาน', 'กองร้อย', 'department') || null;
        const regular_position = getVal(row, 'ตำแหน่งปกติ', 'regular_position') || null;
        const field_position = getVal(row, 'ตำแหน่งในสนาม', 'ตำแหน่งสนาม', 'field_position') || null;
        const duty_status = getVal(row, 'สังกัดเหล่าทัพ (ทบ./ทท./ทร.)', 'สังกัดเหล่าทัพ', 'สังกัด', 'สถานะกำลังพล', 'duty_status') || 'ทบ.';
        const affiliation = getVal(row, 'สังกัดเดิม', 'หน่วยต้นสังกัด', 'affiliation') || null;
        const commander = getVal(row, 'ผู้บังคับบัญชา', 'commander') || null;
        const personnel_category = getVal(row, 'ประเภทกำลังพล', 'ประเภท', 'personnel_category') || null;
        const rank_date = parseExcelDate(getVal(row, 'ยศปัจจุบันเมื่อ', 'วันที่มีชั้นยศ', 'rank_date')) || null;
        const salary_step = getVal(row, 'ขั้นเงินเดือน', 'ชั้นเงินเดือน', 'salary_step') || null;
        const blood_group = normalizeBlood(getVal(row, 'กลุ่มเลือด', 'หมู่เลือด', 'blood_group'));
        const phone_number = normalizePhone(getVal(row, 'เบอร์ติดต่อ', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'phone_number', 'phone')) || null;
        const email = getVal(row, 'อีเมล', 'Email', 'email') || null;
        const line_id = getVal(row, 'Line ID', 'Line', 'line_id') || null;
        const gender = getVal(row, 'เพศ', 'gender') || null;
        const ageVal = getVal(row, 'อายุ', 'age');
        const age = ageVal ? Number(ageVal) : null;
        const religion = getVal(row, 'ศาสนา', 'religion') || 'พุทธ';
        const birth_date = parseExcelDate(getVal(row, 'วัน เดือน ปี เกิด', 'วันเกิด', 'birth_date')) || null;
        const reserve_code = getVal(row, 'รหัสกำลังพลสำรอง', 'กำลังพลสำรอง', 'reserve_code') || null;
        const notes = getVal(row, 'หมายเหตุ', 'notes') || null;
        const photo_url = getVal(row, 'ลิงก์รูปถ่าย', 'รูปภาพ', 'photo_url') || null;

        const custom_fields: Record<string, any> = {
          gender,
          age,
          email,
          line_id,
          affiliation,
          commander,
          rank_date,
          personnel_category,
          reserve_code,
          notes,
          ...(() => {
            if (row['custom_fields']) {
              try {
                return typeof row['custom_fields'] === 'object' ? row['custom_fields'] : JSON.parse(String(row['custom_fields']));
              } catch {
                return {};
              }
            }
            return {};
          })(),
        };

        return {
          seq_no,
          service_code,
          rank_th,
          first_name_th,
          last_name_th,
          full_name_th,
          nickname,
          rank_en,
          first_name_en,
          last_name_en,
          military_id,
          citizen_id,
          passport_no,
          department,
          regular_position,
          field_position,
          duty_status,
          affiliation,
          commander,
          personnel_category,
          rank_date,
          salary_step,
          blood_group,
          phone_number,
          email,
          line_id,
          gender,
          age,
          religion,
          birth_date,
          reserve_code,
          notes,
          photo_url,
          custom_fields,
        };
      });

      setParsedData(mapped);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบรูปแบบไฟล์ Excel หรือ CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Confirm bulk insert into Supabase / local
  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;

    // Filter out rows without valid name
    const validRows = parsedData.filter((r) => r.full_name_th && r.full_name_th.trim().length > 0);
    if (validRows.length === 0) {
      setErrorMsg('ไม่พบข้อมูลที่มีชื่อ-สกุลที่ถูกต้องในไฟล์');
      return;
    }

    setIsSubmitting(true);
    try {
      const count = await personnelService.bulkInsert(validRows);
      alert(`นำเข้าข้อมูลกำลังพลลงฐานข้อมูลสำเร็จทั้งหมด ${count || validRows.length} นาย`);
      router.push('/personnel');
    } catch (err: any) {
      console.error('Bulk insert error:', err);
      setErrorMsg(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setParsedData([]);
    setFileName('');
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/personnel"
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              <span>นำเข้าข้อมูลกำลังพลจาก Excel (.xlsx / .csv)</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-0.5 font-medium">
              แปลงข้อมูลจากสเปรดชีตและบันทึกลงฐานข้อมูล Supabase ทั้งหมด 33 ฟิลด์ตรงกันแบบ 100%
            </p>
          </div>
        </div>

        {/* Download Template Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm sm:text-base font-bold shadow-xs transition-all active:scale-95 hover:border-emerald-500"
        >
          <Download className="w-5 h-5 text-emerald-600" />
          <span>ดาวน์โหลดแม่แบบ Excel (ตรงกับฐานข้อมูล Supabase)</span>
        </button>
      </div>

      {/* Info Card: Database Fields Summary */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 text-slate-800 space-y-3">
        <div className="flex items-center space-x-2.5">
          <Info className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-black text-emerald-950">
            แม่แบบนำเข้าข้อมูลกำลังพลฉบับปรับปรุง (ตรงตามโครงสร้างฐานข้อมูล Supabase ครบ 33 ฟิลด์)
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
          ไฟล์แม่แบบประกอบด้วย 2 แผ่นงาน (Sheets): <strong>1) แบบฟอร์มนำเข้า (ภาษาไทย)</strong> สำหรับกรอกด้วยหัวตารางภาษาไทยที่คุ้นเคย และ <strong>2) Database Format (EN)</strong> ที่ใช้ชื่อคอลัมน์ตรงกับฐานข้อมูล Supabase โดยระบบรองรับการนำเข้าได้ทั้ง 2 รูปแบบอย่างแม่นยำ
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm font-semibold pt-1 text-emerald-900">
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="block text-slate-500 text-xs">ข้อมูลยศ-ชื่อ</span>
            ลำดับ, PKF ID, ยศ, ชื่อ, สกุล, ชื่อเล่น, Rank/Name EN, เลขทหาร, เลขประชาชน, หนังสือเดินทาง
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="block text-slate-500 text-xs">ข้อมูลสังกัด-ตำแหน่ง</span>
            ส่วนงาน/กองร้อย, ตำแหน่งปกติ, ตำแหน่งสนาม, สังกัดเหล่าทัพ, สังกัดเดิม, ผู้บังคับบัญชา, ประเภทกำลังพล
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="block text-slate-500 text-xs">ข้อมูลส่วนตัว-การแพทย์</span>
            วันเกิด, อายุ, เพศ, ศาสนา, กลุ่มเลือด, ขั้นเงินเดือน, ยศปัจจุบันเมื่อ, เบอร์ติดต่อ, อีเมล, Line ID
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100">
            <span className="block text-slate-500 text-xs">ข้อมูลเสริม-ระบบ</span>
            รหัสกำลังพลสำรอง, หมายเหตุ, ลิงก์รูปถ่าย (อัปโหลดอัตโนมัติ)
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            {fileName ? fileName : 'แตะเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
          </h3>
          <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-sm mx-auto font-medium">
            รองรับไฟล์ Microsoft Excel (.xlsx, .xls) หรือไฟล์ข้อความ Comma-Separated (.csv)
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm sm:text-base text-red-700 flex items-center space-x-2.5 font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Data Preview Table */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Table className="w-6 h-6 text-slate-700" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                ตัวอย่างข้อมูลที่ตรวจพบ ({parsedData.length} รายการ)
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>ล้างไฟล์</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>
                  {isSubmitting ? 'กำลังบันทึกลง Supabase...' : `ยืนยันนำเข้า ${parsedData.length} รายการ`}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[28rem] rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-100/90 border-b border-slate-200 text-xs font-black text-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">ลำดับ</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">รหัส PKF</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ยศ ชื่อ-นามสกุล (ไทย)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">RANK / NAME (EN)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">เลขประจำตัวทหาร / ประชาชน</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ตำแหน่ง (ปกติ / สนาม)</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">ส่วนงาน / กองร้อย</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">สังกัด / สังกัดเดิม</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">เลือด</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">เบอร์ติดต่อ / อีเมล / Line</th>
                  <th className="px-3.5 py-3 whitespace-nowrap text-center">เพศ / อายุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-2.5 text-center font-black text-slate-700">
                      {row.seq_no}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                      {row.service_code || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap text-base">
                      {row.full_name_th || <span className="text-red-500 font-semibold">ไม่มีชื่อ (ข้าม)</span>}
                      {row.nickname && <span className="text-slate-500 ml-1 font-medium text-xs">({row.nickname})</span>}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap text-xs">
                      {[row.rank_en, row.first_name_en, row.last_name_en].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap text-xs">
                      <div>ทหาร: {row.military_id || '-'}</div>
                      <div className="text-slate-400">ปชช: {row.citizen_id || '-'}</div>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-medium text-xs">
                      <div className="font-bold text-slate-900">{row.regular_position || '-'}</div>
                      {row.field_position && <div className="text-slate-500">สนาม: {row.field_position}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-medium text-xs">
                      {row.department || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800">
                        {row.duty_status || 'ทบ.'}
                      </span>
                      {row.affiliation && <div className="text-slate-400 mt-0.5">เดิม: {row.affiliation}</div>}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-black text-red-600 whitespace-nowrap text-xs">
                      <span className="inline-block w-6 h-6 leading-6 rounded-full bg-red-50 border border-red-200">
                        {row.blood_group || '-'}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap text-xs font-mono">
                      {row.phone_number && <div className="font-bold text-slate-900">{row.phone_number}</div>}
                      {row.email && <div className="text-slate-500">{row.email}</div>}
                      {row.line_id && <div className="text-emerald-600 font-sans">Line: {row.line_id}</div>}
                      {!row.phone_number && !row.email && !row.line_id && '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-slate-700 whitespace-nowrap text-xs">
                      <div>{row.gender || '-'}</div>
                      {row.age && <div className="text-slate-400">{row.age} ปี</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
