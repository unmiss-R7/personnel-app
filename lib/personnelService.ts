import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Personnel,
  FieldDefinition,
  DisplayFieldSetting,
  KPIStats,
  DepartmentStat,
  BloodGroupStat,
  RankStat,
  DutyStatusStat,
  GenderStat,
  ReligionStat,
  splitFullNameTh,
  formatFullNameTh,
} from '@/types/personnel';
import { INITIAL_PERSONNEL, INITIAL_FIELD_DEFINITIONS } from './mockData';

const LOCAL_STORAGE_PERSONNEL_KEY = 'engineer_division_personnel';
const LOCAL_STORAGE_FIELDS_KEY = 'engineer_division_fields';
const LOCAL_STORAGE_DISPLAY_FIELDS_KEY = 'engineer_division_display_fields';

export const DEFAULT_DISPLAY_FIELDS: DisplayFieldSetting[] = [
  // 1. ข้อมูลยศและชื่อ
  { key: 'military_id', label: 'หมายเลขประจำตัวทหาร', category: 'ข้อมูลยศและชื่อ', visible: true, description: 'เลขประจำตัวทหาร 10 หลัก' },
  { key: 'citizen_id', label: 'หมายเลขประชาชน', category: 'ข้อมูลยศและชื่อ', visible: true, description: 'เลขประจำตัวประชาชน 13 หลัก' },
  { key: 'passport_no', label: 'หนังสือเดินทาง (PASSPORT)', category: 'ข้อมูลยศและชื่อ', visible: true, description: 'หมายเลขหนังสือเดินทาง' },
  { key: 'service_code', label: 'รหัสกำลังพล / PKF ID', category: 'ข้อมูลยศและชื่อ', visible: true, description: 'รหัสประจำตัวกำลังพลภารกิจ UNMISS' },
  { key: 'seq_no', label: 'ลำดับที่ (No.)', category: 'ข้อมูลยศและชื่อ', visible: true, description: 'ลำดับที่ในทำเนียบบัญชีกำลังพล' },

  // 2. ข้อมูลสังกัดและตำแหน่ง
  { key: 'department', label: 'ส่วนงาน / กองร้อย', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'กองร้อยหรือส่วนงานในภารกิจ' },
  { key: 'regular_position', label: 'ตำแหน่งปกติ', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'ตำแหน่งตามโครงสร้างอัตราปกติ' },
  { key: 'field_position', label: 'ตำแหน่งในสนาม', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'ตำแหน่งในการปฏิบัติภารกิจสนาม' },
  { key: 'duty_status', label: 'สังกัด (ทบ. / ทท. / ทร.)', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'สังกัดเหล่าทัพ ทบ., ทท., หรือ ทร.' },
  { key: 'affiliation', label: 'สังกัดเดิม', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'หน่วยต้นสังกัดเดิมของกำลังพล' },
  { key: 'commander', label: 'ผู้บังคับบัญชา', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'ผู้บังคับบัญชาตามสายงาน' },
  { key: 'personnel_category', label: 'ประเภทกำลังพล', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'สัญญาบัตร หรือ ประทวน' },
  { key: 'rank_date', label: 'ยศปัจจุบันเมื่อ', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'วันที่ได้รับชั้นยศปัจจุบัน' },
  { key: 'salary_step', label: 'ขั้นเงินเดือน', category: 'ข้อมูลสังกัดและตำแหน่ง', visible: true, description: 'ขั้นเงินเดือน เช่น น.๓/๑๘.๕' },

  // 3. ข้อมูลส่วนตัวและการแพทย์
  { key: 'blood_group', label: 'กลุ่มเลือด', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'หมู่เลือด A, B, O, AB สำหรับการแพทย์' },
  { key: 'phone_number', label: 'เบอร์ติดต่อ', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'หมายเลขโทรศัพท์มือถือ' },
  { key: 'birth_date', label: 'วัน เดือน ปี เกิด', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'วันเดือนปีเกิด' },
  { key: 'age', label: 'อายุ', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'อายุของกำลังพล (ปี)' },
  { key: 'gender', label: 'เพศ', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'เพศ ชาย/หญิง' },
  { key: 'religion', label: 'ศาสนา', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'ศาสนาของกำลังพล' },
  { key: 'email', label: 'อีเมล', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'ที่อยู่อีเมลสำหรับติดต่อ' },
  { key: 'line_id', label: 'Line ID', category: 'ข้อมูลส่วนตัวและการแพทย์', visible: true, description: 'ไอดีไลน์สำหรับติดต่อ' },

  // 4. ข้อมูลเสริม (Custom)
  { key: 'notes', label: 'หมายเหตุ', category: 'ข้อมูลเสริม (Custom)', visible: true, description: 'บันทึกข้อมูลหรือหมายเหตุเพิ่มเติม' },
  { key: 'reserve_code', label: 'รหัสกำลังพลสำรอง', category: 'ข้อมูลเสริม (Custom)', visible: true, description: 'รหัสกำลังพลสำรอง เช่น ส1, ส2' },
];

export const REMOVED_FIELD_KEYS = new Set([
  'uniform_size',
  'shoe_size',
  'blood_pressure',
  'rank_en',
  'first_name_en',
  'last_name_en',
  'nickname',
  'rank_th',
  'first_name_th',
  'last_name_th',
]);

const initialPhotoMap = new Map(INITIAL_PERSONNEL.map((ip) => [ip.id, ip.photo_url]));

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper for local storage access (client-side)
const getLocalPersonnel = (): Personnel[] => {
  if (typeof window === 'undefined') return INITIAL_PERSONNEL;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PERSONNEL_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(INITIAL_PERSONNEL));
      return INITIAL_PERSONNEL;
    }
    const parsed: Personnel[] = JSON.parse(data);
    return parsed.map((p) => {
      const cleanCustom = { ...(p.custom_fields || {}) };
      delete cleanCustom.uniform_size;
      delete cleanCustom.shoe_size;
      delete cleanCustom.blood_pressure;

      const fallbackPhoto = initialPhotoMap.get(p.id) || '';
      const photo_url = (p.photo_url && p.photo_url.trim() !== '') ? p.photo_url : fallbackPhoto;

      const split = splitFullNameTh(p.full_name_th || '');
      const rank_th = p.rank_th || split.rank_th;
      const first_name_th = p.first_name_th || split.first_name_th;
      const last_name_th = p.last_name_th || split.last_name_th;
      const full_name_th = p.full_name_th || formatFullNameTh(rank_th, first_name_th, last_name_th) || 'ไม่ระบุชื่อ';

      return {
        ...p,
        rank_th,
        first_name_th,
        last_name_th,
        full_name_th,
        photo_url,
        phone_number: p.phone_number !== null && p.phone_number !== undefined ? String(p.phone_number) : '',
        military_id: p.military_id !== null && p.military_id !== undefined ? String(p.military_id) : '',
        citizen_id: p.citizen_id !== null && p.citizen_id !== undefined ? String(p.citizen_id) : '',
        duty_status: p.duty_status || 'ทบ.',
        field_position: p.field_position,
        passport_no: p.passport_no,
        custom_fields: cleanCustom,
      };
    });
  } catch (e) {
    return INITIAL_PERSONNEL;
  }
};

const saveLocalPersonnel = (list: Personnel[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PERSONNEL_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};

const getLocalFields = (): FieldDefinition[] => {
  if (typeof window === 'undefined') return INITIAL_FIELD_DEFINITIONS;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_FIELDS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(INITIAL_FIELD_DEFINITIONS));
      return INITIAL_FIELD_DEFINITIONS;
    }
    const parsed: FieldDefinition[] = JSON.parse(data);
    return parsed.filter((f) => !REMOVED_FIELD_KEYS.has(f.field_key));
  } catch (e) {
    return INITIAL_FIELD_DEFINITIONS;
  }
};

const saveLocalFields = (list: FieldDefinition[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving fields to localStorage', e);
  }
};

const SUPABASE_PERSONNEL_COLUMNS = new Set([
  'id',
  'service_code',
  'seq_no',
  'rank_th',
  'first_name_th',
  'last_name_th',
  'full_name_th',
  'nickname',
  'rank_en',
  'first_name_en',
  'last_name_en',
  'military_id',
  'citizen_id',
  'field_position',
  'regular_position',
  'duty_status',
  'salary_step',
  'blood_group',
  'phone_number',
  'department',
  'religion',
  'birth_date',
  'passport_no',
  'photo_url',
  'custom_fields',
  'created_at',
  'updated_at',
]);

const prepareSupabasePayload = (record: Record<string, any>, isUpdate: boolean = false) => {
  const clean: Record<string, any> = {};
  const custom = { ...(record.custom_fields || {}) };

  for (const [key, val] of Object.entries(record)) {
    if (SUPABASE_PERSONNEL_COLUMNS.has(key)) {
      if (key === 'birth_date') {
        clean[key] = (val && String(val).trim() !== '') ? String(val).trim() : null;
      } else if (key === 'service_code') {
        clean[key] = (val && String(val).trim() !== '') 
          ? String(val).trim() 
          : (isUpdate ? undefined : `PKF-THAI-${String(record.seq_no || 1).padStart(5, '0')}`);
      } else if (key === 'seq_no') {
        clean[key] = Number(val) || (isUpdate ? undefined : 1);
      } else if (val === '') {
        clean[key] = null;
      } else {
        clean[key] = val;
      }
    } else if (key !== 'custom_fields') {
      if (!REMOVED_FIELD_KEYS.has(key) && val !== undefined) {
        custom[key] = val;
      }
    }
  }

  // Ensure service_code is always set if new record
  if (!isUpdate && !clean.service_code) {
    clean.service_code = (record.service_code && String(record.service_code).trim() !== '')
      ? String(record.service_code).trim()
      : `PKF-THAI-${String(record.seq_no || 1).padStart(5, '0')}`;
  }

  // Ensure full_name_th is always valid string
  if (!clean.full_name_th && (record.rank_th || record.first_name_th || record.last_name_th)) {
    clean.full_name_th = formatFullNameTh(record.rank_th, record.first_name_th, record.last_name_th);
  }

  if (!isUpdate || record.custom_fields !== undefined || Object.keys(custom).length > 0) {
    clean.custom_fields = custom;
  }

  return clean;
};

const mapFromSupabase = (p: any): Personnel => {
  if (!p) return p;
  const custom = p.custom_fields || {};
  const split = splitFullNameTh(p.full_name_th || '');
  const rank_th = p.rank_th || custom.rank_th || split.rank_th || '';
  const first_name_th = p.first_name_th || custom.first_name_th || split.first_name_th || '';
  const last_name_th = p.last_name_th || custom.last_name_th || split.last_name_th || '';
  const full_name_th = p.full_name_th || formatFullNameTh(rank_th, first_name_th, last_name_th) || 'ไม่ระบุชื่อ';
  const duty_status = p.duty_status || custom.duty_status || 'ทบ.';

  const fallbackPhoto = initialPhotoMap.get(p.id) || '';
  const photo_url = (p.photo_url && String(p.photo_url).trim() !== '') ? p.photo_url : fallbackPhoto;

  return {
    ...p,
    rank_th,
    first_name_th,
    last_name_th,
    full_name_th,
    duty_status,
    photo_url,
    phone_number: p.phone_number !== null && p.phone_number !== undefined ? String(p.phone_number) : '',
    military_id: p.military_id !== null && p.military_id !== undefined ? String(p.military_id) : '',
    citizen_id: p.citizen_id !== null && p.citizen_id !== undefined ? String(p.citizen_id) : '',
    custom_fields: custom,
  };
};

export const personnelService = {
  // 1. ดึงรายชื่อกำลังพลทั้งหมด
  async getAll(): Promise<Personnel[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('seq_no', { ascending: true });

      if (error) {
        console.error('Supabase fetch failed:', error);
        throw new Error(`ไม่สามารถเชื่อมต่อดึงข้อมูลจาก Supabase: ${error.message}`);
      }
      return (data || []).map(mapFromSupabase);
    }
    return getLocalPersonnel();
  },

  // 2. ดึงข้อมูลกำลังพลรายบุคคลตาม ID
  async getById(id: string): Promise<Personnel | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Supabase getById failed:', error);
        throw new Error(`ไม่สามารถดึงข้อมูลจาก Supabase: ${error.message}`);
      }
      return data ? mapFromSupabase(data) : null;
    }

    const locals = getLocalPersonnel();
    return locals.find((p) => p.id === id) || null;
  },

  // 3. เพิ่มข้อมูลกำลังพลใหม่
  async create(personnel: Omit<Personnel, 'id' | 'created_at' | 'updated_at'>): Promise<Personnel> {
    const split = splitFullNameTh(personnel.full_name_th || '');
    const rank_th = (personnel.rank_th !== undefined && personnel.rank_th !== null && personnel.rank_th !== '') ? personnel.rank_th : split.rank_th;
    const first_name_th = (personnel.first_name_th !== undefined && personnel.first_name_th !== null && personnel.first_name_th !== '') ? personnel.first_name_th : split.first_name_th;
    const last_name_th = (personnel.last_name_th !== undefined && personnel.last_name_th !== null && personnel.last_name_th !== '') ? personnel.last_name_th : split.last_name_th;
    const full_name_th = formatFullNameTh(rank_th, first_name_th, last_name_th) || personnel.full_name_th || '';

    const newPersonnel: Record<string, any> = {
      ...personnel,
      id: generateUUID(),
      rank_th,
      first_name_th,
      last_name_th,
      full_name_th,
      duty_status: personnel.duty_status || 'ทบ.',
      service_code: personnel.service_code || `PKF-THAI-${String(personnel.seq_no || 1).padStart(5, '0')}`,
    };

    if (isSupabaseConfigured()) {
      const payload = prepareSupabasePayload(newPersonnel, false);
      const { data, error } = await supabase
        .from('personnel')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Supabase create error:', error);
        throw new Error(`บันทึกข้อมูลไปยัง Supabase ไม่สำเร็จ: ${error.message}`);
      }
      return mapFromSupabase(data);
    }

    const now = new Date().toISOString();
    const localRecord = { ...newPersonnel, created_at: now, updated_at: now } as Personnel;
    const list = getLocalPersonnel();
    list.push(localRecord);
    saveLocalPersonnel(list);
    return localRecord;
  },

  // 4. แก้ไขข้อมูลกำลังพล
  async update(id: string, personnel: Partial<Personnel>): Promise<Personnel> {
    const now = new Date().toISOString();

    let rank_th = personnel.rank_th;
    let first_name_th = personnel.first_name_th;
    let last_name_th = personnel.last_name_th;
    let full_name_th = personnel.full_name_th;

    // If individual Thai name parts were supplied, recompute full_name_th
    if (personnel.rank_th !== undefined || personnel.first_name_th !== undefined || personnel.last_name_th !== undefined) {
      full_name_th = formatFullNameTh(rank_th, first_name_th, last_name_th);
    } else if (personnel.full_name_th !== undefined) {
      // If only full_name_th was passed, split into 3 parts
      const split = splitFullNameTh(personnel.full_name_th);
      rank_th = split.rank_th;
      first_name_th = split.first_name_th;
      last_name_th = split.last_name_th;
    }

    const updatedData: Partial<Personnel> = {
      ...personnel,
      ...(rank_th !== undefined ? { rank_th } : {}),
      ...(first_name_th !== undefined ? { first_name_th } : {}),
      ...(last_name_th !== undefined ? { last_name_th } : {}),
      ...(full_name_th !== undefined ? { full_name_th } : {}),
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const payload = prepareSupabasePayload(updatedData, true);
      delete payload.id;
      delete payload.created_at;
      payload.updated_at = now;

      const { data, error } = await supabase
        .from('personnel')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`บันทึกการแก้ไขไปยัง Supabase ไม่สำเร็จ: ${error.message}`);
      }
      return mapFromSupabase(data);
    }

    const list = getLocalPersonnel();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData } as Personnel;
      saveLocalPersonnel(list);
      return list[index];
    }
    throw new Error('Personnel not found');
  },

  // 5. ลบข้อมูลกำลังพล
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('personnel').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`ลบข้อมูลใน Supabase ไม่สำเร็จ: ${error.message}`);
      }
      return true;
    }

    const list = getLocalPersonnel();
    const filtered = list.filter((p) => p.id !== id);
    saveLocalPersonnel(filtered);
    return true;
  },

  // 6. อัปโหลดรูปภาพไปยัง Supabase Storage Bucket `personnel-avatars`
  async uploadAvatar(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('personnel-avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('personnel-avatars').getPublicUrl(filePath);
          if (data?.publicUrl) {
            return data.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Supabase avatar upload failed:', err);
      }
    }

    // Fallback: Convert to Base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // 7. Bulk Insert (สำหรับ Excel Import)
  async bulkInsert(personnelList: Array<Omit<Personnel, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
    const formattedList = personnelList.map((p, index) => {
      const split = splitFullNameTh(p.full_name_th || '');
      const rank_th = (p.rank_th !== undefined && p.rank_th !== null && p.rank_th !== '') ? p.rank_th : split.rank_th;
      const first_name_th = (p.first_name_th !== undefined && p.first_name_th !== null && p.first_name_th !== '') ? p.first_name_th : split.first_name_th;
      const last_name_th = (p.last_name_th !== undefined && p.last_name_th !== null && p.last_name_th !== '') ? p.last_name_th : split.last_name_th;
      const full_name_th = formatFullNameTh(rank_th, first_name_th, last_name_th) || p.full_name_th || '';

      return {
        ...p,
        rank_th,
        first_name_th,
        last_name_th,
        full_name_th,
        duty_status: p.duty_status || 'ทบ.',
        service_code: p.service_code || `PKF-THAI-${String(p.seq_no || (index + 1)).padStart(5, '0')}`,
        id: generateUUID(),
      };
    });

    if (isSupabaseConfigured()) {
      const payloads = formattedList.map((item) => prepareSupabasePayload(item, false));
      const { data, error } = await supabase.from('personnel').insert(payloads).select();
      if (error) {
        console.error('Supabase bulkInsert error:', error);
        throw new Error(`นำเข้าข้อมูลไปยัง Supabase ไม่สำเร็จ: ${error.message}`);
      }
      return data ? data.length : 0;
    }

    const currentList = getLocalPersonnel();
    const now = new Date().toISOString();
    const withTimestamps = formattedList.map((f) => ({ ...f, created_at: now, updated_at: now }));
    const combined = [...currentList, ...withTimestamps];
    saveLocalPersonnel(combined);
    return formattedList.length;
  },

  // 8. ดึงรายการ Dynamic Field Definitions
  async getFieldDefinitions(): Promise<FieldDefinition[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('field_definitions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as FieldDefinition[];
        }
      } catch (err) {
        console.warn('Supabase getFieldDefinitions failed:', err);
      }
    }
    return getLocalFields();
  },

  // 9. เพิ่ม Custom Field Definition
  async createFieldDefinition(field: Omit<FieldDefinition, 'id' | 'created_at'>): Promise<FieldDefinition> {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'f-' + Date.now();
    const newField: FieldDefinition = {
      ...field,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('field_definitions')
          .insert([newField])
          .select()
          .single();

        if (!error && data) {
          return data as FieldDefinition;
        }
      } catch (err) {
        console.warn('Supabase createFieldDefinition failed:', err);
      }
    }

    const fields = getLocalFields();
    fields.push(newField);
    saveLocalFields(fields);
    return newField;
  },

  // 10. สถิติภาพรวมสำหรับ Dashboard
  calculateKPIs(personnel: Personnel[]): KPIStats {
    const totalPersonnel = personnel.length;
    let commissionedOfficers = 0;
    let nonCommissionedOfficers = 0;
    let withPhotoCount = 0;
    const departmentSet = new Set<string>();
    const dutyStatusCounts: Record<string, number> = { 'ทบ.': 0, 'ทท.': 0, 'ทร.': 0 };
    const genderCounts: Record<string, number> = { 'ชาย': 0, 'หญิง': 0, 'ไม่ระบุ': 0 };
    const religionCounts: Record<string, number> = { 'พุทธ': 0, 'อิสลาม': 0, 'คริสต์': 0, 'ไม่ระบุ': 0 };

    const commissionedRanks = ['พ.อ.', 'พ.ท.', 'พ.ต.', 'ร.อ.', 'ร.ท.', 'ร.ต.', 'COL', 'LTC', 'MAJ', 'CPT', '1LT', '2LT'];

    personnel.forEach((p) => {
      if (p.photo_url && String(p.photo_url).trim() !== '') {
        withPhotoCount++;
      }
      if (p.department && String(p.department).trim() !== '') {
        departmentSet.add(String(p.department).trim());
      }

      // ตรวจสอบสังกัดเหล่าทัพ duty_status
      const ds = (p.duty_status || '').trim();
      if (ds && dutyStatusCounts[ds] !== undefined) {
        dutyStatusCounts[ds]++;
      } else if (ds) {
        dutyStatusCounts[ds] = (dutyStatusCounts[ds] || 0) + 1;
      }

      // ตรวจสอบเพศ
      const g = ((p.custom_fields && p.custom_fields.gender) || (p as any).gender || '').trim();
      if (g === 'ชาย') genderCounts['ชาย']++;
      else if (g === 'หญิง') genderCounts['หญิง']++;
      else genderCounts['ไม่ระบุ']++;

      // ตรวจสอบศาสนา
      const r = (p.religion || (p.custom_fields && p.custom_fields.religion) || '').trim();
      if (r === 'พุทธ') religionCounts['พุทธ']++;
      else if (r === 'อิสลาม') religionCounts['อิสลาม']++;
      else if (r === 'คริสต์') religionCounts['คริสต์']++;
      else if (r) religionCounts[r] = (religionCounts[r] || 0) + 1;
      else religionCounts['ไม่ระบุ']++;

      // ตรวจสอบชั้นยศ
      const isCommissioned = commissionedRanks.some(
        (r) =>
          (p.rank_th && String(p.rank_th).startsWith(r)) ||
          (p.full_name_th && String(p.full_name_th).startsWith(r)) ||
          (p.rank_en && String(p.rank_en).toUpperCase() === r.toUpperCase())
      );

      if (isCommissioned) {
        commissionedOfficers++;
      } else {
        nonCommissionedOfficers++;
      }
    });

    return {
      totalPersonnel,
      commissionedOfficers,
      nonCommissionedOfficers,
      departmentsCount: departmentSet.size,
      withPhotoCount,
      withoutPhotoCount: totalPersonnel - withPhotoCount,
      dutyStatusCounts,
      genderCounts,
      religionCounts,
    };
  },

  // สถิติสังกัดเหล่าทัพ (duty_status: ทบ., ทท., ทร.)
  getDutyStatusStats(personnel: Personnel[]): DutyStatusStat[] {
    const total = personnel.length || 1;
    const counts: Record<string, number> = { 'ทบ.': 0, 'ทท.': 0, 'ทร.': 0 };
    
    personnel.forEach((p) => {
      const ds = (p.duty_status || '').trim();
      if (counts[ds] !== undefined) {
        counts[ds]++;
      } else if (ds) {
        counts[ds] = (counts[ds] || 0) + 1;
      }
    });

    const meta: Record<string, { color: string; bg: string }> = {
      'ทบ.': { color: 'text-emerald-700 bg-emerald-50 border-emerald-300', bg: 'bg-emerald-500' },
      'ทท.': { color: 'text-purple-700 bg-purple-50 border-purple-300', bg: 'bg-purple-500' },
      'ทร.': { color: 'text-blue-700 bg-blue-50 border-blue-300', bg: 'bg-blue-500' },
    };

    return Object.entries(counts).map(([name, count]) => {
      const percentage = Math.round((count / total) * 100);
      const m = meta[name] || { color: 'text-slate-700 bg-slate-50 border-slate-300', bg: 'bg-slate-500' };
      return {
        name,
        count,
        percentage,
        color: m.color,
        bg: m.bg,
      };
    });
  },

  // สถิติเพศ
  getGenderStats(personnel: Personnel[]): GenderStat[] {
    const total = personnel.length || 1;
    const counts: Record<string, number> = { 'ชาย': 0, 'หญิง': 0 };
    let unspec = 0;

    personnel.forEach((p) => {
      const g = ((p.custom_fields && p.custom_fields.gender) || (p as any).gender || '').trim();
      if (g === 'ชาย') counts['ชาย']++;
      else if (g === 'หญิง') counts['หญิง']++;
      else unspec++;
    });

    if (unspec > 0) {
      counts['ไม่ระบุ'] = unspec;
    }

    const meta: Record<string, { color: string; bg: string }> = {
      'ชาย': { color: 'text-blue-700 bg-blue-50 border-blue-300', bg: 'bg-blue-500' },
      'หญิง': { color: 'text-rose-700 bg-rose-50 border-rose-300', bg: 'bg-rose-500' },
      'ไม่ระบุ': { color: 'text-slate-600 bg-slate-50 border-slate-300', bg: 'bg-slate-400' },
    };

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      color: meta[name]?.color || 'text-slate-700 bg-slate-50 border-slate-300',
      bg: meta[name]?.bg || 'bg-slate-500',
    }));
  },

  // สถิติศาสนา
  getReligionStats(personnel: Personnel[]): ReligionStat[] {
    const total = personnel.length || 1;
    const counts: Record<string, number> = { 'พุทธ': 0, 'อิสลาม': 0, 'คริสต์': 0 };
    let unspec = 0;

    personnel.forEach((p) => {
      const r = (p.religion || (p.custom_fields && p.custom_fields.religion) || '').trim();
      if (r === 'พุทธ') counts['พุทธ']++;
      else if (r === 'อิสลาม') counts['อิสลาม']++;
      else if (r === 'คริสต์') counts['คริสต์']++;
      else if (r) counts[r] = (counts[r] || 0) + 1;
      else unspec++;
    });

    if (unspec > 0) {
      counts['ไม่ระบุ'] = unspec;
    }

    const meta: Record<string, { color: string; bg: string }> = {
      'พุทธ': { color: 'text-amber-700 bg-amber-50 border-amber-300', bg: 'bg-amber-500' },
      'อิสลาม': { color: 'text-emerald-700 bg-emerald-50 border-emerald-300', bg: 'bg-emerald-500' },
      'คริสต์': { color: 'text-indigo-700 bg-indigo-50 border-indigo-300', bg: 'bg-indigo-500' },
      'ไม่ระบุ': { color: 'text-slate-600 bg-slate-50 border-slate-300', bg: 'bg-slate-400' },
    };

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        color: meta[name]?.color || 'text-slate-700 bg-slate-50 border-slate-300',
        bg: meta[name]?.bg || 'bg-slate-500',
      }));
  },

  // สถิติแยกตามส่วนงาน/กองร้อย
  getDepartmentStats(personnel: Personnel[]): DepartmentStat[] {
    const map = new Map<string, number>();
    personnel.forEach((p) => {
      const dept = (p.department && String(p.department).trim()) || 'ไม่ระบุสังกัด';
      map.set(dept, (map.get(dept) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  },

  // สถิติกลุ่มเลือด
  getBloodGroupStats(personnel: Personnel[]): BloodGroupStat[] {
    const bloodColors: Record<string, string> = {
      A: '#ef4444',   // Red
      B: '#3b82f6',   // Blue
      O: '#10b981',   // Green
      AB: '#f59e0b',  // Amber
      'ไม่ระบุ': '#94a3b8'
    };

    const counts: Record<string, number> = { A: 0, B: 0, O: 0, AB: 0, 'ไม่ระบุ': 0 };

    personnel.forEach((p) => {
      const bg = p.blood_group ? String(p.blood_group).trim().toUpperCase() : '';
      if (bg && counts[bg] !== undefined) {
        counts[bg]++;
      } else {
        counts['ไม่ระบุ']++;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name: `กลุ่ม ${name}`,
        count,
        color: bloodColors[name] || '#94a3b8',
      }));
  },

  // สถิติการกระจายชั้นยศ
  getRankBreakdown(personnel: Personnel[]): RankStat[] {
    const map = new Map<string, number>();
    const commissionedRanks = ['พ.อ.', 'พ.ท.', 'พ.ต.', 'ร.อ.', 'ร.ท.', 'ร.ต.', 'COL', 'LTC', 'MAJ', 'CPT', '1LT', '2LT'];

    personnel.forEach((p) => {
      const rank = p.rank_en ? String(p.rank_en).toUpperCase() : 'N/A';
      map.set(rank, (map.get(rank) || 0) + 1);
    });

    return Array.from(map.entries()).map(([rank, count]) => ({
      rank,
      count,
      category: commissionedRanks.includes(rank) ? 'นายทหารสัญญาบัตร' : 'นายทหารประทวน',
    }));
  },

  // 11. ดึงการตั้งค่าการเปิด/ปิด การ์ดฟิลด์ข้อมูลที่แสดงผล
  getDisplayFields(): DisplayFieldSetting[] {
    if (typeof window === 'undefined') return DEFAULT_DISPLAY_FIELDS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DISPLAY_FIELDS_KEY);
      const savedMap = new Map<string, boolean>();
      if (stored) {
        try {
          const parsed: DisplayFieldSetting[] = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.key) {
                savedMap.set(item.key, item.visible);
              }
            });
          }
        } catch (e) {
          console.error('Error parsing stored display fields', e);
        }
      }

      // Merge dynamic custom fields from local definitions if any
      const dynamicDefs = getLocalFields();
      const dynamicDisplay: DisplayFieldSetting[] = dynamicDefs
        .filter((d) => !DEFAULT_DISPLAY_FIELDS.some((df) => df.key === d.field_key))
        .map((d) => ({
          key: d.field_key,
          label: d.field_label,
          category: 'ข้อมูลเสริม (Custom)' as const,
          visible: savedMap.has(d.field_key) ? (savedMap.get(d.field_key) ?? true) : true,
          description: `ฟิลด์เสริม (${d.field_type})`,
        }));

      const allFields = [...DEFAULT_DISPLAY_FIELDS, ...dynamicDisplay];

      return allFields
        .filter((f) => !REMOVED_FIELD_KEYS.has(f.key))
        .map((f) => ({
          ...f,
          visible: savedMap.has(f.key) ? (savedMap.get(f.key) ?? f.visible) : f.visible,
        }));
    } catch {
      return DEFAULT_DISPLAY_FIELDS;
    }
  },

  // 12. บันทึกการตั้งค่าการเปิด/ปิด การ์ดฟิลด์ข้อมูล
  saveDisplayFields(fields: DisplayFieldSetting[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_DISPLAY_FIELDS_KEY, JSON.stringify(fields));
    } catch (e) {
      console.error('Error saving display fields', e);
    }
  },

  // 13. รีเซ็ตฟิลด์ที่แสดงเป็นค่าเริ่มต้น
  resetDisplayFields(): DisplayFieldSetting[] {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_DISPLAY_FIELDS_KEY);
      } catch (e) {
        console.error('Error resetting display fields', e);
      }
    }
    return DEFAULT_DISPLAY_FIELDS;
  },

  // 14. สลับสถานะเปิด/ปิดฟิลด์เดี่ยว
  toggleDisplayField(key: string, visible: boolean): DisplayFieldSetting[] {
    const list = this.getDisplayFields();
    const updated = list.map((f) => (f.key === key ? { ...f, visible } : f));
    this.saveDisplayFields(updated);
    return updated;
  }
};
