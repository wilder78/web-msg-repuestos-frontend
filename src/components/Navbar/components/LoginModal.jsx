import React from "react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useLogin } from "../../../hooks/useLogin";

export const LoginModal = ({ isOpen, onClose, onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { state, actions } = useLogin(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ANIMACIONES */}
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
                Bienvenido a tu mundo biker
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Encuentra los mejores repuestos para tu moto
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={actions.handleSubmit} className="space-y-5">
              {/* EMAIL */}
              <div>
                <label className="text-sm text-gray-300">
                  Correo electrónico
                </label>
                <div
                  className={`relative mt-1 transition ${
                    state.emailFocused ? "scale-[1.02]" : ""
                  }`}
                >
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      state.emailFocused ? "text-red-500" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="email"
                    value={state.email}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    onChange={(e) => actions.setEmail(e.target.value)}
                    onFocus={() => actions.setEmailFocused(true)}
                    onBlur={() => actions.setEmailFocused(false)}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex justify-between text-sm">
                  <label className="text-gray-300">Contraseña</label>
                  <button
                    type="button"
                    onClick={onSwitchToForgotPassword}
                    className="text-sm text-red-400 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste?
                  </button>
                </div>

                <div
                  className={`relative mt-1 transition ${
                    state.passwordFocused ? "scale-[1.02]" : ""
                  }`}
                >
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      state.passwordFocused ? "text-red-500" : "text-gray-500"
                    }`}
                  />
                  <input
                    type={state.showPassword ? "text" : "password"}
                    value={state.password}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-black/40 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    onChange={(e) => actions.setPassword(e.target.value)}
                    onFocus={() => actions.setPasswordFocused(true)}
                    onBlur={() => actions.setPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => actions.setShowPassword(!state.showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
                  >
                    {state.showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* CHECK */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    checked={state.rememberMe}
                    onChange={(e) => actions.setRememberMe(e.target.checked)}
                    className="accent-red-500"
                  />
                  Recordarme
                </label>
                <span className="text-xs text-gray-500">
                  🔒 Conexión segura
                </span>
              </div>

              {/* ERROR */}
              {state.error && (
                <div className="bg-red-500/10 border border-red-500/40 p-3 rounded-xl flex gap-2">
                  <AlertCircle className="text-red-400" />
                  <p className="text-red-300 text-sm">{state.error}</p>
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={state.loading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition shadow-lg shadow-red-500/30"
              >
                <div className="flex justify-center items-center gap-2">
                  {state.loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight />
                    </>
                  )}
                </div>
              </button>

            </form>



            {/* REGISTER */}
            <p className="text-center text-sm text-gray-400 mt-5">
              ¿No tienes cuenta?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-red-400 hover:underline"
              >
                Regístrate
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
