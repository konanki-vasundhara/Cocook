// frontend/src/config.js

// Detect hostname dynamically
const hostname =
  typeof window !== 'undefined'
    ? window.location.hostname
    : 'localhost';

// Backend API URL
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (hostname === 'localhost'
    ? 'http://localhost:8000'
    : `http://${hostname}:8000`);

// WebSocket URL
export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  deriveWebSocketUrl();

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Auto-generate websocket URL
function deriveWebSocketUrl() {
  if (typeof window === 'undefined') return '';

  const protocol =
    window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';

  const hostname = window.location.hostname;

  return hostname === 'localhost'
    ? `${protocol}//localhost:8000`
    : `${protocol}//${hostname}:8000`;
}
