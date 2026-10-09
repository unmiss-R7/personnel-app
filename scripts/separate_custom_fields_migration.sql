-- ==============================================================================
-- Migration: แยก custom_fields ออกเป็นแต่ละคอลัมน์ในตาราง personnel
-- คัดลอกคำสั่งด้านล่างนี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด RUN
-- ==============================================================================

-- 1. เพิ่มคอลัมน์ใหม่สำหรับแต่ละฟิลด์ที่เคยอยู่ใน custom_fields
ALTER TABLE personnel 
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS line_id TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS affiliation TEXT,
  ADD COLUMN IF NOT EXISTS commander TEXT,
  ADD COLUMN IF NOT EXISTS rank_date TEXT,
  ADD COLUMN IF NOT EXISTS personnel_category TEXT,
  ADD COLUMN IF NOT EXISTS reserve_code TEXT;

-- 2. ย้ายข้อมูลเดิมจาก custom_fields (JSONB/JSON) เข้าสู่คอลัมน์ใหม่โดยตรง
UPDATE personnel SET
  gender = COALESCE(gender, custom_fields->>'gender'),
  age = COALESCE(age, CASE WHEN (custom_fields->>'age') ~ '^[0-9]+$' THEN (custom_fields->>'age')::integer ELSE NULL END),
  email = COALESCE(email, custom_fields->>'email'),
  line_id = COALESCE(line_id, custom_fields->>'line_id'),
  notes = COALESCE(notes, custom_fields->>'notes'),
  affiliation = COALESCE(affiliation, custom_fields->>'affiliation'),
  commander = COALESCE(commander, custom_fields->>'commander'),
  rank_date = COALESCE(rank_date, custom_fields->>'rank_date'),
  personnel_category = COALESCE(personnel_category, custom_fields->>'personnel_category'),
  reserve_code = COALESCE(reserve_code, custom_fields->>'reserve_code');

-- ตรวจสอบผลลัพธ์
SELECT id, full_name_th, gender, age, email, line_id, affiliation, commander, rank_date, personnel_category, reserve_code 
FROM personnel 
LIMIT 5;
