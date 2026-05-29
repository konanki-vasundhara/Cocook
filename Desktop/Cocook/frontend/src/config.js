// frontend/src/config.js

// AWS EC2 Backend URL
export const API_URL =
  import.meta.env.VITE_API_URL || "http://13.48.46.198:8000";

// WebSocket URL
export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  API_URL.replace("http://", "ws://").replace("https://", "wss://");

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
