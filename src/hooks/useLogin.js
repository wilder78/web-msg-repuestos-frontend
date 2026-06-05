import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export const useLogin = (isOpen, onClose) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Limpiar el formulario al cerrar el modal
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError("");
      setShowPassword(false);
      setRememberMe(false);
    }
  }, [isOpen]);

  // Manejo de accesibilidad y teclado
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading === true || loading === "success") return;

    setLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);

      if (response) {
        // 1. Extraer el rol correctamente (ajusta según tu API: response.idRol o response.user.idRol)
        const userRol =
          response.idRol || response.user?.idRol || response.data?.idRol;

        setLoading("success");

        setTimeout(() => {
          onClose();

          // Roles 4 y 7 = Clientes → se quedan en la tienda pública
          // El AuthContext ya actualizó el estado reactivamente vía 'auth-changed'
          if ([4, 7].includes(Number(userRol))) {
            navigate("/", { replace: true });
          } else {
            navigate("/dashboard");
          }
        }, 600);
      }
    } catch (err) {
      console.error("Login Error:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Credenciales inválidas";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return {
    state: {
      email,
      password,
      error,
      loading,
      showPassword,
      rememberMe,
      emailFocused,
      passwordFocused,
    },
    actions: {
      setEmail,
      setPassword,
      setShowPassword,
      setRememberMe,
      setEmailFocused,
      setPasswordFocused,
      handleSubmit,
    },
  };
};
