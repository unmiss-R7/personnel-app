'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { personnelService } from '@/lib/personnelService';
import { Personnel, splitFullNameTh } from '@/types/personnel';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string; // personnel.id
  citizen_id: string;
  military_id?: string;
  displayName: string;
  role: UserRole;
  department?: string;
  rank_th?: string;
  first_name_th?: string;
  last_name_th?: string;
  rank_en?: string;
  first_name_en?: string;
  last_name_en?: string;
  nickname?: string;
  phone_number?: string;
  photo_url?: string;
  mustChangePassword?: boolean;
}

interface LoginResult {
  success: boolean;
  message?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  personnelData: Personnel | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  changePassword: (newPassword: string) => Promise<boolean>;
  updateSelfProfile: (fields: Partial<Personnel>) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  switchActivePersonnel: (personnel: Personnel) => void;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'engineer_auth_session';
const LOCAL_STORAGE_PASSWORDS_KEY = 'engineer_personnel_passwords';

// Helper to normalize digits
const cleanDigits = (str?: string | null): string => {
  return str ? str.replace(/[^0-9]/g, '') : '';
};

// Get stored passwords map
const getStoredPasswords = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredPasswords = (passwords: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PASSWORDS_KEY, JSON.stringify(passwords));
  } catch (e) {
    console.error('Error saving passwords map', e);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [personnelData, setPersonnelData] = useState<Personnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to build AuthUser from Personnel
  const buildAuthUser = (p: Personnel, role: UserRole = 'user'): AuthUser => {
    const split = splitFullNameTh(p.full_name_th || '');
    return {
      id: p.id,
      citizen_id: p.citizen_id || '',
      military_id: p.military_id || '',
      displayName: p.full_name_th,
      role,
      department: p.department || 'กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน (Unmiss R7)',
      rank_th: p.rank_th || split.rank_th || '',
      first_name_th: p.first_name_th || split.first_name_th || '',
      last_name_th: p.last_name_th || split.last_name_th || '',
      rank_en: p.rank_en || '',
      first_name_en: p.first_name_en || '',
      last_name_en: p.last_name_en || '',
      nickname: p.nickname || '',
      phone_number: p.phone_number || '',
      photo_url: p.photo_url || '',
      mustChangePassword: false,
    };
  };

  // Load session from localStorage on startup and auto-sync with live Supabase
  useEffect(() => {
    async function initSession() {
      try {
        const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        let parsedUser: AuthUser | null = null;
        if (storedSession) {
          try {
            parsedUser = JSON.parse(storedSession);
          } catch {
            parsedUser = null;
          }
        }

        // 1. Fetch live personnel list from Supabase
        let allPersonnel: Personnel[] = [];
        try {
          allPersonnel = await personnelService.getAll();
        } catch (e) {
          console.error('Failed to load personnel list for session init:', e);
        }

        // Preload server display fields in background
        personnelService.fetchDisplayFields().catch(() => {});

        const commander = allPersonnel.find((p) => p.seq_no === 1) || allPersonnel[0] || null;

        if (parsedUser) {
          // Case A: Administrator Session
          if (parsedUser.role === 'admin' || parsedUser.id === 'admin-root') {
            let matchedPersonnel: Personnel | null = null;
            if (parsedUser.id && parsedUser.id !== 'admin-root') {
              matchedPersonnel = allPersonnel.find((p) => p.id === parsedUser.id) || null;
            }
            if (!matchedPersonnel) {
              matchedPersonnel = commander;
            }

            const adminUser: AuthUser = {
              id: matchedPersonnel ? matchedPersonnel.id : 'admin-root',
              citizen_id: matchedPersonnel?.citizen_id || parsedUser.citizen_id || '0-0000-00000-00-0',
              military_id: matchedPersonnel?.military_id || parsedUser.military_id || '',
              displayName: parsedUser.displayName || matchedPersonnel?.full_name_th || 'ผู้ดูแลระบบส่วนกลาง (Admin)',
              role: 'admin',
              department: matchedPersonnel?.department || 'กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน (Unmiss R7)',
              rank_th: matchedPersonnel?.rank_th || parsedUser.rank_th || '',
              first_name_th: matchedPersonnel?.first_name_th || parsedUser.first_name_th || '',
              last_name_th: matchedPersonnel?.last_name_th || parsedUser.last_name_th || '',
              rank_en: matchedPersonnel?.rank_en || parsedUser.rank_en || '',
              first_name_en: matchedPersonnel?.first_name_en || parsedUser.first_name_en || '',
              last_name_en: matchedPersonnel?.last_name_en || parsedUser.last_name_en || '',
              nickname: matchedPersonnel?.nickname || parsedUser.nickname || '',
              phone_number: matchedPersonnel?.phone_number || parsedUser.phone_number || '',
              photo_url: matchedPersonnel?.photo_url || parsedUser.photo_url || '',
              mustChangePassword: false,
            };

            setUser(adminUser);
            setPersonnelData(matchedPersonnel);
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(adminUser));
            return;
          }

          // Case B: Regular User Session - Auto-heal stale mock IDs to live Supabase UUIDs
          let matched: Personnel | null = null;

          // 1. Try finding by ID
          if (parsedUser.id) {
            matched = allPersonnel.find((p) => p.id === parsedUser.id) || null;
          }

          // 2. If ID was mock (e.g. 'personnel-002'), try finding by clean citizen_id
          if (!matched && parsedUser.citizen_id) {
            const cleanCit = cleanDigits(parsedUser.citizen_id);
            if (cleanCit) {
              matched = allPersonnel.find((p) => cleanDigits(p.citizen_id) === cleanCit) || null;
            }
          }

          // 3. Try finding by clean military_id
          if (!matched && parsedUser.military_id) {
            const cleanMil = cleanDigits(parsedUser.military_id);
            if (cleanMil) {
              matched = allPersonnel.find((p) => cleanDigits(p.military_id) === cleanMil) || null;
            }
          }

          if (matched) {
            const syncedUser = buildAuthUser(matched, parsedUser.role || 'user');
            setUser(syncedUser);
            setPersonnelData(matched);
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(syncedUser));
          } else {
            // Stored session was invalid or deleted from database -> clear and require login
            setUser(null);
            setPersonnelData(null);
            localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
          }
        } else {
          // Case C: No session exists in localStorage (never logged in or logged out) -> DO NOT auto-login!
          setUser(null);
          setPersonnelData(null);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  // 1. Login with citizen_id (or 'admin' for system administrator)
  const login = async (identifier: string, password: string): Promise<LoginResult> => {
    const rawInput = identifier.trim();
    const cleanInput = cleanDigits(rawInput);

    // Case A: Administrator special login
    if (rawInput.toLowerCase() === 'admin' && password === 'admin123') {
      try {
        const allPersonnel = await personnelService.getAll();
        const commander = allPersonnel.find((p) => p.seq_no === 1) || allPersonnel[0] || null;

        const adminUser: AuthUser = {
          id: commander ? commander.id : 'admin-root',
          citizen_id: commander?.citizen_id || '0-0000-00000-00-0',
          military_id: commander?.military_id || '',
          displayName: 'ผู้ดูแลระบบส่วนกลาง (Admin)',
          role: 'admin',
          department: commander?.department || 'กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน (Unmiss R7)',
          rank_th: commander?.rank_th || '',
          first_name_th: commander?.first_name_th || 'ผู้ดูแลระบบ',
          last_name_th: commander?.last_name_th || 'ส่วนกลาง',
          rank_en: commander?.rank_en || '',
          first_name_en: commander?.first_name_en || 'ADMIN',
          last_name_en: commander?.last_name_en || 'ROOT',
          nickname: commander?.nickname || '',
          phone_number: commander?.phone_number || '',
          photo_url: commander?.photo_url || '',
          mustChangePassword: false,
        };

        setUser(adminUser);
        setPersonnelData(commander);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(adminUser));
        return { success: true };
      } catch {
        const adminUser: AuthUser = {
          id: 'admin-root',
          citizen_id: '0-0000-00000-00-0',
          displayName: 'ผู้ดูแลระบบส่วนกลาง (Admin)',
          role: 'admin',
          department: 'กองร้อยทหารช่างเฉพาะกิจ ไทย/เซาท์ซูดาน (Unmiss R7)',
          mustChangePassword: false,
        };
        setUser(adminUser);
        setPersonnelData(null);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(adminUser));
        return { success: true };
      }
    }

    // Case B: Login by citizen_id (เลขประจำตัวประชาชน 13 หลัก)
    if (!cleanInput) {
      return {
        success: false,
        message: 'กรุณากรอกเลขประจำตัวประชาชน 13 หลัก',
      };
    }

    try {
      const allPersonnel = await personnelService.getAll();
      const matched = allPersonnel.find((p) => cleanDigits(p.citizen_id) === cleanInput);

      if (!matched) {
        return {
          success: false,
          message: 'ไม่พบเลขประจำตัวประชาชนนี้ในฐานข้อมูลกำลังพล',
        };
      }

      // Check if password has been set previously
      // Priority 1: Supabase database (matched.custom_fields?.password || (matched as any).password)
      // Priority 2: Local storage cache (storedPasswords[cleanInput])
      const dbPassword = matched.custom_fields?.password || (matched as any).password;
      const storedPasswords = getStoredPasswords();
      const localPassword = storedPasswords[cleanInput];
      const effectivePassword = dbPassword || localPassword;

      if (effectivePassword) {
        if (password === effectivePassword) {
          // If password was in local storage but not yet in database, sync to database now!
          if (!dbPassword && localPassword && matched.id) {
            personnelService.update(matched.id, {
              custom_fields: { ...(matched.custom_fields || {}), password: localPassword, password_updated_at: new Date().toISOString() }
            }).catch((e) => console.warn('Auto-sync password to Supabase error:', e));
          }
          // Also save in local storage map on this machine
          if (dbPassword && !localPassword) {
            storedPasswords[cleanInput] = dbPassword;
            saveStoredPasswords(storedPasswords);
          }

          const authUser = buildAuthUser(matched, 'user');
          setUser(authUser);
          setPersonnelData(matched);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
          return { success: true, mustChangePassword: false };
        } else {
          return {
            success: false,
            message: 'รหัสผ่านไม่ถูกต้อง',
          };
        }
      } else {
        // First-Time Login: Password must match military_id (เลขประจำตัวทหาร 10 หลัก)
        const cleanMilitaryId = cleanDigits(matched.military_id);
        const inputPassDigits = cleanDigits(password);

        if (inputPassDigits === cleanMilitaryId || password === matched.military_id) {
          const authUser = buildAuthUser(matched, 'user');
          authUser.mustChangePassword = true;
          setUser(authUser);
          setPersonnelData(matched);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
          return { success: true, mustChangePassword: true };
        } else {
          return {
            success: false,
            message: 'การเข้าสู่ระบบครั้งแรก กรุณาใส่รหัสผ่านเป็นเลขประจำตัวทหาร 10 หลัก',
          };
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล',
      };
    }
  };

  // 2. Change password (persists to Supabase database so it works across all devices)
  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!user || !user.citizen_id) return false;
    const cleanKey = cleanDigits(user.citizen_id);

    try {
      // 1. Save password directly to Supabase database
      let targetId = personnelData?.id || (user.id !== 'admin-root' ? user.id : null);
      if (!targetId) {
        const all = await personnelService.getAll();
        const found = all.find((p) => cleanDigits(p.citizen_id) === cleanKey);
        if (found) targetId = found.id;
      }

      if (targetId) {
        const latest = await personnelService.getById(targetId);
        const existingCustom = latest?.custom_fields || personnelData?.custom_fields || {};
        const updatedCustom = {
          ...existingCustom,
          password: newPassword,
          password_updated_at: new Date().toISOString(),
        };

        const updated = await personnelService.update(targetId, {
          custom_fields: updatedCustom,
        });

        if (updated) {
          setPersonnelData(updated);
        }
      }

      // 2. Also cache in localStorage for fast local lookup
      const stored = getStoredPasswords();
      stored[cleanKey] = newPassword;
      saveStoredPasswords(stored);

      // 3. Update current user state and session
      const updatedUser: AuthUser = {
        ...user,
        mustChangePassword: false,
      };
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      return true;
    } catch (e) {
      console.error('Change password failed', e);
      return false;
    }
  };

  // 3. User & Admin profile updater directly to live Supabase database
  const updateSelfProfile = async (fields: Partial<Personnel>): Promise<boolean> => {
    const targetId = personnelData?.id || (user?.id && user.id !== 'admin-root' ? user.id : null);
    if (!targetId) {
      // If pure admin-root with no linked personnel, update local admin session
      if (user) {
        const updatedUser: AuthUser = {
          ...user,
          displayName: fields.full_name_th || user.displayName,
          rank_th: (fields.rank_th !== undefined && fields.rank_th !== null) ? fields.rank_th : user.rank_th,
          first_name_th: (fields.first_name_th !== undefined && fields.first_name_th !== null) ? fields.first_name_th : user.first_name_th,
          last_name_th: (fields.last_name_th !== undefined && fields.last_name_th !== null) ? fields.last_name_th : user.last_name_th,
          nickname: (fields.nickname !== undefined && fields.nickname !== null) ? fields.nickname : user.nickname,
          phone_number: (fields.phone_number !== undefined && fields.phone_number !== null) ? fields.phone_number : user.phone_number,
          rank_en: (fields.rank_en !== undefined && fields.rank_en !== null) ? fields.rank_en : user.rank_en,
          first_name_en: (fields.first_name_en !== undefined && fields.first_name_en !== null) ? fields.first_name_en : user.first_name_en,
          last_name_en: (fields.last_name_en !== undefined && fields.last_name_en !== null) ? fields.last_name_en : user.last_name_en,
        };
        setUser(updatedUser);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
        return true;
      }
      return false;
    }

    const safeData: Partial<Personnel> = {};
    if (fields.rank_th !== undefined) safeData.rank_th = fields.rank_th;
    if (fields.first_name_th !== undefined) safeData.first_name_th = fields.first_name_th;
    if (fields.last_name_th !== undefined) safeData.last_name_th = fields.last_name_th;
    if (fields.full_name_th !== undefined) safeData.full_name_th = fields.full_name_th;
    if (fields.nickname !== undefined) safeData.nickname = fields.nickname;
    if (fields.phone_number !== undefined) safeData.phone_number = fields.phone_number;
    if (fields.rank_en !== undefined) safeData.rank_en = fields.rank_en;
    if (fields.first_name_en !== undefined) safeData.first_name_en = fields.first_name_en;
    if (fields.last_name_en !== undefined) safeData.last_name_en = fields.last_name_en;
    if (fields.photo_url !== undefined) safeData.photo_url = fields.photo_url;

    // Admin-editable official fields
    if (isAdmin) {
      if (fields.department !== undefined) safeData.department = fields.department;
      if (fields.regular_position !== undefined) safeData.regular_position = fields.regular_position;
      if (fields.field_position !== undefined) safeData.field_position = fields.field_position;
      if (fields.duty_status !== undefined) safeData.duty_status = fields.duty_status;
      if (fields.blood_group !== undefined) safeData.blood_group = fields.blood_group;
      if (fields.religion !== undefined) safeData.religion = fields.religion;
      if (fields.birth_date !== undefined) safeData.birth_date = fields.birth_date;
      if (fields.passport_no !== undefined) safeData.passport_no = fields.passport_no;
      if (fields.salary_step !== undefined) safeData.salary_step = fields.salary_step;
    }

    if (fields.custom_fields !== undefined) {
      const existingCustom = personnelData?.custom_fields || {};
      safeData.custom_fields = {
        ...existingCustom,
        ...fields.custom_fields,
        ...(existingCustom.password ? { password: existingCustom.password } : {}),
        ...(existingCustom.password_updated_at ? { password_updated_at: existingCustom.password_updated_at } : {}),
      };
    }

    try {
      const updated = await personnelService.update(targetId, safeData);
      setPersonnelData(updated);

      const updatedUser: AuthUser = {
        ...(user || {}),
        id: updated.id,
        displayName: updated.full_name_th,
        role: user?.role || 'user',
        department: updated.department || user?.department || '',
        rank_th: updated.rank_th || '',
        first_name_th: updated.first_name_th || '',
        last_name_th: updated.last_name_th || '',
        nickname: updated.nickname || '',
        phone_number: updated.phone_number || '',
        rank_en: updated.rank_en || '',
        first_name_en: updated.first_name_en || '',
        last_name_en: updated.last_name_en || '',
        photo_url: updated.photo_url || user?.photo_url || '',
      } as AuthUser;

      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      return true;
    } catch (err) {
      console.error('Self profile update error:', err);
      return false;
    }
  };

  // 4. Refresh current user data from database
  const refreshUserData = async () => {
    const targetId = personnelData?.id || (user?.id && user.id !== 'admin-root' ? user.id : null);
    if (!targetId) return;
    try {
      const p = await personnelService.getById(targetId);
      if (p) {
        setPersonnelData(p);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                displayName: p.full_name_th,
                department: p.department || prev.department,
                rank_th: p.rank_th || '',
                first_name_th: p.first_name_th || '',
                last_name_th: p.last_name_th || '',
                nickname: p.nickname || '',
                phone_number: p.phone_number || '',
                rank_en: p.rank_en || '',
                first_name_en: p.first_name_en || '',
                last_name_en: p.last_name_en || '',
                photo_url: p.photo_url || prev.photo_url || '',
              }
            : null
        );
      }
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  };

  // 5. Switch active personnel account from live Supabase list
  const switchActivePersonnel = (personnel: Personnel) => {
    const currentRole = user?.role || 'user';
    const newAuthUser = buildAuthUser(personnel, currentRole);
    setUser(newAuthUser);
    setPersonnelData(personnel);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newAuthUser));
  };

  // 6. Quick toggle between Admin & Regular User
  const toggleRole = () => {
    if (!user) return;
    const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser: AuthUser = {
      ...user,
      role: newRole,
    };
    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
  };

  // 7. Logout
  const logout = () => {
    setUser(null);
    setPersonnelData(null);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        personnelData,
        isLoading,
        isAdmin,
        login,
        changePassword,
        updateSelfProfile,
        logout,
        refreshUserData,
        switchActivePersonnel,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
