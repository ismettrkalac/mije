/**
 * Small safe wrapper around localStorage. Every call is guarded so a private
 * browsing mode, disabled storage, or corrupted JSON never crashes the app —
 * it just behaves as if nothing was ever saved.
 */

let storageAvailable: boolean | undefined;

function isStorageAvailable(): boolean {
  if (storageAvailable !== undefined) return storageAvailable;
  try {
    const testKey = "__lily_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function readString(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota / privacy-mode failures; the app degrades gracefully.
  }
}

export const STORAGE_KEYS = {
  lastWateredDate: "lily.lastWateredDate",
  bloomAnimationPlayed: "lily.bloomAnimationPlayed",
} as const;
