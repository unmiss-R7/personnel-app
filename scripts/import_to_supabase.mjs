import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import fs from 'fs';
import path from 'path';

// Helper to load .env.local if exists
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

// CLI argument parsing
const args = process.argv.slice(2);
let argUrl = '';
let argKey = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) argUrl = args[i + 1];
  if (args[i] === '--key' && args[i + 1]) argKey = args[i + 1];
}

const rawUrl = argUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = argKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  console.error('\n❌ ข้อผิดพลาด: ไม่พบการตั้งค่า Supabase URL หรือ Key ในไฟล์ .env.local');
  console.error('กรุณาสร้างไฟล์ .env.local หรือส่งผ่านคำสั่ง:');
  console.error('  node scripts/import_to_supabase.mjs --url "https://xxxx.supabase.co" --key "eyJhbGciOi..."');
  console.error('หรือกำหนดใน .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...\n');
  process.exit(1);
}

// If passed via args and .env.local doesn't exist, create it
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath) && argUrl && argKey) {
  fs.writeFileSync(
    envLocalPath,
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}\n`,
    'utf8'
  );
  console.log('📝 บันทึกค่าลงใน .env.local เรียบร้อยแล้ว');
}

class DummyWS {}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: DummyWS },
});

// Helper for Excel date to YYYY-MM-DD
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

// Helper to normalize phone number
function normalizePhone(val) {
  if (!val) return '';
  const digits = String(val).replace(/[^0-9]/g, '');
  if (digits.length === 9) return '0' + digits;
  if (digits.length === 10) return digits;
  return digits;
}

// Helper to map blood group
function normalizeBlood(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (s === 'โอ' || s === 'O' || s === 'o') return 'O';
  if (s === 'เอ' || s === 'A' || s === 'a') return 'A';
  if (s === 'บี' || s === 'B' || s === 'b') return 'B';
  if (s === 'เอบี' || s === 'AB' || s === 'ab') return 'AB';
  return s;
}

// Helper to extract Google Drive file ID
function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function driveToLh3(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

// Download Google Drive image as Buffer
async function downloadDriveImage(driveUrl, retries = 3) {
  const fileId = extractGoogleDriveId(driveUrl);
  if (!fileId) return null;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      // Verify that this is actually an image and not an HTML error page
      if (contentType.includes('text/html') || buffer.length < 500) {
        throw new Error('Received HTML instead of image');
      }

      return {
        buffer,
        contentType: contentType.includes('png') ? 'image/png' : 'image/jpeg',
        extension: contentType.includes('png') ? 'png' : 'jpg',
      };
    } catch (err) {
      if (attempt === retries) {
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

// Upload image to Supabase Storage bucket
async function uploadToSupabaseStorage(bucketName, filePath, buffer, contentType) {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, buffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn(`    ⚠️  อัปโหลดรูปขึ้น Storage ล้มเหลว (${filePath}):`, err.message);
    return null;
  }
}

async function ensureBucket(bucketName) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets && buckets.some((b) => b.name === bucketName || b.id === bucketName);
    if (!exists) {
      console.log(`📦 กำลังสร้าง Storage bucket '${bucketName}'...`);
      await supabase.storage.createBucket(bucketName, { public: true });
    }
  } catch (err) {
    // If permission denied or bucket already exists, proceed
  }
}

async function runMigration() {
  console.log('=====================================================');
  console.log('🚀 เริ่มต้นกระบวนการนำเข้าข้อมูลบุคลากรเข้าสู่ Supabase');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('=====================================================\n');

  const excelPath = path.resolve(process.cwd(), 'personneldata (5).xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ ไม่พบไฟล์ ${excelPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const BUCKET_NAME = 'personnel-avatars';
  await ensureBucket(BUCKET_NAME);

  // 1. Process Sheet 'บรรจุ'
  const sheetName = 'บรรจุ';
  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`❌ ไม่พบ Sheet '${sheetName}' ในไฟล์`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  console.log(`📋 พบข้อมูลใน Sheet '${sheetName}' ทั้งหมด ${rows.length} รายการ\n`);

  const recordsToInsert = [];
  let photoSuccessCount = 0;
  let photoFailCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const seq_no = Number(row['ลำดับ'] || i + 1);
    const fullName = String(row['fullname'] || `${row['ยศ'] || ''} ${row['ชื่อ'] || ''} ${row['สกุล'] || ''}`).trim();
    const serviceCode = row['UN ID'] ? String(row['UN ID']).trim() : `PKF-THAI-${String(seq_no).padStart(5, '0')}`;
    const citizenId = row['หมายเลขประชาชน'] ? String(row['หมายเลขประชาชน']).replace(/[^0-9]/g, '') : null;
    const militaryId = row['หมายเลขประจำตัว'] ? String(row['หมายเลขประจำตัว']).replace(/[^0-9]/g, '') : null;

    process.stdout.write(`[${i + 1}/${rows.length}] กำลังประมวลผล: ลำดับที่ ${seq_no} - ${fullName}... `);

    // Image handling
    let finalPhotoUrl = null;
    const driveLink = row['รูปภาพ'];
    if (driveLink && typeof driveLink === 'string' && driveLink.includes('drive.google.com')) {
      const imgData = await downloadDriveImage(driveLink);
      if (imgData) {
        const fileExt = imgData.extension;
        const storagePath = `avatars/${String(seq_no).padStart(3, '0')}_${citizenId || militaryId || serviceCode}.${fileExt}`;
        const uploadedUrl = await uploadToSupabaseStorage(BUCKET_NAME, storagePath, imgData.buffer, imgData.contentType);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
          photoSuccessCount++;
        } else {
          finalPhotoUrl = driveToLh3(driveLink);
          photoFailCount++;
        }
      } else {
        finalPhotoUrl = driveToLh3(driveLink);
        photoFailCount++;
      }
    }

    const customFields = {
      line_id: row['Line ID'] ? String(row['Line ID']).trim() : null,
      email: row['Email'] ? String(row['Email']).trim() : null,
      commander: row['ผู้บังคับบัญชา'] ? String(row['ผู้บังคับบัญชา']).trim() : null,
      age: row['อายุ'] ? Number(row['อายุ']) : null,
      gender: row['เพศ'] ? String(row['เพศ']).trim() : null,
      personnel_category: row['ประเภท'] ? String(row['ประเภท']).trim() : null,
      notes: row['หมายเหตุ'] ? String(row['หมายเหตุ']).trim() : null,
      rank_date: row['ยศปัจจุบันเมื่อ'] ? String(row['ยศปัจจุบันเมื่อ']).trim() : null,
      affiliation: row['สังกัด'] ? String(row['สังกัด']).trim() : null,
    };

    const record = {
      seq_no,
      service_code: serviceCode,
      rank_th: row['ยศ'] ? String(row['ยศ']).trim() : null,
      first_name_th: row['ชื่อ'] ? String(row['ชื่อ']).trim() : null,
      last_name_th: row['สกุล'] ? String(row['สกุล']).trim() : null,
      full_name_th: fullName,
      nickname: row['ชื่อเล่น'] ? String(row['ชื่อเล่น']).trim() : null,
      rank_en: row['Rank'] ? String(row['Rank']).trim() : null,
      first_name_en: row['Name'] ? String(row['Name']).trim() : null,
      last_name_en: row['Lastname'] ? String(row['Lastname']).trim() : null,
      military_id: militaryId,
      citizen_id: citizenId,
      field_position: row['ตำแหน่งในสนาม'] ? String(row['ตำแหน่งในสนาม']).trim() : null,
      regular_position: row['ตำแหน่งปกติ'] ? String(row['ตำแหน่งปกติ']).trim() : null,
      duty_status: 'บรรจุ',
      salary_step: row['ชั้นเงินเดือน'] ? String(row['ชั้นเงินเดือน']).trim() : null,
      blood_group: normalizeBlood(row['กลุ่มเลือด']),
      phone_number: normalizePhone(row[' ']),
      department: row['ส่วนงาน'] ? String(row['ส่วนงาน']).trim() : null,
      religion: row['ศาสนา'] ? String(row['ศาสนา']).trim() : null,
      birth_date: excelDateToISO(row['วัน เดือน ปี เกิด']),
      passport_no: row['PASSPORT'] ? String(row['PASSPORT']).trim() : null,
      photo_url: finalPhotoUrl,
      custom_fields: customFields,
      updated_at: new Date().toISOString(),
    };

    recordsToInsert.push(record);
    console.log(finalPhotoUrl ? '✅ (บันทึกรูปสำเร็จ)' : '⚠️ (ไม่มีรูป/ใช้รูปเดิม)');
  }

  // 2. Also process Sheet 'สำรอง' if present
  if (workbook.SheetNames.includes('สำรอง')) {
    const reserveRows = XLSX.utils.sheet_to_json(workbook.Sheets['สำรอง']);
    console.log(`\n📋 พบข้อมูลใน Sheet 'สำรอง' ทั้งหมด ${reserveRows.length} รายการ กำลังประมวลผล...`);

    for (let j = 0; j < reserveRows.length; j++) {
      const r = reserveRows[j];
      const rawSeq = String(r['ลำดับ'] || `ส${j + 1}`);
      const seqNum = 1000 + (parseInt(rawSeq.replace(/\D/g, ''), 10) || (j + 1));
      const fullName = String(r['fullname'] || r['ยศ – ชื่อ,นามสกุล'] || '').trim();
      const citizenId = r['หมายเลขประชาชน'] ? String(r['หมายเลขประชาชน']).replace(/[^0-9]/g, '') : null;
      const militaryId = r['หมายเลขประจำตัว'] ? String(r['หมายเลขประจำตัว']).replace(/[^0-9]/g, '') : null;

      process.stdout.write(`[สำรอง ${j + 1}/${reserveRows.length}] ${rawSeq} - ${fullName}... `);

      let finalPhotoUrl = null;
      const driveLink = r['รูปภาพ'];
      if (driveLink && typeof driveLink === 'string' && driveLink.includes('drive.google.com')) {
        const imgData = await downloadDriveImage(driveLink);
        if (imgData) {
          const fileExt = imgData.extension;
          const storagePath = `avatars/reserve_${rawSeq}_${citizenId || militaryId || j + 1}.${fileExt}`;
          const uploadedUrl = await uploadToSupabaseStorage(BUCKET_NAME, storagePath, imgData.buffer, imgData.contentType);
          if (uploadedUrl) {
            finalPhotoUrl = uploadedUrl;
            photoSuccessCount++;
          }
        }
      }

      recordsToInsert.push({
        seq_no: seqNum,
        service_code: rawSeq,
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
      console.log(finalPhotoUrl ? '✅' : '⚠️');
    }
  }

  // 3. Batch Insert into Supabase
  console.log(`\n💾 กำลังเตรียมบันทึกข้อมูลทั้งหมด ${recordsToInsert.length} รายการลงในตาราง 'personnel'...`);
  
  // Clean table first to avoid any duplicate keys or stale data
  console.log('🧹 ล้างข้อมูลเดิมในตาราง personnel...');
  await supabase.from('personnel').delete().neq('seq_no', -999999);

  const CHUNK_SIZE = 50;
  let insertedTotal = 0;

  for (let k = 0; k < recordsToInsert.length; k += CHUNK_SIZE) {
    const chunk = recordsToInsert.slice(k, k + CHUNK_SIZE);
    const { error: insertError } = await supabase.from('personnel').insert(chunk);

    if (insertError) {
      console.error(`❌ เกิดข้อผิดพลาดในการบันทึก Chunk ${Math.floor(k / CHUNK_SIZE) + 1}:`, insertError.message);
    } else {
      insertedTotal += chunk.length;
      console.log(`   บันทึกแล้ว ${insertedTotal}/${recordsToInsert.length} รายการ...`);
    }
  }

  console.log('\n=====================================================');
  console.log('🎉 การนำเข้าข้อมูลเสร็จสมบูรณ์!');
  console.log(`   - ข้อมูลกำลังพลทั้งหมด: ${recordsToInsert.length} นาย`);
  console.log(`   - รูปภาพที่อัปโหลดเข้า Supabase Storage สำเร็จ: ${photoSuccessCount} รูป`);
  if (photoFailCount > 0) {
    console.log(`   - รูปภาพที่ไม่สามารถเข้าถึงได้: ${photoFailCount} รูป`);
  }
  console.log('=====================================================\n');
}

runMigration().catch((err) => {
  console.error('\n❌ เกิดข้อผิดพลาดร้ายแรง:', err);
  process.exit(1);
});
