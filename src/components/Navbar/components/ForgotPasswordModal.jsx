import React from "react";
import { X, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForgotPassword } from "../../../hooks/useForgotPassword";

export const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { state, actions } = useForgotPassword();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes fadeScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeScale {
          animation: fadeScale 0.4s ease;
        }
      `}</style>

      <div className="relative w-full max-w-md animate-fadeScale">
        {/* Glow exterior */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-3xl blur opacity-20"></div>

        {/* CARD */}
        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Barra superior */}
          <div className="h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500"></div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* HEADER */}
            <div className="text-center mb-8">
              <img
                src="/imagen/logocuadrado.png"
                alt="MSG Repuestos"
                className="w-20 h-20 mx-auto mb-4 rounded-xl border border-red-500/40 shadow-md"
              />

              <h2 className="text-xl font-bold text-white">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Ingresa tu correo y te enviaremos las instrucciones de recuperación.
              </p>
            </div>

            {state.success ? (
              <div className="space-y-6 text-center animate-fadeScale">
                <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-2xl flex flex-col items-center gap-3">
                  <CheckCircle2 className="text-emerald-400 w-12 h-12" />
                  <p className="text-emerald-300 text-sm font-medium">
                    ¡Correo enviado con éxito!
                  </p>
                  <p className="text-gray-400 text-xs">
                    Revisa tu bandeja de entrada (y la carpeta de spam) para seguir el enlace de recuperación.
                  </p>
                </div>

                <button
                  onClick={onSwitchToLogin}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              /* FORM */
              <form onSubmit={actions.handleForgotPassword} className="space-y-5">
                {/* EMAIL */}
                <div>
                  <label className="text-sm text-gray-300">
                    Correo electrónico
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={state.email}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      onChange={(e) => actions.setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ERROR */}
                {state.error && (
                  <div className="bg-red-500/10 border border-red-500/40 p-3 rounded-xl flex gap-2">
                    <AlertCircle className="text-red-400 shrink-0" />
                    <p className="text-red-300 text-sm">{state.error}</p>
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30 animate-pulse-slow"
                >
                  <div className="flex justify-center items-center gap-2">
                    {state.loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar enlace
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>

                {/* BACK TO LOGIN */}
                <p className="text-center text-sm text-gray-400 mt-4">
                  ¿Te acordaste?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-red-400 hover:underline font-medium"
                  >
                    Inicia sesión
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
