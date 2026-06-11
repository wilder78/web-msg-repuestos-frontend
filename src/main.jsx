import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.jsx";
import { handleUnauthorized, handleForbidden } from "./lib/auth-utils";
import { CartProvider } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import DomErrorBoundary from "./components/DomErrorBoundary.jsx";

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = typeof input === "string" ? input : (input instanceof URL ? input.href : (input && input.url) || "");
  
  const apiBase = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

  if (url.startsWith("/api")) {
    url = apiBase + url.slice(4);
  } else if (url.startsWith("http://localhost:8080/api")) {
    url = apiBase + url.slice("http://localhost:8080/api".length);
  } else if (url.startsWith("http://127.0.0.1:8080/api")) {
    url = apiBase + url.slice("http://127.0.0.1:8080/api".length);
  } else if (url.startsWith("http://localhost:8080/uploads")) {
    url = "/uploads" + url.slice("http://localhost:8080/uploads".length);
  }

  let fetchInput = input;
  if (typeof input === "string") {
    fetchInput = url;
  } else if (input instanceof URL) {
    fetchInput = new URL(url);
  } else if (input && typeof input === "object") {
    try {
      fetchInput = new Request(url, input);
    } catch (e) {
      // Fallback
      input.url = url;
    }
  }

  const response = await originalFetch(fetchInput, init);
  if (response.status === 401) {
    handleUnauthorized(url || "");
  } else if (response.status === 403) {
    handleForbidden();
  }
  return response;
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DomErrorBoundary redirectTo="/dashboard">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 5000,
              }}
            />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </DomErrorBoundary>
  </StrictMode>,
);
