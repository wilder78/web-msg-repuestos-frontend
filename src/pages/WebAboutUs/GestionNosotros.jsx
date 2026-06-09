import React from "react";
import Navbar from "../../components/Navbar/PublicNavbar";
import Footer from "../../components/Footer/Footer";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import { UserCircle, Wrench, ShieldCheck, HeartHandshake } from "lucide-react";
import nosotrosHero from "../../assets/repuestos_banner.png";

export default function GestionNosotros() {
  const team = [
    {
      name: "Carlos Mendoza",
      role: "Especialista en Motor",
      image: "https://i.pravatar.cc/150?u=carlos",
      description: "Con más de 10 años de experiencia, Carlos te ayudará a encontrar el repuesto exacto que tu motor necesita.",
    },
    {
      name: "Ana Rodríguez",
      role: "Asesora de Ventas",
      image: "https://i.pravatar.cc/150?u=ana",
      description: "Ana está lista para brindarte las mejores opciones y cotizaciones adaptadas a tu presupuesto.",
    },
    {
      name: "Luis Gómez",
      role: "Atención al Cliente",
      image: "https://i.pravatar.cc/150?u=luis",
      description: "Tu satisfacción es la prioridad de Luis. Siempre dispuesto a resolver tus dudas y seguir tu pedido.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex-1">
        {/* Hero Section */}
      <section className="relative bg-blue-900 text-white py-20 lg:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${nosotrosHero})` }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Conoce a <span className="text-blue-400">MSG Repuestos</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl max-w-3xl mx-auto text-blue-100">
            Tu aliado confiable en el camino. Proveemos los mejores repuestos automotrices con la calidad y garantía que tu vehículo merece.
          </p>
        </div>
      </section>

      {/* Valores / Misión / Visión */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            <div className="p-8 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Nuestra Misión</h3>
              <p className="text-slate-600 leading-relaxed">
                Brindar soluciones integrales en repuestos automotrices, ofreciendo productos de alta calidad, un servicio excepcional y el respaldo que nuestros clientes necesitan para mantener sus vehículos en óptimas condiciones.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Wrench size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Nuestra Visión</h3>
              <p className="text-slate-600 leading-relaxed">
                Ser la empresa líder y de mayor confianza en la distribución de repuestos a nivel nacional, destacando por nuestra innovación, compromiso y la excelencia en la atención al cliente.
              </p>
            </div>

            <div className="p-8 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <HeartHandshake size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Nuestros Valores</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Integridad y Transparencia</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Calidad Garantizada</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Pasión por el Servicio</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> Innovación Constante</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Equipo de Atención */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Nuestro Equipo de Atención
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-16">
            Detrás de cada gran repuesto, hay un gran equipo. Conoce a los profesionales que están listos para asesorarte.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="relative px-6 pb-8">
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <UserCircle size={64} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-20">
                    <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {member.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <Footer />

      <WhatsAppButton />
    </div>
  );
}
