import React, { useState, useRef } from "react";
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const PASSWORD_RULES = [
  { re: /.{8,}/, label: "Mínimo 8 caracteres" },
  { re: /[A-Z]/, label: "Una mayúscula" },
  { re: /[0-9]/, label: "Un número" },
  { re: /[!@#$%^&*()_+\-={}\[\]:;<>,.?~\\/]/, label: "Un carácter especial (*, -, #, etc.)" },
];

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailTimer = useRef(null);

  const passwordErrors = PASSWORD_RULES.filter((r) => !r.re.test(password));
  const passwordValid = passwordErrors.length === 0 && password.length > 0;

  const checkEmailAvailability = (value) => {
    clearTimeout(emailTimer.current);
    if (!value || !value.includes("@")) { setEmailStatus(null); return; }
    setEmailStatus("checking");
    emailTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/users/check-email/${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.disponible) {
          setEmailStatus("available");
        } else {
          setEmailStatus(data.isActive === false ? "inactive" : "taken");
        }
      } catch { setEmailStatus(null); }
    }, 500);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (!passwordValid) { setError("La contraseña no cumple los requisitos de seguridad"); return; }
    if (emailStatus === "taken") { setError("Este correo ya está registrado"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreUsuario: nombre.trim(),
          email,
          password,
          idRol: 4,
          idEstado: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      if (data.message && (data.message.includes("activar") || data.message.includes("activación"))) {
        setSuccessMsg(data.message);
        setNombre("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setEmailStatus(null);
        return;
      }

      if (onRegisterSuccess) onRegisterSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes shine { from { transform:translateX(-100%) skewX(-15deg); } to { transform:translateX(200%) skewX(-15deg); } }
        .btn-nitro { position:relative; overflow:hidden; }
        .btn-nitro::after { content:""; position:absolute; top:0; left:0; width:50%; height:100%; background:linear-gradient(to right,transparent,rgba(255,255,255,0.2),transparent); animation:shine 3s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

      <div className="bg-[#0f0f12]/95 w-full max-w-md rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)] overflow-hidden relative animate-slide-up border border-white/10 max-h-[90vh] flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shrink-0"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all z-20">
          <X size={20} />
        </button>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <header className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative p-1 rounded-xl bg-gradient-to-b from-white/10 to-transparent">
                <img src="/public/imagen/logocuadrado.png" alt="Logo MSG" className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
              </div>
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight">Crea tu cuenta</h2>
            <p className="text-gray-400 text-sm mt-1 px-2">Únete a la comunidad líder en repuestos y accesorios</p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-600/10 border border-red-600/50 rounded-xl text-red-500 text-xs text-center font-bold">{error}</div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-600/10 border border-emerald-600/50 rounded-xl text-emerald-500 text-xs text-center font-bold">{successMsg}</div>
            )}

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full pl-12 pr-4 py-3.5 bg-[#16161a] border border-white/5 rounded-xl outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-600/10 text-gray-100 placeholder:text-gray-600 shadow-inner transition-all text-sm" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); checkEmailAvailability(e.target.value); }}
                  placeholder="tu@email.com"
                  className={`w-full pl-12 pr-10 py-3.5 bg-[#16161a] border rounded-xl outline-none focus:ring-4 text-gray-100 placeholder:text-gray-600 shadow-inner transition-all text-sm ${
                    emailStatus === "taken" ? "border-red-600/50 focus:ring-red-600/10" : emailStatus === "inactive" ? "border-amber-500/50 focus:ring-amber-600/10" : emailStatus === "available" ? "border-emerald-500/50 focus:ring-emerald-600/10" : "border-white/5 focus:border-red-600/50 focus:ring-red-600/10"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {emailStatus === "checking" && <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />}
                  {emailStatus === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {emailStatus === "taken" && <XCircle className="h-4 w-4 text-red-500" />}
                  {emailStatus === "inactive" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                </span>
              </div>
              {emailStatus === "taken" && <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1 ml-1"><AlertCircle size={10} /> Este correo ya está registrado</p>}
              {emailStatus === "inactive" && <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 ml-1"><AlertCircle size={10} /> Registrado pero sin activar. Regístrate para recibir otro enlace.</p>}
              {emailStatus === "available" && <p className="text-[10px] text-emerald-400 mt-1 ml-1">Correo disponible</p>}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-[#16161a] border rounded-xl outline-none focus:ring-4 text-gray-100 placeholder:text-gray-600 shadow-inner transition-all text-sm ${
                    password && !passwordValid ? "border-amber-500/50 focus:ring-amber-600/10" : passwordValid ? "border-emerald-500/50 focus:ring-emerald-600/10" : "border-white/5 focus:border-red-600/50 focus:ring-red-600/10"
                  }`}
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmar contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-[#16161a] border rounded-xl outline-none focus:ring-4 text-gray-100 placeholder:text-gray-600 shadow-inner transition-all text-sm ${
                    confirmPassword && password !== confirmPassword ? "border-red-600/50 focus:ring-red-600/10" : "border-white/5 focus:border-red-600/50 focus:ring-red-600/10"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && <p className="text-[10px] text-red-400 mt-1 ml-1">Las contraseñas no coinciden</p>}
            </div>

            {/* Indicador de fortaleza */}
            {password && (
              <div className="bg-[#16161a] rounded-xl border border-white/5 p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requisitos de seguridad</p>
                {PASSWORD_RULES.map((rule, i) => {
                  const ok = rule.re.test(password);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {ok ? <CheckCircle2 size={10} className="text-emerald-500 shrink-0" /> : <XCircle size={10} className="text-amber-500 shrink-0" />}
                      <span className={`text-[10px] ${ok ? "text-emerald-400" : "text-gray-500"}`}>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Términos */}
            <div className="flex items-start gap-3 px-1 py-2">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-white/10 bg-gray-800 text-red-600 focus:ring-red-500/50 cursor-pointer" />
              <p className="text-[10px] text-gray-500 leading-tight">
                Acepto los <span className="text-red-500 cursor-pointer hover:text-red-400 transition-colors font-bold">Términos de servicio</span> y la{" "}
                <span className="text-red-500 cursor-pointer hover:text-red-400 transition-colors font-bold">Política de privacidad</span>.
              </p>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting || emailStatus === "taken"}
              className={`w-full rounded-xl font-black uppercase tracking-widest py-4 flex items-center justify-center gap-3 transition-all active:scale-95 ${
                submitting ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "btn-nitro bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
              }`}
            >
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> Registrando...</>
              ) : (
                <><span className="relative z-10">Registrarse</span> <ArrowRight size={20} className="relative z-10" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes una cuenta?{" "}
              <button onClick={onSwitchToLogin} className="text-white hover:text-red-500 font-bold transition-all underline-offset-4 hover:underline">
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;