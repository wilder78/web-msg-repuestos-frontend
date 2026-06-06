import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { verifyEmailService } from "../services/authService";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setError("Token de verificación no encontrado en la dirección web.");
        setLoading(false);
        return;
      }

      try {
        await verifyEmailService(token);
        setSuccess(true);
      } catch (err) {
        console.error("Error de verificación:", err);
        setError(err.message || "Ocurrió un error al verificar tu cuenta.");
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden font-sans">
      {/* Círculos decorativos en el fondo */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="relative w-full max-w-md">
        {/* Card centralizada con diseño premium y limpio */}
        <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Verificación de Cuenta
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              MeacSoftware / MSG Repuestos
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-300 font-medium text-base">
                Verificando tu cuenta...
              </p>
              <p className="text-slate-500 text-xs text-center">
                Estamos validando tu dirección de correo electrónico con nuestro servidor.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-4 text-center gap-4 animate-fadeScale">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <AlertCircle className="text-red-400 w-12 h-12" />
              </div>
              <h3 className="text-red-300 text-lg font-bold">
                Error de Verificación
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                {error}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
              >
                Volver al Inicio
              </button>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-4 text-center gap-4 animate-fadeScale">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle2 className="text-emerald-400 w-12 h-12 animate-pulse" />
              </div>
              <h3 className="text-emerald-300 text-lg font-bold">
                ¡Cuenta Activada Exitosamente!
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed px-2">
                Tu dirección de correo electrónico ha sido confirmada y tu cuenta ya se encuentra activa para iniciar sesión.
              </p>
              
              <button
                onClick={() => navigate("/login")}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 text-white font-bold rounded-xl text-sm transition flex justify-center items-center gap-2"
              >
                Iniciar Sesión
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
