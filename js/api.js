import { ANIME_API } from "./config.js";

export async function fetchData(endpoint, options = {}) {
  try {
    const res = await fetch(`${ANIME_API}${endpoint}`, options);
    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

/**
 * Fetch data dengan fallback ke URL cadangan jika URL utama gagal
 * @param {string} endpoint - Path endpoint (misal: /login)
 * @param {string} primaryBase - URL utama (misal: USER_API)
 * @param {string} backupBase - URL cadangan (misal: USER_API_BACKUP)
 * @param {object} options - Options untuk fetch (method, body, headers, dll)
 */
export async function fetchWithFallback(endpoint, primaryBase, backupBase, options = {}) {
  try {
    const res = await fetch(`${primaryBase}${endpoint}`, options);
    if (!res.ok && res.status >= 500) throw new Error(`Primary UI Error: ${res.status}`);
    return res;
  } catch (err) {
    console.warn(`Primary API gagal (${primaryBase}${endpoint}), mencoba backup...`, err);
    try {
      const resBackup = await fetch(`${backupBase}${endpoint}`, options);
      return resBackup;
    } catch (backupErr) {
      console.error(`Backup API juga gagal (${backupBase}${endpoint}):`, backupErr);
      throw backupErr;
    }
  }
}
