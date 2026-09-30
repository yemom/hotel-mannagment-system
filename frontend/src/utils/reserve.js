/**
 * reserve.js
 * ---------------------------------------------------------------------------
 * Single source of truth for the "Reserve" authentication flow.
 *
 *   Visitor → reservation CTA → /login → login/register → client reservation page
 *
 * Nothing about the existing authentication stack is replaced here: this module
 * only decides *where* a visitor should be sent and remembers what they were
 * trying to reserve so the client area can reopen it after login.
 */

const INTENT_KEY = 'hotel_reserve_intent';

/** Reservation intents expire so a stale click never hijacks a later session. */
const INTENT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Every reservation entry point in the app. */
export const RESERVE_TARGETS = {
  ROOM: '/client?tab=book',
  TABLE: '/client?tab=restaurant',
  SPA: '/client?tab=spa',
  PROFILE: '/client?tab=profile',
  RESERVATIONS: '/client?tab=reservations',
};

/**
 * Persists what the visitor intended to reserve so it can be reopened after
 * authentication. Silently no-ops when storage is unavailable.
 */
export const setBookingIntent = (intent) => {
  if (!intent) return;
  try {
    window.localStorage.setItem(
      INTENT_KEY,
      JSON.stringify({ ...intent, createdAt: Date.now() })
    );
  } catch (e) {
    console.warn('Unable to persist reservation intent', e);
  }
};

/**
 * Reads the pending reservation intent.
 * @returns {object|null} the intent payload, or null when absent/expired.
 */
export const readBookingIntent = () => {
  try {
    const raw = window.localStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.createdAt && Date.now() - parsed.createdAt > INTENT_TTL_MS) {
      window.localStorage.removeItem(INTENT_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn('Unable to read reservation intent', e);
    return null;
  }
};

/** Clears the pending reservation intent once it has been honoured. */
export const clearBookingIntent = () => {
  try {
    window.localStorage.removeItem(INTENT_KEY);
  } catch (e) {
    console.warn('Unable to clear reservation intent', e);
  }
};

/**
 * Reservation CTA handler shared by the public website and the client area.
 *
 *  - Authenticated guest  → navigates straight to the client reservation page.
 *  - Anonymous visitor    → redirected to /login; after a successful sign-in the
 *                           Login page returns them to `target`, where the client
 *                           dashboard reopens the remembered intent.
 *
 * @param {(to: string|object, options?: object) => void} navigate react-router navigate
 * @param {{user?: object|null, target?: string, intent?: object|null}} options
 */
export const goToReserve = (navigate, { user = null, target = RESERVE_TARGETS.ROOM, intent = null } = {}) => {
  if (typeof navigate !== 'function') return;

  if (intent) setBookingIntent(intent);

  if (user) {
    navigate(target);
    return;
  }

  navigate('/login', { state: { redirectTo: target } });
};

export default {
  RESERVE_TARGETS,
  setBookingIntent,
  readBookingIntent,
  clearBookingIntent,
  goToReserve,
};
