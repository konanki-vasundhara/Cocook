// Centralized configuration — all environment variables in one place
// In production, set these via your hosting platform's environment variables
// Vite requires VITE_ prefix for client-side env vars

// API_URL: Backend server URL
// - Development: set VITE_API_URL=http://localhost:8000 in frontend/.env
// - Production: set VITE_API_URL=https://your-api.onrender.com (or your backend URL)
// - If empty/unset and running on same domain, uses relative URLs (empty string)
export const API_URL = import.meta.env.VITE_API_URL || '';

// WS_URL: WebSocket server URL
// - Development: set VITE_WS_URL=ws://localhost:8000 in frontend/.env  
// - Production: set VITE_WS_URL=wss://your-api.onrender.com (note wss:// for HTTPS)
// - If empty/unset, auto-derives from current page URL
export const WS_URL = import.meta.env.VITE_WS_URL || deriveWebSocketUrl();

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Auto-derive WebSocket URL from current page location
// Converts http://domain -> ws://domain, https://domain -> wss://domain
function deriveWebSocketUrl() {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}
