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
  Table
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

function ExcelImportComponent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<Array<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Download Template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ลำดับ (No)': 10,
        'ยศ ชื่อ-นามสกุล (ไทย)': 'ร.ต. สมชาย รักชาติ',
        'ชื่อเล่น': 'ชาย',
        'RANK (EN)': '2LT',
        'NAME (EN)': 'SOMCHAI',
        'LASTNAME (EN)': 'RAKCHART',
        'หมายเลขประจำตัวทหาร': '1399900881',
        'หมายเลขประชาชน': '1-1002-99887-12-3',
        'ตำแหน่งปกติ': 'นายทหารธุรการ',
        'ขั้นเงินเดือน': 'น.๑/๗.๕',
        'กลุ่มเลือด': 'O',
        'เบอร์ติดต่อ': '089-111-2233',
        'ส่วนงาน/กองร้อย': 'กองร้อยทหารช่างก่อสร้าง',
        'ศาสนา': 'พุทธ',
        'วัน เดือน ปี เกิด': '1996-05-20',
        'ลิงก์รูปถ่าย': '',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'แม่แบบนำเข้ากำลังพล');
    XLSX.writeFile(workbook, 'Template_นำเข้าข้อมูลกำลังพล_Unmiss_R7.xlsx');
  };

  // 2. Parse uploaded file
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

      // Column mapping normalizer
      const mapped: Array<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>> = rawRows.map((row, idx) => {
        const seq_no = Number(row['ลำดับ (No)'] || row['ลำดับ'] || row['seq_no'] || idx + 1);
        const service_code = String(row['รหัสกำลังพล (Service Code)'] || row['รหัสกำลังพล'] || row['service_code'] || `PKF-THAI-${String(seq_no).padStart(5, '0')}`).trim();
        const rawRankTh = String(row['ยศ (ไทย)'] || row['ยศ'] || row['rank_th'] || '').trim();
        const rawFirstNameTh = String(row['ชื่อ (ไทย)'] || row['ชื่อ'] || row['first_name_th'] || '').trim();
        const rawLastNameTh = String(row['สกุล (ไทย)'] || row['นามสกุล'] || row['last_name_th'] || '').trim();
        const rawFullNameTh = String(row['ยศ ชื่อ-นามสกุล (ไทย)'] || row['ยศ ชื่อ-นามสกุล'] || row['full_name_th'] || '').trim();

        const split = splitFullNameTh(rawFullNameTh);
        const rank_th = rawRankTh || split.rank_th || null;
        const first_name_th = rawFirstNameTh || split.first_name_th || null;
        const last_name_th = rawLastNameTh || split.last_name_th || null;
        const full_name_th = rawFullNameTh || formatFullNameTh(rank_th, first_name_th, last_name_th) || '';

        return {
          seq_no,
          service_code,
          rank_th,
          first_name_th,
          last_name_th,
          full_name_th,
          nickname: String(row['ชื่อเล่น'] || row['nickname'] || '').trim() || null,
          rank_en: String(row['RANK (EN)'] || row['rank_en'] || '').trim() || null,
          first_name_en: String(row['NAME (EN)'] || row['first_name_en'] || '').trim() || null,
          last_name_en: String(row['LASTNAME (EN)'] || row['last_name_en'] || '').trim() || null,
          military_id: String(row['หมายเลขประจำตัวทหาร'] || row['military_id'] || '').trim() || null,
          citizen_id: String(row['หมายเลขประชาชน'] || row['citizen_id'] || '').trim() || null,
          regular_position: String(row['ตำแหน่งปกติ'] || row['regular_position'] || '').trim() || null,
          field_position: String(row['ตำแหน่งในสนาม'] || row['field_position'] || '').trim() || null,
          duty_status: String(row['สังกัด'] || row['สังกัดเหล่าทัพ'] || row['สถานะกำลังพล'] || row['duty_status'] || 'ทบ.').trim() || 'ทบ.',
          salary_step: String(row['ขั้นเงินเดือน'] || row['salary_step'] || '').trim() || null,
          blood_group: String(row['กลุ่มเลือด'] || row['blood_group'] || 'O').trim() || null,
          phone_number: String(row['เบอร์ติดต่อ'] || row['phone_number'] || '').trim() || null,
          department: String(row['ส่วนงาน/กองร้อย'] || row['ส่วนงาน'] || row['department'] || '').trim() || null,
          religion: String(row['ศาสนา'] || row['religion'] || 'พุทธ').trim() || null,
          birth_date: String(row['วัน เดือน ปี เกิด'] || row['birth_date'] || '').trim() || null,
          passport_no: String(row['หนังสือเดินทาง (PASSPORT)'] || row['หนังสือเดินทาง'] || row['passport_no'] || '').trim() || null,
          photo_url: String(row['ลิงก์รูปถ่าย'] || row['photo_url'] || '').trim() || null,
          custom_fields: (() => {
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
    const validRows = parsedData.filter((r) => r.full_name_th.length > 0);
    if (validRows.length === 0) {
      setErrorMsg('ไม่มีข้อมูลที่มีชื่อ-สกุลที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      await personnelService.bulkInsert(validRows);
      alert(`นำเข้าข้อมูลกำลังพลสำเร็จทั้งหมด ${validRows.length} นาย`);
      router.push('/personnel');
    } catch (err) {
      console.error('Bulk insert error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20 sm:pb-8">
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
              แปลงข้อมูลจากสเปรดชีตและบันทึกลงฐานข้อมูลแบบ Bulk Insert
            </p>
          </div>
        </div>

        {/* Download Template Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm sm:text-base font-bold shadow-xs transition-all active:scale-95"
        >
          <Download className="w-5 h-5 text-emerald-600" />
          <span>ดาวน์โหลดแม่แบบ Excel</span>
        </button>
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
                  {isSubmitting ? 'กำลังบันทึกลงฐานข้อมูล...' : `ยืนยันนำเข้า ${parsedData.length} รายการ`}
                </span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-black text-slate-700 sticky top-0">
                <tr>
                  <th className="px-3.5 py-3 text-center">ลำดับ</th>
                  <th className="px-3.5 py-3">ยศ ชื่อ-นามสกุล</th>
                  <th className="px-3.5 py-3">RANK / NAME (EN)</th>
                  <th className="px-3.5 py-3">ตำแหน่ง</th>
                  <th className="px-3.5 py-3">ส่วนงาน</th>
                  <th className="px-3 py-3 text-center">เลือด</th>
                  <th className="px-3.5 py-3">เบอร์โทร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3.5 py-2.5 text-center font-black text-slate-700">
                      {row.seq_no}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap text-base">
                      {row.full_name_th || <span className="text-red-500">ไม่มีชื่อ (ข้าม)</span>}
                      {row.nickname && <span className="text-slate-500 ml-1 font-medium">({row.nickname})</span>}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap text-sm">
                      {row.rank_en} {row.first_name_en} {row.last_name_en}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-medium">
                      {row.regular_position || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap font-medium">
                      {row.department || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-black text-red-600 whitespace-nowrap">
                      {row.blood_group || '-'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-700 whitespace-nowrap font-medium">
                      {row.phone_number || '-'}
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
