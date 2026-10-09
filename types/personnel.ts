export type DutyStatus = 'บรรจุ' | 'ช่วยราชการ';

export interface Personnel {
  id: string;
  service_code?: string | null;
  seq_no: number;
  rank_th?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  full_name_th: string;
  nickname?: string | null;
  rank_en?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  military_id?: string | null;
  citizen_id?: string | null;
  field_position?: string | null;
  regular_position?: string | null;
  salary_step?: string | null;
  duty_status?: DutyStatus | string | null;
  blood_group?: string | null;
  phone_number?: string | null;
  department?: string | null;
  religion?: string | null;
  birth_date?: string | null;
  passport_no?: string | null;
  photo_url?: string | null;
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export const splitFullNameTh = (fullName: string = ''): { rank_th: string; first_name_th: string; last_name_th: string } => {
  if (!fullName) return { rank_th: '', first_name_th: '', last_name_th: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    return { rank_th: '', first_name_th: '', last_name_th: '' };
  }
  if (parts.length === 1) {
    return { rank_th: '', first_name_th: parts[0], last_name_th: '' };
  }
  if (parts.length === 2) {
    if (parts[0].includes('.') || parts[0].length <= 5) {
      return { rank_th: parts[0], first_name_th: parts[1], last_name_th: '' };
    }
    return { rank_th: '', first_name_th: parts[0], last_name_th: parts[1] };
  }
  return {
    rank_th: parts[0],
    first_name_th: parts[1],
    last_name_th: parts.slice(2).join(' '),
  };
};

export const formatFullNameTh = (
  rank_th?: string | null,
  first_name_th?: string | null,
  last_name_th?: string | null
): string => {
  return [rank_th, first_name_th, last_name_th]
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim())
    .join(' ');
};

export interface FieldDefinition {
  id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date';
  is_active: boolean;
  created_at?: string;
}

export interface DisplayFieldSetting {
  key: string;
  label: string;
  category: 'ข้อมูลยศและชื่อ' | 'ข้อมูลสังกัดและตำแหน่ง' | 'ข้อมูลส่วนตัวและการแพทย์' | 'ข้อมูลเสริม (Custom)';
  visible: boolean;
  description?: string;
}

export interface KPIStats {
  totalPersonnel: number;
  commissionedOfficers: number;
  nonCommissionedOfficers: number;
  departmentsCount: number;
  withPhotoCount: number;
  withoutPhotoCount: number;
  dutyStatusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
  religionCounts: Record<string, number>;
  assignedCount?: number;
  detachedCount?: number;
}

export interface DutyStatusStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  bg: string;
}

export interface GenderStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  bg: string;
}

export interface ReligionStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  bg: string;
}

export interface DepartmentStat {
  name: string;
  count: number;
}

export interface BloodGroupStat {
  name: string;
  count: number;
  color: string;
}

export interface RankStat {
  rank: string;
  count: number;
  category: 'นายทหารสัญญาบัตร' | 'นายทหารประทวน';
}
