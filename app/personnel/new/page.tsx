'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  User, 
  HeartHandshake, 
  Loader2,
  FileText
} from 'lucide-react';
import AvatarUploader from '@/components/AvatarUploader';
import AdminOnlyGuard from '@/components/AdminOnlyGuard';
import { personnelService } from '@/lib/personnelService';
import { FieldDefinition, formatFullNameTh } from '@/types/personnel';

export default function NewPersonnelPage() {
  return (
    <AdminOnlyGuard>
      <NewPersonnelForm />
    </AdminOnlyGuard>
  );
}

function NewPersonnelForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    seq_no: 1,
    rank_th: '',
    first_name_th: '',
    last_name_th: '',
    full_name_th: '',
    nickname: '',
    rank_en: '',
    first_name_en: '',
    last_name_en: '',
    military_id: '',
    citizen_id: '',
    regular_position: '',
    salary_step: '',
    blood_group: 'O',
    phone_number: '',
    department: '',
    duty_status: 'ทบ.',
    religion: 'พุทธ',
    birth_date: '',
    photo_url: '',
    gender: 'ชาย',
    age: '',
    email: '',
    line_id: '',
    affiliation: '',
    commander: '',
    rank_date: '',
    personnel_category: 'สัญญาบัตร',
    notes: '',
  });

  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadFieldsAndSeq() {
      try {
        const [fields, allPersonnel] = await Promise.all([
          personnelService.getFieldDefinitions(),
          personnelService.getAll(),
        ]);
        setFieldDefs(fields);

        // Auto increment seq_no
        if (allPersonnel.length > 0) {
          const maxSeq = Math.max(...allPersonnel.map((p) => p.seq_no || 0));
          setFormData((prev) => ({
            ...prev,
            seq_no: maxSeq + 1,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            seq_no: 1,
          }));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadFieldsAndSeq();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'seq_no' ? Number(value) : value,
    }));
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name_th.trim() || !formData.last_name_th.trim()) {
      alert('กรุณากรอกชื่อและนามสกุลภาษาไทย');
      return;
    }

    const full_name_th = formatFullNameTh(formData.rank_th, formData.first_name_th, formData.last_name_th);

    setLoading(true);
    try {
      const created = await personnelService.create({
        ...formData,
        full_name_th,
        age: formData.age ? Number(formData.age) : null,
        custom_fields: {
          ...customFields,
          gender: formData.gender,
          age: formData.age ? Number(formData.age) : null,
          email: formData.email,
          line_id: formData.line_id,
          affiliation: formData.affiliation,
          commander: formData.commander,
          rank_date: formData.rank_date,
          personnel_category: formData.personnel_category,
          notes: formData.notes,
        },
      });
      router.push(`/personnel/${created.id}`);
    } catch (err: any) {
      console.error('Failed to create personnel:', err);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${err?.message || 'โปรดลองใหม่อีกครั้ง'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          href="/personnel"
          className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            เพิ่มข้อมูลกำลังพลใหม่
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-0.5">
            กรอกข้อมูลทำเนียบกำลังพล Unmiss R7
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Photo Upload Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
          <AvatarUploader
            currentUrl={formData.photo_url}
            onUrlChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
          />
        </div>

        {/* Section 1: ข้อมูลรหัสประจำตัวและสังกัด */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-lg sm:text-xl font-black text-slate-900 border-b border-slate-100 pb-3.5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>ข้อมูลสังกัดและรหัสประจำตัว</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ลำดับหมายเลข (seq_no) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                name="seq_no"
                value={formData.seq_no}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ส่วนงาน / ฝ่าย / ตอน (department)
              </label>
              <input
                type="text"
                name="department"
                placeholder="เช่น ฝ่ายกำลังพล หรือ กองร้อยช่าง"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                สังกัดเหล่าทัพ (duty_status) *
              </label>
              <select
                name="duty_status"
                value={formData.duty_status}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ทบ.">ทบ. (กองทัพบก)</option>
                <option value="ทท.">ทท. (กองบัญชาการกองทัพไทย)</option>
                <option value="ทร.">ทร. (กองทัพเรือ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ตำแหน่งปกติ (regular_position)
              </label>
              <input
                type="text"
                name="regular_position"
                placeholder="เช่น รอง ผบ.พัน.ช.๕๒"
                value={formData.regular_position}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ขั้นเงินเดือน (salary_step)
              </label>
              <input
                type="text"
                name="salary_step"
                placeholder="เช่น น.๓/๑๘.๕"
                value={formData.salary_step}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                สังกัดเดิม (affiliation)
              </label>
              <input
                type="text"
                name="affiliation"
                placeholder="เช่น พัน.ช.๕๒"
                value={formData.affiliation}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ผู้บังคับบัญชา (commander)
              </label>
              <input
                type="text"
                name="commander"
                placeholder="เช่น ผบ.ร้อย."
                value={formData.commander}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ประเภทกำลังพล
              </label>
              <select
                name="personnel_category"
                value={formData.personnel_category}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="สัญญาบัตร">สัญญาบัตร</option>
                <option value="ประทวน">ประทวน</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ยศปัจจุบันเมื่อ (rank_date)
              </label>
              <input
                type="text"
                name="rank_date"
                placeholder="เช่น 1 ต.ค. 65"
                value={formData.rank_date}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลส่วนตัวและยศ-ชื่อ-สกุล */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-lg sm:text-xl font-black text-slate-900 border-b border-slate-100 pb-3.5">
            <User className="w-5 h-5 text-amber-600" />
            <span>ยศ ชื่อ-นามสกุล และข้อมูลบุคคล</span>
          </div>

          {/* 1. ยศ, ชื่อ, สกุล ภาษาไทย */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ยศ (ไทย)
              </label>
              <input
                type="text"
                name="rank_th"
                placeholder="เช่น พ.ท. หรือ ส.อ."
                value={formData.rank_th}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ชื่อ (ไทย) *
              </label>
              <input
                type="text"
                name="first_name_th"
                placeholder="เช่น นฤเบศร์"
                value={formData.first_name_th}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                สกุล (ไทย) *
              </label>
              <input
                type="text"
                name="last_name_th"
                placeholder="เช่น บุญคุ้ม"
                value={formData.last_name_th}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ชื่อเล่น (nickname)
              </label>
              <input
                type="text"
                name="nickname"
                placeholder="เช่น สอง"
                value={formData.nickname}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                RANK (EN)
              </label>
              <input
                type="text"
                name="rank_en"
                placeholder="เช่น LTC, MAJ, CPT"
                value={formData.rank_en}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                NAME (EN)
              </label>
              <input
                type="text"
                name="first_name_en"
                placeholder="เช่น NARUBES"
                value={formData.first_name_en}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                LASTNAME (EN)
              </label>
              <input
                type="text"
                name="last_name_en"
                placeholder="เช่น BOONKOOM"
                value={formData.last_name_en}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                หมายเลขประจำตัวทหาร (military_id)
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="military_id"
                placeholder="เช่น 1309900213"
                value={formData.military_id}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                หมายเลขประจำตัวประชาชน (citizen_id)
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="citizen_id"
                placeholder="เช่น 1-7099-00124-91-2"
                value={formData.citizen_id}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: ข้อมูลทางการแพทย์และการติดต่อ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-lg sm:text-xl font-black text-slate-900 border-b border-slate-100 pb-3.5">
            <HeartHandshake className="w-5 h-5 text-red-600" />
            <span>ข้อมูลการแพทย์ การติดต่อ และเอกสาร</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                กลุ่มเลือด (blood_group)
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="O">O</option>
                <option value="AB">AB</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                เบอร์ติดต่อ (phone_number)
              </label>
              <input
                type="tel"
                name="phone_number"
                placeholder="เช่น 081-892-3412"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                ศาสนา (religion)
              </label>
              <input
                type="text"
                name="religion"
                placeholder="เช่น พุทธ, อิสลาม, คริสต์"
                value={formData.religion}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                วัน เดือน ปี เกิด (birth_date)
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* แถวที่ 2: เพศ, อายุ, อีเมล */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                เพศ (gender)
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                อายุ (age)
              </label>
              <input
                type="number"
                name="age"
                placeholder="เช่น 35"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                อีเมล (email)
              </label>
              <input
                type="email"
                name="email"
                placeholder="เช่น soldier@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* แถวที่ 3: Line ID, หมายเหตุ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                Line ID
              </label>
              <input
                type="text"
                name="line_id"
                placeholder="เช่น line_id"
                value={formData.line_id}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                หมายเหตุ (notes)
              </label>
              <input
                type="text"
                name="notes"
                placeholder="หมายเหตุเพิ่มเติม"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Custom Fields */}
        {fieldDefs.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-lg sm:text-xl font-black text-slate-900 border-b border-slate-100 pb-3.5">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>ข้อมูลเสริมเพิ่มเติม (Dynamic Fields)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {fieldDefs.map((def) => (
                <div key={def.id}>
                  <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                    {def.field_label}
                  </label>
                  <input
                    type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                    inputMode={def.field_type === 'number' ? 'numeric' : undefined}
                    value={customFields[def.field_key] || ''}
                    onChange={(e) => handleCustomFieldChange(def.field_key, e.target.value)}
                    placeholder={`กรอก ${def.field_label}`}
                    className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            href="/personnel"
            className="flex-1 sm:flex-none text-center px-6 py-4 rounded-2xl border border-slate-300 text-slate-700 text-base sm:text-lg font-bold hover:bg-slate-50 active:scale-95 transition-all"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-base sm:text-lg font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Save className="w-5 h-5 text-amber-400" />
            )}
            <span>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
