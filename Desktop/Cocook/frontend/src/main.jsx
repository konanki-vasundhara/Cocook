import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import { GoogleOAuthProvider } from "@react-oauth/google";

// ================= GOOGLE CLIENT ID =================

const GOOGLE_CLIENT_ID =
  "357681098088-086csukfra8gb129u79vhvkf9qeftjoi.apps.googleusercontent.com";

// ====================================================

// Prevent app crash if root element missing
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
