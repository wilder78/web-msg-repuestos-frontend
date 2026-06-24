import React, { useState } from "react";
import { X, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForgotPassword } from "../../../hooks/useForgotPassword";

export const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { state, actions } = useForgotPassword();
  const [emailFocused, setEmailFocused] = useState(false);

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
        <div className="relative bg-[#FFFFFF] border border-[#DEE2E6] rounded-3xl shadow-2xl overflow-hidden">
          {/* Barra superior */}
          <div className="h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#343A40] hover:bg-black/5 p-1 rounded-full transition"
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

              <h2 className="text-xl font-bold text-[#343A40]">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-[#6C757D] text-sm mt-1">
                Ingresa tu correo y te enviaremos las instrucciones de recuperación.
              </p>
            </div>

            {state.success ? (
              <div className="space-y-6 text-center animate-fadeScale">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center gap-3">
                  <CheckCircle2 className="text-emerald-600 w-12 h-12" />
                  <p className="text-emerald-800 text-sm font-medium">
                    ¡Correo enviado con éxito!
                  </p>
                  <p className="text-gray-600 text-xs">
                    Revisa tu bandeja de entrada (y la carpeta de spam) para seguir el enlace de recuperación.
                  </p>
                </div>

                <button
                  onClick={onSwitchToLogin}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30 cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              /* FORM */
              <form onSubmit={actions.handleForgotPassword} className="space-y-5 bg-[#F8F9FA] p-6 rounded-2xl border border-[#DEE2E6]">
                {/* EMAIL */}
                <div>
                  <label className="text-sm text-[#343A40] font-medium">
                    Correo electrónico
                  </label>
                  <div
                    className={`relative mt-1 transition ${
                      emailFocused ? "scale-[1.02]" : ""
                    }`}
                  >
                    <Mail
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition ${
                        emailFocused ? "text-red-500" : "text-[#6C757D]"
                      }`}
                    />
                    <input
                      type="email"
                      value={state.email}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-[#DEE2E6] rounded-xl text-[#343A40] placeholder-[#6C757D] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      onChange={(e) => actions.setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                    />
                  </div>
                </div>

                {/* ERROR */}
                {state.error && (
                  <div className="bg-red-500/10 border border-red-500/40 p-3 rounded-xl flex gap-2">
                    <AlertCircle className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm">{state.error}</p>
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30 cursor-pointer"
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
                <p className="text-center text-sm text-[#6C757D] mt-4">
                  ¿Te acordaste?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-red-600 hover:text-red-500 font-semibold hover:underline cursor-pointer"
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
