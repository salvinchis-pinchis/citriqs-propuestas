"use client";
// Persistencia en el navegador (localStorage). Cada navegador guarda lo suyo:
// para compartir precios entre socios usá Exportar / Importar en Configuración.
import { DEFAULT_CONFIG } from "./defaults";

const K_CONFIG = "citriq.config.v1";
const K_HIST = "citriq.historial.v1";
const K_SEQ = "citriq.secuencia.v1";

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadConfig() {
  const c = read(K_CONFIG, null);
  if (!c || typeof c !== "object") return structuredClone(DEFAULT_CONFIG);
  // completa campos nuevos si la config guardada es vieja
  return {
    ...structuredClone(DEFAULT_CONFIG),
    ...c,
    empresa: { ...DEFAULT_CONFIG.empresa, ...(c.empresa || {}) },
  };
}
export const saveConfig = (c) => write(K_CONFIG, c);
export const resetConfig = () => {
  try { window.localStorage.removeItem(K_CONFIG); } catch {}
  return structuredClone(DEFAULT_CONFIG);
};

export const loadHistorial = () => read(K_HIST, []);
export const saveHistorial = (h) => write(K_HIST, h);

export function upsertPropuesta(p) {
  const h = loadHistorial();
  const i = h.findIndex((x) => x.numero === p.numero);
  if (i >= 0) h[i] = { ...h[i], ...p };
  else h.unshift(p);
  saveHistorial(h);
  return h;
}

export function nextNumero() {
  const year = new Date().getFullYear();
  const seq = read(K_SEQ, { year, n: 0 });
  const n = seq.year === year ? seq.n + 1 : 1;
  return { numero: `CQ-${year}-${String(n).padStart(3, "0")}`, commit: () => write(K_SEQ, { year, n }) };
}
