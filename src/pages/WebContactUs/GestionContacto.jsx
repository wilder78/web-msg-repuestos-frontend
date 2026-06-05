import React from "react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import { Mail, Phone, MapPin, Send, Building2, UserCircle, Briefcase, Truck } from "lucide-react";

export default function GestionContacto() {
  const staff = [
    {
      role: "Administrador",
      name: "Roberto Gómez",
      email: "admin@msgrepuestos.com",
      phone: "+51 987 654 321",
      icon: <Building2 size={24} className="text-blue-500" />
    },
    {
      role: "Secretaría",
      name: "María Fernanda López",
      email: "secretaria@msgrepuestos.com",
      phone: "+51 987 654 322",
      icon: <Briefcase size={24} className="text-blue-500" />
    },
    {
      role: "Cartera y Cobranzas",
      name: "José Martínez",
      email: "cartera@msgrepuestos.com",
      phone: "+51 987 654 323",
      icon: <UserCircle size={24} className="text-blue-500" />
    },
    {
      role: "Vendedor Corporativo",
      name: "Carlos Rivera",
      email: "ventas1@msgrepuestos.com",
      phone: "+51 987 654 324",
      icon: <UserCircle size={24} className="text-green-500" />
    },
    {
      role: "Asesora Comercial",
      name: "Lucía Fernández",
      email: "ventas2@msgrepuestos.com",
      phone: "+51 987 654 325",
      icon: <UserCircle size={24} className="text-green-500" />
    },
    {
      role: "Ejecutivo de Ventas",
      name: "Andrés Silva",
      email: "ventas3@msgrepuestos.com",
      phone: "+51 987 654 326",
      icon: <UserCircle size={24} className="text-green-500" />
    },
    {
      role: "Jefe de Bodega",
      name: "Miguel Torres",
      email: "bodega@msgrepuestos.com",
      phone: "+51 987 654 327",
      icon: <Truck size={24} className="text-orange-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex-1">
        {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Ponte en <span className="text-blue-400">Contacto</span> con Nosotros
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Comunícate directamente con el departamento que necesites para recibir asistencia personalizada.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Información General y Formulario (Lado Izquierdo) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Oficina Principal</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Dirección</h3>
                    <p className="text-slate-600 mt-1">Av. Principal 1234, Zona Industrial<br/>Ciudad, País</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Teléfono General</h3>
                    <p className="text-slate-600 mt-1">+51 01 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Correo Electrónico</h3>
                    <p className="text-slate-600 mt-1">contacto@msgrepuestos.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-4">¿Tienes una consulta rápida?</h2>
              <p className="text-blue-100 mb-6">Escríbenos y un asesor se pondrá en contacto contigo a la brevedad.</p>
              <form className="space-y-4">
                <input type="text" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white transition-all" />
                <input type="email" placeholder="Tu correo" className="w-full px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white transition-all" />
                <textarea rows="4" placeholder="Tu mensaje" className="w-full px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white transition-all resize-none"></textarea>
                <button type="button" className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                  Enviar Mensaje <Send size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Directorio del Personal (Lado Derecho) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <h2 className="text-3xl font-bold text-slate-900">Directorio de Personal</h2>
                <p className="text-slate-500 mt-2">Comunícate directamente con nuestra área encargada.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {staff.map((member, index) => (
                  <div key={index} className="flex flex-col p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        {member.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{member.role}</h3>
                        <p className="text-slate-500 font-medium">{member.name}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto space-y-2 pt-4 border-t border-slate-200/60">
                      <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                        <Mail size={16} /> {member.email}
                      </a>
                      <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                        <Phone size={16} /> {member.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
