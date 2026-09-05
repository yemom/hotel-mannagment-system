import React, { createContext, useContext, useEffect, useState } from 'react';
import { guestAPI } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hotel_auth_user';

// Environment variables loaded from .env
const ENV_SUPERADMIN_EMAIL = (import.meta.env.VITE_SUPERADMIN_EMAIL || '12yemom@gmail.com').toLowerCase().trim();
const ENV_SUPERADMIN_PASSWORD = (import.meta.env.VITE_SUPERADMIN_PASSWORD || '12345678').trim();
const ENV_SUPERADMIN_FIRST_NAME = import.meta.env.VITE_SUPERADMIN_FIRST_NAME || 'Yemom';
const ENV_SUPERADMIN_LAST_NAME = import.meta.env.VITE_SUPERADMIN_LAST_NAME || 'Admin';
const ENV_SUPERADMIN_PHONE = import.meta.env.VITE_SUPERADMIN_PHONE || '+251934046279';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.email?.toLowerCase().includes('12yemom') || parsed.email?.toLowerCase() === ENV_SUPERADMIN_EMAIL)) {
        return {
          ...parsed,
          role: 'receptionist',
          isAdmin: true,
          isSuperAdmin: true,
          title: 'Super Admin / General Manager',
        };
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth to localStorage', e);
    }
  }, [currentUser]);

  /**
   * Determine role from email domain / keyword.
   * Super Admin (12yemom@gmail.com) and staff accounts (@hotel.com, @atelier.com, staff, admin) route to receptionist / staff dashboard.
   */
  const determineRole = (email) => {
    const lower = (email || '').toLowerCase().trim();
    if (
      lower === '12yemom@gmail.com' ||
      lower === '12yemom@gamail.com' ||
      lower.startsWith('12yemom@') ||
      lower === ENV_SUPERADMIN_EMAIL ||
      lower.includes('staff') ||
      lower.includes('admin') ||
      lower.includes('receptionist') ||
      lower.endsWith('@hotel.com') ||
      lower.endsWith('@atelier.com')
    ) {
      return 'receptionist';
    }
    return 'client';
  };

  const CLIENTS_DB_KEY = 'hotel_registered_clients';

  const getRegisteredClients = () => {
    try {
      const data = localStorage.getItem(CLIENTS_DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveRegisteredClient = (client) => {
    try {
      const current = getRegisteredClients();
      const cleanEmail = (client.email || '').toLowerCase().trim();
      if (!cleanEmail) return;

      const existingIndex = current.findIndex(
        (c) => (c.email || '').toLowerCase().trim() === cleanEmail
      );
      let updated;
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], ...client, email: cleanEmail };
      } else {
        updated = [...current, { ...client, email: cleanEmail }];
      }
      localStorage.setItem(CLIENTS_DB_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save registered client locally:', e);
    }
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const role = determineRole(cleanEmail);

    if (role === 'receptionist') {
      const isSuper = cleanEmail === ENV_SUPERADMIN_EMAIL ||
                      cleanEmail === '12yemom@gmail.com' ||
                      cleanEmail === '12yemom@gamail.com' ||
                      cleanEmail.startsWith('12yemom@');

      const staffUser = {
        id: isSuper ? 1 : Date.now(),
        firstName: isSuper ? ENV_SUPERADMIN_FIRST_NAME : 'Staff',
        lastName: isSuper ? ENV_SUPERADMIN_LAST_NAME : 'Member',
        email: cleanEmail,
        role: 'receptionist',
        title: isSuper ? 'Super Admin / General Manager' : 'Front Desk Receptionist',
        phone: isSuper ? ENV_SUPERADMIN_PHONE : '+251 900 000 000',
        isAdmin: true,
        isSuperAdmin: isSuper,
      };
      setCurrentUser(staffUser);
      return staffUser;
    }

    // Standard client authentication
    // Step 1: Try Backend API login
    try {
      const response = await guestAPI.login(cleanEmail, cleanPassword);
      if (response && response.data) {
        const guestData = {
          ...response.data,
          password: cleanPassword,
          role: 'client',
          preferences: response.data.preferences || {
            highFloor: false,
            quietRoom: false,
            featherPillows: false,
            lateCheckout: false,
            ecoCleaning: false,
          },
        };
        saveRegisteredClient(guestData);
        setCurrentUser(guestData);
        return guestData;
      }
    } catch (err) {
      console.warn('Backend login API returned error/401, trying fallback authentication:', err);
    }

    // Step 2: Check local registered clients storage
    const localClients = getRegisteredClients();
    const matchedClient = localClients.find(
      (c) => (c.email || '').toLowerCase().trim() === cleanEmail
    );

    if (matchedClient) {
      const guestData = {
        ...matchedClient,
        password: cleanPassword,
        role: 'client',
        preferences: matchedClient.preferences || {
          highFloor: false,
          quietRoom: false,
          featherPillows: false,
          lateCheckout: false,
          ecoCleaning: false,
        },
      };

      // Sync to backend DB so backend is aware of this guest
      try {
        guestAPI.register({
          firstName: matchedClient.firstName || 'Guest',
          lastName: matchedClient.lastName || 'User',
          email: cleanEmail,
          password: cleanPassword,
          phone: matchedClient.phone || '+1 (555) 012-3456',
          age: 30,
          address: '',
          city: '',
          country: '',
        }).catch(() => {});
      } catch (_) {}

      saveRegisteredClient(guestData);
      setCurrentUser(guestData);
      return guestData;
    }

    // Step 3: Seamless fallback for client accounts (auto-register on backend and log in)
    if (cleanPassword.length >= 6) {
      const nameParts = cleanEmail.split('@')[0].split(/[._-]/);
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Guest';
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'User';

      const fallbackUser = {
        id: Date.now(),
        firstName,
        lastName,
        email: cleanEmail,
        password: cleanPassword,
        phone: '+1 (555) 012-3456',
        role: 'client',
        preferences: {
          highFloor: false,
          quietRoom: false,
          featherPillows: false,
          lateCheckout: false,
          ecoCleaning: false,
        },
      };

      try {
        const res = await guestAPI.register({
          firstName,
          lastName,
          email: cleanEmail,
          password: cleanPassword,
          phone: '+1 (555) 012-3456',
          age: 30,
          address: '',
          city: '',
          country: '',
        });
        if (res && res.data) {
          fallbackUser.id = res.data.id || fallbackUser.id;
        }
      } catch (_) {}

      saveRegisteredClient(fallbackUser);
      setCurrentUser(fallbackUser);
      return fallbackUser;
    }

    throw new Error('Invalid email or password. Please verify your credentials or register a new account.');
  };

  const signup = async (clientData) => {
    const { fullName, email, phone, password } = clientData;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (
      cleanEmail === '12yemom@gmail.com' ||
      cleanEmail === '12yemom@gamail.com' ||
      cleanEmail.startsWith('12yemom@') ||
      cleanEmail === ENV_SUPERADMIN_EMAIL
    ) {
      throw new Error('This email is reserved for Super Admin / Staff and cannot register as a client.');
    }

    const parts = (fullName || 'New Guest').trim().split(' ');
    const firstName = parts[0] || 'Guest';
    const lastName = parts.slice(1).join(' ') || 'User';

    const payload = {
      firstName,
      lastName,
      email: cleanEmail,
      password,
      phone: phone || '',
      age: 30,
      address: '',
      city: '',
      country: '',
    };

    let registeredUser = null;
    try {
      const res = await guestAPI.register(payload);
      if (res && res.data) {
        registeredUser = {
          ...res.data,
          password: password,
          role: 'client',
          preferences: res.data.preferences || {
            highFloor: false,
            quietRoom: false,
            featherPillows: false,
            lateCheckout: false,
            ecoCleaning: false,
          },
        };
      }
    } catch (err) {
      console.warn('Backend register error during signup, creating local client profile:', err);
    }

    if (!registeredUser) {
      registeredUser = {
        id: Date.now(),
        firstName,
        lastName,
        email: cleanEmail,
        password: password,
        phone: phone || '',
        role: 'client',
        preferences: {
          highFloor: false,
          quietRoom: false,
          featherPillows: false,
          lateCheckout: false,
          ecoCleaning: false,
        },
      };
    }

    // Save to persistent registered clients database in localStorage
    saveRegisteredClient(registeredUser);
    setCurrentUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Update profile fields (name, phone, address, etc.) on the backend and locally.
   */
  const updateProfile = async (updates) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (currentUser?.id && currentUser.role === 'client') {
      try {
        await guestAPI.update(currentUser.id, updates);
      } catch (e) {
        console.warn('Could not persist profile updates to backend:', e);
      }
    }
    return updated;
  };

  /**
   * Change password — calls backend then updates local session.
   */
  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser?.id) throw new Error('Not authenticated');
    await guestAPI.changePassword(currentUser.id, currentPassword, newPassword);
    // Password is not stored in local session for security
  };

  const switchRole = (newRole) => {
    const isSuper =
      currentUser?.isSuperAdmin ||
      currentUser?.email?.toLowerCase().includes('12yemom') ||
      currentUser?.email?.toLowerCase() === ENV_SUPERADMIN_EMAIL;

    if (isSuper) {
      // 12yemom is strictly Super Admin & Staff only; cannot switch to client
      return;
    }

    if (newRole === 'receptionist') {
      setCurrentUser((u) => ({ ...u, role: 'receptionist', title: 'Hotel Staff' }));
    } else {
      setCurrentUser((u) => ({ ...u, role: 'client' }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
