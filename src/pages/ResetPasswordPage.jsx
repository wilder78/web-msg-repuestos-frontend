import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useResetPassword } from "../hooks/useResetPassword";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { state, actions } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redireccionar automáticamente después de 3 segundos si tiene éxito
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        // Redirige al inicio con parámetro login=true para abrir el login modal automáticamente
        navigate("/login", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    actions.handleResetPassword(token, e);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] px-4 py-12 relative overflow-hidden font-sans">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="relative w-full max-w-md">
        {/* Glow exterior */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-3xl blur opacity-25"></div>

        {/* CARD */}
        <div className="relative bg-[#0f0f12]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8 md:p-10">
          {/* Barra superior */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500"></div>

          {/* HEADER */}
          <div className="text-center mb-8 mt-2">
            <img
              src="/imagen/logocuadrado.png"
              alt="MSG Repuestos"
              className="w-20 h-20 mx-auto mb-4 rounded-xl border border-red-500/40 shadow-md object-contain"
            />
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
              Restablecer Contraseña
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Ingresa tu nueva contraseña para asegurar tu cuenta biker.
            </p>
          </div>

          {!token ? (
            <div className="bg-red-500/10 border border-red-500/40 p-4 rounded-2xl flex flex-col items-center gap-3 text-center">
              <AlertCircle className="text-red-400 w-12 h-12" />
              <p className="text-red-300 text-sm font-semibold">
                Token Invalido o Inexistente
              </p>
              <p className="text-gray-400 text-xs">
                El enlace de recuperación no es válido, ha caducado o está incompleto. Por favor solicita un nuevo enlace.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
              >
                Volver al Portal
              </button>
            </div>
          ) : state.success ? (
            <div className="space-y-6 text-center animate-fadeScale">
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-5 rounded-2xl flex flex-col items-center gap-3">
                <CheckCircle2 className="text-emerald-400 w-12 h-12 animate-bounce" />
                <p className="text-emerald-300 text-base font-bold">
                  ¡Contraseña restablecida!
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Tu contraseña se ha cambiado correctamente. En 3 segundos serás redirigido para iniciar sesión.
                </p>
              </div>

              <div className="flex justify-center items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
                <span>Redirigiendo al inicio de sesión</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NUEVA CONTRASEÑA */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={state.nuevaContrasena}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-3.5 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-sm"
                    onChange={(e) => actions.setNuevaContrasena(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={state.confirmarContrasena}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-10 pr-10 py-3.5 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-sm"
                    onChange={(e) => actions.setConfirmarContrasena(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {state.error && (
                <div className="bg-red-500/10 border border-red-500/40 p-3.5 rounded-xl flex gap-2">
                  <AlertCircle className="text-red-400 shrink-0 w-5 h-5" />
                  <p className="text-red-300 text-xs font-medium leading-relaxed">{state.error}</p>
                </div>
              )}

              {/* BOTÓN SUBMIT */}
              <button
                type="submit"
                disabled={state.loading}
                className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30"
              >
                <div className="flex justify-center items-center gap-2">
                  {state.loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Restablecer Contraseña
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
