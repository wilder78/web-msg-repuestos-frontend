import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Separator } from "../../../components/ui/separator";
import {
  User,
  UserCheck,
  UserX,
  Users,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Globe,
  Map,
  MapPinned,
  Calendar,
  Loader2,
  ShieldOff,
  TrendingUp,
  Wallet,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Barra de uso de crédito ──────────────────────────────────────────────────
const CreditUsageBar = ({ used, approved }) => {
  const pct = approved > 0 ? Math.min((used / approved) * 100, 100) : 0;
  const color =
    pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
        <span>Uso: {pct.toFixed(1)}%</span>
        <span>{pct >= 90 ? "⚠ Cupo crítico" : pct >= 60 ? "Cupo moderado" : "Cupo saludable"}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const CustomerDetailsModal = ({ isOpen, onClose, cliente }) => {
  // Geografía
  const [departmentName, setDepartmentName] = useState("No registrado");
  const [municipalityName, setMunicipalityName] = useState("No registrado");

  // Crédito real del backend
  const [credit, setCredit] = useState(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [creditError, setCreditError] = useState(null);

  // ── Cargar datos geográficos ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !cliente) return;

    if (cliente.municipio?.departamento?.nombre) {
      setDepartmentName(cliente.municipio.departamento.nombre);
      setMunicipalityName(cliente.municipio.nombre || "No registrado");
      return;
    }

    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    if (cliente.idDepartamento) {
      fetch(`${API_BASE_URL}/departments`, { headers })
        .then((r) => r.json())
        .then((data) => {
          const depts = Array.isArray(data) ? data : data.data || [];
          const dept = depts.find(
            (d) =>
              (d.id || d.idDepartamento || d.id_departamento)?.toString() ===
              cliente.idDepartamento?.toString()
          );
          setDepartmentName(dept?.nombre || dept?.name || "Desconocido");
        })
        .catch(() => setDepartmentName("No disponible"));
    } else {
      setDepartmentName("No registrado");
    }

    if (cliente.municipioId || cliente.idMunicipio) {
      fetch(`${API_BASE_URL}/municipalities`, { headers })
        .then((r) => r.json())
        .then((data) => {
          const muns = Array.isArray(data) ? data : data.data || [];
          const id = (cliente.municipioId || cliente.idMunicipio)?.toString();
          const mun = muns.find(
            (m) =>
              (m.id || m.idMunicipio || m.id_municipio)?.toString() === id
          );
          setMunicipalityName(mun?.nombre || mun?.name || "Desconocido");
        })
        .catch(() => setMunicipalityName("No disponible"));
    } else {
      setMunicipalityName("No registrado");
    }
  }, [isOpen, cliente]);

  // ── Cargar crédito asignado desde el backend ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !cliente) return;

    setCredit(null);
    setCreditError(null);
    setLoadingCredit(true);

    fetch(`${API_BASE_URL}/credits`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        const found = list.find(
          (cr) =>
            (cr.idCliente ?? cr.id_cliente) ===
            (cliente.idCliente ?? cliente.id_cliente ?? cliente.id)
        );
        setCredit(found ?? null);
      })
      .catch(() => setCreditError("No se pudo obtener la información de crédito."))
      .finally(() => setLoadingCredit(false));
  }, [isOpen, cliente]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "CL";
    return name.split(" ").map((w) => w.charAt(0)).slice(0, 2).join("").toUpperCase();
  };

  const getAvatarColor = (id) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-sky-500",
    ];
    return colors[(id || 0) % colors.length];
  };

  const fmt = (n) =>
    new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

  if (!isOpen || !cliente) return null;

  // Datos del crédito normalizados
  const cupoAprobado  = parseFloat(credit?.cupoAprobado  ?? credit?.cupo_aprobado  ?? 0);
  const cupoUtilizado = parseFloat(credit?.cupoUtilizado ?? credit?.cupo_utilizado ?? 0);
  const cupoDisponible = cupoAprobado - cupoUtilizado;
  const creditoActivo = (credit?.idEstado ?? credit?.id_estado) === 1;
  const fechaAprobacion = credit?.fechaAprobacion ?? credit?.fecha_aprobacion ?? null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] text-slate-900 dark:text-slate-100"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        {/* ── Cabecera ── */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Ficha del Cliente
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                  Detalles comerciales, de contacto y cartera de crédito
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white dark:bg-zinc-900 overflow-y-auto max-h-[75vh]">

          {/* ── Perfil principal ── */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-950 dark:to-zinc-900/40 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-900 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
                <AvatarFallback className={`${getAvatarColor(cliente.idCliente)} text-white font-bold text-xl`}>
                  {getInitials(cliente.razonSocial)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {cliente.razonSocial}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50 px-3 font-semibold text-[10px] uppercase tracking-wide rounded-full"
                  >
                    {cliente.tipoCliente || "No definido"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                      cliente.activo === 1
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                    }`}
                  >
                    {cliente.activo === 1 ? "activo" : "inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bloque de Cartera y Crédito ── EXPANDIDO ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Encabezado de la sección */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Cartera y Crédito</h4>
              {!loadingCredit && credit && (
                <span className={`ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                  creditoActivo
                    ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}>
                  {creditoActivo ? "Activo" : "Suspendido"}
                </span>
              )}
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900/50">
              {/* Estado: cargando */}
              {loadingCredit && (
                <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Consultando crédito asignado…</span>
                </div>
              )}

              {/* Estado: error */}
              {!loadingCredit && creditError && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">{creditError}</p>
              )}

              {/* Estado: sin crédito */}
              {!loadingCredit && !creditError && !credit && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-4 py-3">
                  <ShieldOff className="h-5 w-5 text-slate-300 dark:text-zinc-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">Sin línea de crédito asignada</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      Este cliente opera únicamente al contado.
                    </p>
                  </div>
                </div>
              )}

              {/* Estado: con crédito ✅ */}
              {!loadingCredit && !creditError && credit && (
                <div className="space-y-4">

                  {/* Cupo aprobado grande */}
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-0.5">
                        Cupo Aprobado
                      </p>
                      <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500 leading-none">
                        ${fmt(cupoAprobado)}
                      </p>
                    </div>
                    {fechaAprobacion && (
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Desde {fechaAprobacion}
                      </p>
                    )}
                  </div>

                  {/* Barra de uso */}
                  <CreditUsageBar used={cupoUtilizado} approved={cupoAprobado} />

                  {/* Utilizado y Disponible */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500/80" />
                        <p className="text-[11px] font-semibold text-rose-400 dark:text-rose-500/85 uppercase tracking-wide">
                          Utilizado
                        </p>
                      </div>
                      <p className="text-xl font-bold text-rose-600 dark:text-rose-400">${fmt(cupoUtilizado)}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/30 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wallet className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500/80" />
                        <p className="text-[11px] font-semibold text-blue-400 dark:text-blue-500/85 uppercase tracking-wide">
                          Disponible
                        </p>
                      </div>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${fmt(cupoDisponible)}</p>
                    </div>
                  </div>

                  {/* ID del crédito */}
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Crédito{" "}
                    <span className="font-mono font-semibold text-slate-500 dark:text-zinc-400">
                      #C-{credit.idCredito ?? credit.id_credito}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Grid inferior: Identificación · Ubicación · Contacto ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Identificación */}
            <InfoCard icon={User} iconColor="blue" title="Identificación">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  {cliente.tipoDocumento?.descripcion || "Documento"}
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">
                    {cliente.tipoDocumento?.sigla || "DOC"}:
                  </span>
                  {cliente.numeroDocumento}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">ID Sistema</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                  #{cliente.idCliente?.toString().padStart(4, "0")}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Fecha de Registro</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  {cliente.fechaRegistro
                    ? new Date(cliente.fechaRegistro).toLocaleDateString(
                        "es-CO",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )
                    : "No disponible"}
                </div>
              </div>
            </InfoCard>

            {/* Ubicación geográfica */}
            <InfoCard icon={MapPin} iconColor="rose" title="Ubicación Geográfica">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Dirección Principal</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 italic">
                  {cliente.direccion || "No registrada"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Departamento</p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-zinc-300">
                    <Map className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500" />
                    {departmentName}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                    Municipio / Ciudad
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-zinc-300">
                    <MapPinned className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500" />
                    {municipalityName}
                  </div>
                </div>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Zona de Despacho</p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
                  <Globe className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500" />
                  {cliente.zona?.nombreZona || `Zona ID: ${cliente.idZona || "N/A"}`}
                </div>
              </div>
            </InfoCard>

            {/* Canales de contacto */}
            <InfoCard
              icon={Mail}
              iconColor="violet"
              title="Canales de Contacto"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  Persona de Contacto
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {cliente.personaContacto || "No establecida"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  Correo Electrónico
                </p>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 break-all">
                  {cliente.email || "Sin correo"}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  Teléfono / WhatsApp
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  {cliente.telefono || "Sin teléfono"}
                </p>
              </div>
            </InfoCard>

            {/* Usuario de acceso */}
            <InfoCard icon={UserCheck} iconColor="emerald" title="Usuario de Acceso">
              {cliente.usuario ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Nombre de Usuario</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    {cliente.usuario.nombreUsuario}
                  </p>
                  <Separator className="my-2 dark:bg-zinc-800" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Correo Electrónico</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                    {cliente.usuario.email}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 px-4 py-3">
                  <UserX className="h-5 w-5 text-slate-300 dark:text-zinc-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">Sin usuario asignado</p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      Este cliente no tiene credenciales de acceso al sistema.
                    </p>
                  </div>
                </div>
              )}
            </InfoCard>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsModal;
