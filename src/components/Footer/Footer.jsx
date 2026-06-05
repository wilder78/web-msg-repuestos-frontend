import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, ChevronRight } from "lucide-react";

const quickLinks = [
  { to: "/", label: "Inicio" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/repuestos", label: "Tienda" },
  { to: "/contacto", label: "Contacto" },
];

const customerLinks = [
  { to: "#", label: "Términos y Condiciones" },
  { to: "#", label: "Políticas de Privacidad" },
  { to: "#", label: "Preguntas Frecuentes" },
];

const socialLinks = [
  { href: "#", icon: Facebook, label: "Facebook" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Columna 1 — Logo + Descripción */}
          <div className="space-y-4">
            <Link to="/" className="block mb-2">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-sm sm:h-16 sm:w-16">
                <img
                  src="/imagen/logocuadrado.png"
                  alt="MSG Repuestos"
                  className="h-full w-full object-cover scale-[1.35]"
                />
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Tu tienda especializada en repuestos y accesorios para motos. Calidad, confianza y el mejor
              servicio para mantener tu moto siempre en marcha.
            </p>
          </div>

          {/* Columna 2 — Enlaces de Interés */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Enlaces de Interés
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                  >
                    <ChevronRight
                      size={14}
                      className="opacity-0 -ml-1.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-blue-400"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Servicio al Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Servicio al Cliente
            </h3>
            <ul className="space-y-3">
              {customerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                  >
                    <ChevronRight
                      size={14}
                      className="opacity-0 -ml-1.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-blue-400"
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 — Contacto */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-blue-400" />
                <span>Av. Principal 123, Lima, Perú</span>
              </li>
              <li>
                <a
                  href="tel:+51987654321"
                  className="inline-flex items-center gap-3 text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  <Phone size={16} className="shrink-0 text-blue-400" />
                  <span>+51 987 654 321</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contacto@msgrepuestos.com"
                  className="inline-flex items-center gap-3 text-sm text-slate-400 hover:text-blue-400 transition-colors duration-200"
                >
                  <Mail size={16} className="shrink-0 text-blue-400" />
                  <span>contacto@msgrepuestos.com</span>
                </a>
              </li>
            </ul>

            {/* Redes Sociales */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-200"
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria + Derechos reservados */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} MSG Repuestos. Todos los derechos reservados.</p>
          <p>
            Diseñado con <span className="text-blue-400">&hearts;</span> para los amantes de las motos
          </p>
        </div>
      </div>
    </footer>
  );
}