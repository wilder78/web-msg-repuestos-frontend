import { useState } from "react";
import { resetPasswordService } from "../services/authService";

export const useResetPassword = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (token, e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    if (!nuevaContrasena) {
      setError("La nueva contraseña es requerida.");
      return;
    }

    if (nuevaContrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!token) {
      setError("Token de recuperación inválido o ausente.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await resetPasswordService(token, nuevaContrasena);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error al restablecer la contraseña.");
      setLoading(false);
    }
  };

  return {
    state: {
      nuevaContrasena,
      confirmarContrasena,
      loading,
      error,
      success,
    },
    actions: {
      setNuevaContrasena,
      setConfirmarContrasena,
      handleResetPassword,
    },
  };
};
