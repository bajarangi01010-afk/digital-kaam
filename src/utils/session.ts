/**
 * Digital Kaam - Persistent Client Session Engine
 * Allows already-registered workers and customers to persist their sessions across
 * browser refreshes, tab closures, and app restarts.
 */

import { WorkerProfile, CustomerProfile } from '../types';

export const DK_SESSION_KEY = 'dk_persistent_auth_session_v1';

export interface PersistentSession {
  role: 'WORKER' | 'CUSTOMER';
  isLoggedIn: boolean;
  savedAt: number;
  workerData?: WorkerProfile;
  customerData?: CustomerProfile;
}

/**
 * Safely retrieves stored session from localStorage
 */
export function getSavedSession(): PersistentSession | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(DK_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistentSession;
    if (parsed && parsed.isLoggedIn) {
      return parsed;
    }
  } catch (err) {
    console.warn('[DigitalKaam] Error reading persistent session from localStorage:', err);
  }
  return null;
}

/**
 * Saves or updates persistent user session
 */
export function savePersistentSession(
  role: 'WORKER' | 'CUSTOMER',
  userData: WorkerProfile | CustomerProfile
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const session: PersistentSession = {
      role,
      isLoggedIn: true,
      savedAt: Date.now(),
      workerData: role === 'WORKER' ? (userData as WorkerProfile) : undefined,
      customerData: role === 'CUSTOMER' ? (userData as CustomerProfile) : undefined,
    };
    window.localStorage.setItem(DK_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[DigitalKaam] Error writing persistent session to localStorage:', err);
  }
}

/**
 * Updates partial user data inside existing session
 */
export function updatePersistentSessionUser(
  updates: Partial<WorkerProfile | CustomerProfile>
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getSavedSession();
    if (!current || !current.isLoggedIn) return;

    if (current.role === 'WORKER' && current.workerData) {
      current.workerData = { ...current.workerData, ...(updates as Partial<WorkerProfile>) };
    } else if (current.role === 'CUSTOMER' && current.customerData) {
      current.customerData = { ...current.customerData, ...(updates as Partial<CustomerProfile>) };
    }
    current.savedAt = Date.now();
    window.localStorage.setItem(DK_SESSION_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[DigitalKaam] Error updating persistent session in localStorage:', err);
  }
}

/**
 * Clears saved session (on explicit user logout)
 */
export function clearPersistentSession(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(DK_SESSION_KEY);
    // Also clear legacy keys if any
    window.localStorage.removeItem('dk_auth_session');
    window.localStorage.removeItem('dk_user_session');
  } catch (err) {
    console.warn('[DigitalKaam] Error clearing persistent session:', err);
  }
}
