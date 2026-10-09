'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  SlidersHorizontal, 
  Plus, 
  FileText, 
  Hash, 
  Calendar, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  LayoutGrid
} from 'lucide-react';
import { personnelService } from '@/lib/personnelService';
import { FieldDefinition, DisplayFieldSetting } from '@/types/personnel';
import AdminOnlyGuard from '@/components/AdminOnlyGuard';

export default function FieldSettingsPage() {
  return (
    <AdminOnlyGuard>
      <FieldSettingsComponent />
    </AdminOnlyGuard>
  );
}

function FieldSettingsComponent() {
  const [activeTab, setActiveTab] = useState<'display' | 'definitions'>('display');

  // Display Fields State
  const [displayFields, setDisplayFields] = useState<DisplayFieldSetting[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Dynamic Custom Field Definitions State
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCustom, setSavingCustom] = useState(false);

  // New custom field form
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date'>('text');

  const loadData = async () => {
    setLoading(true);
    try {
      const [defs, disp] = await Promise.all([
        personnelService.getFieldDefinitions(),
        personnelService.fetchDisplayFields(),
      ]);
      setCustomFields(defs);
      setDisplayFields(disp);
    } catch (err) {
      console.error('Failed to load fields settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle single display field (Saves to server & local storage)
  const handleToggleField = async (key: string) => {
    const updated = displayFields.map((f) =>
      f.key === key ? { ...f, visible: !f.visible } : f
    );
    setDisplayFields(updated);
    await personnelService.saveDisplayFields(updated);
    triggerSuccessBanner();
  };

  // Show All Fields (Saves to server & local storage)
  const handleShowAll = async () => {
    const updated = displayFields.map((f) => ({ ...f, visible: true }));
    setDisplayFields(updated);
    await personnelService.saveDisplayFields(updated);
    triggerSuccessBanner();
  };

  // Reset Default Fields (Saves to server & local storage)
  const handleResetDefaults = async () => {
    const defaults = await personnelService.resetDisplayFields();
    setDisplayFields(defaults);
    triggerSuccessBanner();
  };

  const triggerSuccessBanner = () => {
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Add new dynamic custom field
  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim() || !fieldKey.trim()) {
      alert('กรุณากรอกชื่อฟิลด์ภาษาไทยและรหัสฟิลด์');
      return;
    }

    setSavingCustom(true);
    try {
      const cleanKey = fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const created = await personnelService.createFieldDefinition({
        field_label: fieldLabel.trim(),
        field_key: cleanKey,
        field_type: fieldType,
        is_active: true,
      });

      setCustomFields((prev) => [...prev, created]);
      const newDisplay: DisplayFieldSetting = {
        key: cleanKey,
        label: created.field_label,
        category: 'ข้อมูลเสริม (Custom)',
        visible: true,
        description: `ฟิลด์เสริม (${created.field_type})`,
      };
      const updatedDisplay = [...displayFields.filter((f) => f.key !== cleanKey), newDisplay];
      setDisplayFields(updatedDisplay);
      await personnelService.saveDisplayFields(updatedDisplay);

      setFieldLabel('');
      setFieldKey('');
      setFieldType('text');
      alert(`เพิ่มฟิลด์เสริม "${created.field_label}" สำเร็จ`);
    } catch (err) {
      console.error('Failed to add field:', err);
      alert('เกิดข้อผิดพลาดในการเพิ่มฟิลด์');
    } finally {
      setSavingCustom(false);
    }
  };

  // Group display fields by category
  const categories = [
    'ข้อมูลยศและชื่อ',
    'ข้อมูลสังกัดและตำแหน่ง',
    'ข้อมูลส่วนตัวและการแพทย์',
    'ข้อมูลเสริม (Custom)',
  ];

  const visibleCount = displayFields.filter((f) => f.visible).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <SlidersHorizontal className="w-7 h-7 text-slate-800" />
              <span>จัดการการ์ดฟิลด์ข้อมูลที่แสดง (Admin)</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-0.5 font-medium">
              เปิด-ปิด การแสดงผลของการ์ดฟิลด์ข้อมูลกำลังพลในหน้าโปรไฟล์และทำเนียบ
            </p>
          </div>
        </div>

        {/* Live Active Counter Badge */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-black shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>เปิดแสดง {visibleCount} / {displayFields.length} การ์ดฟิลด์</span>
          </span>
        </div>
      </div>

      {/* Tabs Switcher: Display Field Cards vs Add Custom Definitions */}
      <div className="flex items-center space-x-1.5 bg-white p-2 rounded-3xl border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('display')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all ${
            activeTab === 'display'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 text-amber-400" />
          <span>เปิด/ปิด การ์ดฟิลด์ที่แสดง ({visibleCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('definitions')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all ${
            activeTab === 'definitions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>สร้างฟิลด์เสริมใหม่ ({customFields.length})</span>
        </button>
      </div>

      {/* Tab 1: Display Field Cards Manager */}
      {activeTab === 'display' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm sm:text-base text-slate-700 font-medium">
              แตะสวิตช์เพื่อ <strong>เปิด</strong> หรือ <strong>ปิด</strong> การ์ดฟิลด์ข้อมูลที่ต้องการให้แสดงผลในระบบ
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm sm:text-base font-bold transition-all active:scale-95"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>เปิดทั้งหมด</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm sm:text-base font-bold transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>รีเซ็ตค่าเริ่มต้น</span>
              </button>
            </div>
          </div>

          {/* Success Floating Banner */}
          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm sm:text-base text-emerald-800 flex items-center space-x-2.5 animate-in fade-in duration-150 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>บันทึกการตั้งค่าลงเซิร์ฟเวอร์เรียบร้อยแล้ว การเปลี่ยนแปลงมีผลกับทุกเครื่องในระบบทันที</span>
            </div>
          )}

          {/* Grouped Field Cards Grid */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const catFields = displayFields.filter((f) => f.category === cat);
              if (catFields.length === 0) return null;

              return (
                <div key={cat} className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3.5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                      <LayoutGrid className="w-5 h-5 text-slate-700" />
                      <span>หมวดหมู่: {cat}</span>
                    </h3>
                    <span className="text-sm text-slate-500 font-bold">
                      เปิดอยู่ {catFields.filter((f) => f.visible).length} / {catFields.length} ฟิลด์
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {catFields.map((field) => {
                      return (
                        <div
                          key={field.key}
                          onClick={() => handleToggleField(field.key)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 active:scale-[0.99] ${
                            field.visible
                              ? 'bg-slate-50/90 border-slate-300 hover:border-slate-400 shadow-2xs'
                              : 'bg-gray-50/40 border-gray-200 opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-base sm:text-lg font-black ${
                                field.visible ? 'text-slate-900' : 'text-slate-400 line-through'
                              }`}>
                                {field.label}
                              </span>
                              <span className="text-xs sm:text-sm font-mono text-slate-400 font-medium">
                                ({field.key})
                              </span>
                            </div>
                            {field.description && (
                              <p className="text-sm text-slate-500 mt-1 truncate font-medium">
                                {field.description}
                              </p>
                            )}
                          </div>

                          {/* Switch Toggle */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded-full ${
                              field.visible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {field.visible ? 'เปิด' : 'ปิด'}
                            </span>
                            <div className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-0.5 ${
                              field.visible ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}>
                              <div className={`w-7 h-7 rounded-full bg-white shadow-sm transition-transform ${
                                field.visible ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Preview Box of Profile Grid */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <span className="text-sm sm:text-base font-black">
                  ตัวอย่างการแสดงผลการ์ดฟิลด์ในหน้าโปรไฟล์ (Live Preview)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 font-bold">
                แสดงผล {visibleCount} การ์ด
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              ด้านล่างคือตัวอย่างการ์ดที่กำลังพลและผู้ใช้ทั่วไปจะมองเห็นในหน้ารายละเอียดกำลังพล:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {displayFields.map((field) => {
                if (!field.visible) return null;
                return (
                  <div key={field.key} className="bg-slate-800 border border-slate-700 rounded-2xl p-3">
                    <span className="text-xs uppercase font-bold text-slate-400 block truncate">
                      {field.label}
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-300 block truncate mt-1">
                      [ข้อมูลตัวอย่าง]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dynamic Custom Fields Definition Manager */}
      {activeTab === 'definitions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form to Add New Field */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs h-fit space-y-4">
            <div className="flex items-center space-x-2 text-base sm:text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>สร้างฟิลด์เสริมใหม่</span>
            </div>

            <form onSubmit={handleAddCustomField} className="space-y-4">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                  ชื่อฟิลด์ภาษาไทย (field_label) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น ขนาดหมวกเบเร่ต์, ทักษะพิเศษ"
                  value={fieldLabel}
                  onChange={(e) => {
                    setFieldLabel(e.target.value);
                    if (!fieldKey) {
                      setFieldKey(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));
                    }
                  }}
                  required
                  className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                  รหัสตัวแปรภาษาอังกฤษ (field_key) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น beret_size, special_skill"
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 font-mono text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-800 mb-2">
                  ชนิดข้อมูล (field_type)
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as any)}
                  className="w-full px-4 py-3.5 sm:py-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="text">ข้อความทั่วไป (Text)</option>
                  <option value="number">ตัวเลข (Number)</option>
                  <option value="date">วันที่ (Date)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingCustom}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-base sm:text-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
              >
                {savingCustom ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-amber-400" />
                )}
                <span>{savingCustom ? 'กำลังบันทึก...' : 'เพิ่มฟิลด์ลงระบบ'}</span>
              </button>
            </form>
          </div>

          {/* Existing Dynamic Custom Fields List */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs md:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-base sm:text-lg font-black text-slate-900">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>รายการฟิลด์เสริมที่สร้างไว้ ({customFields.length} ฟิลด์)</span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
                <p className="text-sm text-slate-400 font-medium">กำลังโหลดรายการฟิลด์...</p>
              </div>
            ) : customFields.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 font-medium">
                ยังไม่มีฟิลด์เสริมในระบบ
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customFields.map((field) => (
                  <div key={field.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-3 rounded-2xl transition-colors">
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {field.field_label}
                      </div>
                      <div className="text-xs sm:text-sm font-mono text-slate-400 mt-0.5 font-medium">
                        key: {field.field_key}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {field.field_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
