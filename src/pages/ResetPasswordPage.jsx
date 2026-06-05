import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { resetPasswordService } from "../services/authService";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // Estados locales solicitados
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Estados para visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirección tras 3 segundos en caso de éxito
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validar que no estén vacíos
    if (!nuevaContrasena || !confirmarContrasena) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // 2. Validar que coincidan estrictamente
    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // 3. Validar requisitos mínimos del backend (longitud y complejidad)
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;<>,.?~\\/-]).{8,}$/;
    if (!strongPasswordRegex.test(nuevaContrasena)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir una letra mayúscula, un número y un carácter especial."
      );
      return;
    }

    if (!token) {
      setError("El token de recuperación no es válido o está ausente.");
      return;
    }

    setLoading(true);

    try {
      // 4. Conexión al servicio
      await resetPasswordService(token, nuevaContrasena);
      setSuccess(true);
    } catch (err) {
      console.error("Error al restablecer la contraseña:", err);
      setError(err.message || "Ocurrió un error al intentar restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden font-sans">
      {/* Círculos decorativos elegantes en el fondo */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="relative w-full max-w-md">
        {/* Card centralizada con diseño premium y limpio */}
        <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <Lock className="text-blue-500 w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Restablecer Contraseña
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Ingresa los nuevos datos de acceso para MeacSoftware / MSG Repuestos.
            </p>
          </div>

          {!token ? (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col items-center gap-3 text-center">
              <AlertCircle className="text-red-400 w-10 h-10" />
              <p className="text-red-300 text-sm font-semibold">
                Token Inválido o Ausente
              </p>
              <p className="text-slate-400 text-xs">
                El enlace de recuperación no es válido o ha caducado. Por favor, solicita un nuevo enlace de recuperación.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          ) : success ? (
            <div className="space-y-6 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex flex-col items-center gap-3">
                <CheckCircle2 className="text-emerald-400 w-12 h-12 animate-pulse" />
                <p className="text-emerald-300 text-base font-bold">
                  ¡Contraseña Actualizada!
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Tu contraseña se ha cambiado correctamente. En unos segundos serás redirigido para iniciar sesión.
                </p>
              </div>

              <div className="flex justify-center items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <span>Redirigiendo</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nueva Contraseña */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-sm"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-2">
                  <AlertCircle className="text-red-400 shrink-0 w-5 h-5" />
                  <p className="text-red-300 text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-white transition-all duration-200 flex justify-center items-center gap-2 ${
                  loading
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Restablecer Contraseña
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
