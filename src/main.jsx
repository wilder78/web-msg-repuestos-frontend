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
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : args[0].url);
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
