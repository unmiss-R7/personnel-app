import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';
import path from 'path';

const excelPath = path.resolve(process.cwd(), 'personneldata (5).xlsx');
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['บรรจุ'];
const rows = XLSX.utils.sheet_to_json(sheet);

function excelDateToISO(serial) {
  if (!serial) return null;
  if (typeof serial === 'string') {
    const s = serial.trim();
    if (s.includes('-') || s.includes('/')) return s;
    serial = Number(s);
  }
  if (isNaN(serial)) return null;
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function normalizePhone(val) {
  if (!val) return '';
  const digits = String(val).replace(/[^0-9]/g, '');
  if (digits.length === 9) return '0' + digits;
  if (digits.length === 10) return digits;
  return digits;
}

function normalizeBlood(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (s === 'โอ' || s === 'O' || s === 'o') return 'O';
  if (s === 'เอ' || s === 'A' || s === 'a') return 'A';
  if (s === 'บี' || s === 'B' || s === 'b') return 'B';
  if (s === 'เอบี' || s === 'AB' || s === 'ab') return 'AB';
  return s;
}

function driveToLh3(url) {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

const personnelList = rows.map((row, idx) => {
  const seq_no = Number(row['ลำดับ'] || idx + 1);
  const fullName = String(row['fullname'] || `${row['ยศ'] || ''} ${row['ชื่อ'] || ''} ${row['สกุล'] || ''}`).trim();
  const serviceCode = row['UN ID'] ? String(row['UN ID']).trim() : `PKF-THAI-${String(seq_no).padStart(5, '0')}`;
  const citizenId = row['หมายเลขประชาชน'] ? String(row['หมายเลขประชาชน']).replace(/[^0-9]/g, '') : '';
  const militaryId = row['หมายเลขประจำตัว'] ? String(row['หมายเลขประจำตัว']).replace(/[^0-9]/g, '') : '';
  const photoUrl = driveToLh3(row['รูปภาพ']);

  return {
    id: `unmiss-${String(seq_no).padStart(4, '0')}`,
    seq_no,
    service_code: serviceCode,
    rank_th: row['ยศ'] ? String(row['ยศ']).trim() : '',
    first_name_th: row['ชื่อ'] ? String(row['ชื่อ']).trim() : '',
    last_name_th: row['สกุล'] ? String(row['สกุล']).trim() : '',
    full_name_th: fullName,
    nickname: row['ชื่อเล่น'] ? String(row['ชื่อเล่น']).trim() : '',
    rank_en: row['Rank'] ? String(row['Rank']).trim() : '',
    first_name_en: row['Name'] ? String(row['Name']).trim() : '',
    last_name_en: row['Lastname'] ? String(row['Lastname']).trim() : '',
    military_id: militaryId,
    citizen_id: citizenId,
    field_position: row['ตำแหน่งในสนาม'] ? String(row['ตำแหน่งในสนาม']).trim() : '',
    regular_position: row['ตำแหน่งปกติ'] ? String(row['ตำแหน่งปกติ']).trim() : '',
    duty_status: 'บรรจุ',
    salary_step: row['ชั้นเงินเดือน'] ? String(row['ชั้นเงินเดือน']).trim() : '',
    blood_group: normalizeBlood(row['กลุ่มเลือด']),
    phone_number: normalizePhone(row[' ']),
    department: row['ส่วนงาน'] ? String(row['ส่วนงาน']).trim() : 'กองบังคับการกองร้อย',
    religion: row['ศาสนา'] ? String(row['ศาสนา']).trim() : '',
    birth_date: excelDateToISO(row['วัน เดือน ปี เกิด']) || '',
    passport_no: row['PASSPORT'] ? String(row['PASSPORT']).trim() : '',
    photo_url: photoUrl,
    custom_fields: {
      line_id: row['Line ID'] ? String(row['Line ID']).trim() : '',
      email: row['Email'] ? String(row['Email']).trim() : '',
      commander: row['ผู้บังคับบัญชา'] ? String(row['ผู้บังคับบัญชา']).trim() : '',
      age: row['อายุ'] ? Number(row['อายุ']) : '',
      gender: row['เพศ'] ? String(row['เพศ']).trim() : '',
      personnel_category: row['ประเภท'] ? String(row['ประเภท']).trim() : '',
      notes: row['หมายเหตุ'] ? String(row['หมายเหตุ']).trim() : '',
      affiliation: row['สังกัด'] ? String(row['สังกัด']).trim() : '',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

const tsContent = `import { Personnel, FieldDefinition } from '@/types/personnel';

export const INITIAL_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: 'f-1',
    field_key: 'emergency_contact',
    field_label: 'ผู้ติดต่อฉุกเฉิน',
    field_type: 'text',
    is_active: true,
  },
  {
    id: 'f-2',
    field_key: 'commander',
    field_label: 'ผู้บังคับบัญชา',
    field_type: 'text',
    is_active: true,
  },
  {
    id: 'f-3',
    field_key: 'line_id',
    field_label: 'Line ID',
    field_type: 'text',
    is_active: true,
  },
  {
    id: 'f-4',
    field_key: 'email',
    field_label: 'อีเมล',
    field_type: 'text',
    is_active: true,
  },
];

export const INITIAL_PERSONNEL: Personnel[] = ${JSON.stringify(personnelList, null, 2)};
`;

fs.writeFileSync(path.resolve(process.cwd(), 'lib/mockData.ts'), tsContent, 'utf8');
console.log(`✅ อัปเดต lib/mockData.ts สำเร็จ: มีกำลังพลทั้งหมด ${personnelList.length} นาย`);
