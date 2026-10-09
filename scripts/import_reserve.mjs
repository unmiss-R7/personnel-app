import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

function excelDateToISO(serial) {
  if (!serial || isNaN(serial)) return null;
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function normalizePhone(val) {
  if (!val) return null;
  const digits = String(val).replace(/[^0-9]/g, '');
  if (digits.length === 9) return '0' + digits;
  if (digits.length === 10) return digits;
  return digits;
}

function normalizeBlood(val) {
  if (!val) return 'O';
  const s = String(val).trim();
  if (s === 'โอ' || s === 'O' || s === 'o') return 'O';
  if (s === 'เอ' || s === 'A' || s === 'a') return 'A';
  if (s === 'บี' || s === 'B' || s === 'b') return 'B';
  if (s === 'เอบี' || s === 'AB' || s === 'ab') return 'AB';
  return s;
}

function extractGoogleDriveId(u) {
  if (!u || typeof u !== 'string') return null;
  const match = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

async function downloadDriveImage(driveUrl) {
  const fileId = extractGoogleDriveId(driveUrl);
  if (!fileId) return null;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const res = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (contentType.includes('text/html') || buffer.length < 500) {
      return null;
    }

    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';

    return { buffer, contentType, extension };
  } catch {
    return null;
  }
}

async function uploadToSupabaseStorage(bucket, filePath, buffer, contentType) {
  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    });
    if (res.ok) {
      return `${url}/storage/v1/object/public/${bucket}/${filePath}`;
    }
  } catch {}
  return null;
}

async function run() {
  const wb = XLSX.readFile('personneldata (5).xlsx');
  const sheet = wb.Sheets['สำรอง'];
  const reserveRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Processing ${reserveRows.length} rows from สำรอง...`);

  const records = [];

  for (let j = 0; j < reserveRows.length; j++) {
    const r = reserveRows[j];
    const rawSeq = String(r['ลำดับ'] || `ส${j + 1}`);
    const seqNum = 1000 + (parseInt(rawSeq.replace(/\D/g, ''), 10) || (j + 1));
    const rankTh = String(r['ยศ – ชื่อ,นามสกุล'] || '').trim();
    const firstNameTh = String(r['__EMPTY'] || '').trim();
    const lastNameTh = String(r['__EMPTY_1'] || '').trim();
    const fullName = String(r['fullname'] || `${rankTh} ${firstNameTh} ${lastNameTh}`).trim();

    if (!fullName && !firstNameTh) continue;

    const citizenId = r['หมายเลขประชาชน'] ? String(r['หมายเลขประชาชน']).replace(/[^0-9]/g, '') : null;
    const militaryId = r['หมายเลขประจำตัว'] ? String(r['หมายเลขประจำตัว']).replace(/[^0-9]/g, '') : null;

    let finalPhotoUrl = null;
    const driveLink = r['รูปภาพ'];
    if (driveLink && typeof driveLink === 'string' && driveLink.includes('drive.google.com')) {
      const imgData = await downloadDriveImage(driveLink);
      if (imgData) {
        const fileExt = imgData.extension;
        const storagePath = `avatars/reserve_${rawSeq}_${citizenId || militaryId || j + 1}.${fileExt}`;
        finalPhotoUrl = await uploadToSupabaseStorage('personnel-avatars', storagePath, imgData.buffer, imgData.contentType);
      }
    }

    records.push({
      seq_no: seqNum,
      service_code: rawSeq,
      rank_th: rankTh || null,
      first_name_th: firstNameTh || null,
      last_name_th: lastNameTh || null,
      full_name_th: fullName,
      rank_en: r['THAI-US ARMY RANKS'] ? String(r['THAI-US ARMY RANKS']).trim() : null,
      first_name_en: r['__EMPTY_2'] ? String(r['__EMPTY_2']).trim() : null,
      last_name_en: r['__EMPTY_3'] ? String(r['__EMPTY_3']).trim() : null,
      military_id: militaryId,
      citizen_id: citizenId,
      regular_position: r['ตำแหน่งปกติ'] ? String(r['ตำแหน่งปกติ']).trim() : null,
      duty_status: 'ช่วยราชการ',
      salary_step: r['ชั้นเงินเดือน'] ? String(r['ชั้นเงินเดือน']).trim() : null,
      blood_group: normalizeBlood(r['กลุ่มเลือด']),
      phone_number: normalizePhone(r['เบอร์ติดต่อ']),
      department: 'กำลังพลสำรอง',
      birth_date: excelDateToISO(r['วัน เดือน ปี เกิด']),
      photo_url: finalPhotoUrl,
      custom_fields: {
        reserve_code: rawSeq,
        notes: r['หมายเหตุ'] ? String(r['หมายเหตุ']).trim() : null,
      },
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`Inserting ${records.length} records into Supabase...`);
  const insertRes = await fetch(`${url}/rest/v1/personnel`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(records)
  });

  console.log('Insert status:', insertRes.status);
  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error('Insert error:', errText);
  } else {
    console.log('Successfully inserted all reserve personnel!');
  }
}

run();
