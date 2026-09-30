/**
 * propertyImages.js
 * ---------------------------------------------------------------------------
 * Presentation-only helpers that attach premium hotel photography to the
 * entities returned by the backend.
 *
 * IMPORTANT:
 *  - No hotel data is invented here. Rooms / tables / spa services always come
 *    from the Spring Boot API + H2 database.
 *  - `SpaService` entities already persist a real `imageUrl` in the database, so
 *    that value always wins. The per-category map below is only a fallback for
 *    services whose image has not been uploaded yet.
 *  - `Room` entities have no image column in the database, so room photography
 *    is selected by `roomType` (a real database value) for display purposes.
 */

/* ── Room photography, keyed by the real RoomType enum values ─────────────── */
const ROOM_IMAGES = {
  SINGLE: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  ],
  DOUBLE: [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  ],
  SUITE: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  ],
  DELUXE: [
    'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  ],
  PENTHOUSE: [
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  ],
};

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80';

/** Deterministic variant picker so a room keeps the same photo across renders. */
const pickVariant = (list, seed) => {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_ROOM_IMAGE;
  const key = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return list[hash % list.length];
};

/**
 * Returns the room photograph for a backend `Room` payload.
 * @param {{id?: number|string, roomNumber?: string, roomType?: string}} room
 * @returns {string} image URL
 */
export const getRoomImage = (room) => {
  if (!room) return DEFAULT_ROOM_IMAGE;
  if (room.image && typeof room.image === 'string' && room.image.trim()) {
    return room.image;
  }
  const type = String(room.roomType || '').toUpperCase();
  const seed = room.roomNumber || room.id || type;
  return pickVariant(ROOM_IMAGES[type], seed);
};

/**
 * Convenience wrapper used by catalogues: returns the room payload with an
 * `image` field resolved (never mutates the original object).
 */
export const withRoomImage = (room) => {
  if (!room) return room;
  return { ...room, image: getRoomImage(room) };
};

/* ── Spa photography, keyed by the real SpaCategory enum values ───────────── */
const SPA_IMAGES = {
  MASSAGE:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
  FACIAL:
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
  BODY_TREATMENT:
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
  WELLNESS:
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
  COUPLES:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  BEAUTY:
    'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_SPA_IMAGE = SPA_IMAGES.WELLNESS;

/**
 * Returns the spa photograph for a backend `SpaService` payload.
 * The stored `imageUrl` from the database always takes precedence.
 * @param {{imageUrl?: string, image?: string, category?: string, name?: string}} service
 * @returns {string} image URL
 */
export const getSpaImage = (service) => {
  if (!service) return DEFAULT_SPA_IMAGE;
  const stored = service.imageUrl || service.image;
  if (typeof stored === 'string' && stored.trim()) return stored;
  const category = String(service.category || '').toUpperCase();
  return SPA_IMAGES[category] || DEFAULT_SPA_IMAGE;
};

/** Convenience wrapper returning the service payload with `image` resolved. */
export const withSpaImage = (service) => {
  if (!service) return service;
  return { ...service, image: getSpaImage(service) };
};

export default {
  getRoomImage,
  withRoomImage,
  getSpaImage,
  withSpaImage,
};
