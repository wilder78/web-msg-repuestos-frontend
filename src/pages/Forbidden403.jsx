import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function Forbidden403() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-100/50">
        <ShieldAlert className="h-12 w-12 text-red-500" />
      </div>
      
      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
        Acceso Denegado
      </h1>
      
      <p className="mb-8 max-w-lg text-base text-slate-500 md:text-lg">
        Lo sentimos, no tienes los permisos necesarios para acceder a la zona administrativa del sistema. Si crees que esto es un error, por favor contacta a soporte técnico.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Regresar al Portal
      </Link>
    </div>
  );
}
