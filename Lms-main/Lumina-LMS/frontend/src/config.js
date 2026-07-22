export const DEMO_MODE = false;

let apiBase = import.meta.env.VITE_API_URL || '/api';
if (typeof apiBase === 'string' && apiBase.startsWith('VITE_API_URL=')) {
  apiBase = apiBase.substring('VITE_API_URL='.length);
}

export const API_BASE = apiBase;
