import { useState } from "react";
import { forgotPasswordService } from "../services/authService";

export const useForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError("El correo electrónico es requerido.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Formato de correo electrónico inválido.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await forgotPasswordService(email);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error al enviar el correo de recuperación");
      setLoading(false);
    }
  };

  return {
    state: {
      email,
      loading,
      error,
      success,
    },
    actions: {
      setEmail,
      handleForgotPassword,
    },
  };
};
