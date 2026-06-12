import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

// Look for environment variables, fallback to placeholder
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1008719970978-hb24n2dstb40o45up4ap9gc9kej6426q.apps.googleusercontent.com";

const GoogleLoginButton = ({ onClose }) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const initializedRef = useRef(false);

  const handleCredentialResponse = async (response) => {
    try {
      setError("");
      const googleToken = response.credential;
      
      const res = await api.post("/auth/google", { token: googleToken });
      const data = res.data;
      
      const token = data.token;
      const user = data.user;
      
      if (token) {
        if (user) {
          const rawActive = user.is_active ?? user.isActive ?? user.is_Active;
          const isAct = rawActive === true || rawActive === 1 || rawActive === "1" || rawActive === "true";
          user.is_active = isAct;
          user.isActive = isAct;
        }
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        window.dispatchEvent(new Event("auth-changed"));
        
        if (onClose) onClose();
        
        const roleId = Number(user.idRol || user.id_rol);
        if ([4, 7].includes(roleId)) {
          navigate("/", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (err) {
      console.error("Error en autenticación de Google:", err);
      setError(err.response?.data?.error || err.message || "Error al autenticar con Google");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("⚠️ Google Client ID is not defined. Please check environment variables.");
      setError("Error de configuración: Client ID de Google no definido.");
      return;
    }

    let interval;
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        
        if (initializedRef.current) return;
        initializedRef.current = true;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        if (containerRef.current) {
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "380",
          });
        }
        
        window.google.accounts.id.prompt();
      }
    };

    interval = setInterval(initializeGoogleSignIn, 100);
    initializeGoogleSignIn();

    return () => {
      clearInterval(interval);
      if (window.google?.accounts?.id && initializedRef.current) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div ref={containerRef} className="w-full min-h-[44px] flex justify-center" />
      {error && <p className="text-red-500 text-xs mt-1 text-center font-bold">{error}</p>}
    </div>
  );
};

export default GoogleLoginButton;
