import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Separator } from "../../../components/ui/separator";
import {
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Hash,
  CalendarDays,
  AlertCircle,
  TrendingUp,
  Receipt,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

/* ── helpers ─────────────────────────────────────────── */
const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || null;

const authFetch = (url, opts = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
};

const formatCOP = (v) =>
  `$${parseFloat(v || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const formatFecha = (f) => {
  if (!f) return "—";
  try {
    return new Date(f).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return f;
  }
};

/* ── badge de estado ─────────────────────────────────── */
const EstadoBadge = ({ idEstado }) => {
  const isCancelled = idEstado === 3;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
        isCancelled
          ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
          : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
      }`}
    >
      {isCancelled ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      {isCancelled ? "Anulado" : "Activo"}
    </span>
  );
};

/* ── componente principal ────────────────────────────── */
const PedidoAbonosModal = ({ isOpen, onClose, pedido }) => {
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080/api"
  ).replace(/\/$/, "");

  const pedidoId =
    pedido?.idPedido ?? pedido?.id_pedido ?? pedido?.id ?? null;

  const totalPedido = parseFloat(
    pedido?.total_neto ?? pedido?.totalNeto ?? pedido?.total ?? 0
  );

  useEffect(() => {
    if (!isOpen || !pedidoId) return;

    const fetchAbonos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/abonos`);
        if (!res.ok) throw new Error("Error al obtener abonos del servidor.");
        const data = await res.json();
        const filtrados = (Array.isArray(data) ? data : []).filter(
          (a) => Number(a.idPedido) === Number(pedidoId)
        );
        setAbonos(filtrados);
      } catch (err) {
        setError(err.message || "Error interno.");
      } finally {
        setLoading(false);
      }
    };

    fetchAbonos();
  }, [isOpen, pedidoId, API_URL]);

  if (!pedido) return null;

  /* cálculos */
  const totalAbonado = abonos
    .filter((a) => a.idEstado !== 3)
    .reduce((acc, a) => acc + parseFloat(a.montoAbono || 0), 0);

  const saldoPendiente = Math.max(0, totalPedido - totalAbonado);
  const porcentajePagado =
    totalPedido > 0 ? Math.min(100, (totalAbonado / totalPedido) * 100) : 0;
  const estaSaldado = saldoPendiente === 0 && totalPedido > 0;

  const pedidoCode = `PED-${String(pedidoId).padStart(3, "0")}`;
  const clienteNombre =
    pedido?.cliente?.razonSocial ||
    pedido?.nombreCliente ||
    pedido?.clienteNombre ||
    "Cliente";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] p-0 overflow-hidden bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl text-slate-900 dark:text-slate-100"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* ── Encabezado ── */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Historial de Abonos
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                    {pedidoCode} — {clienteNombre}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto bg-white dark:bg-zinc-900">
          {/* ── Perfil / Resumen principal ── */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {pedidoCode}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
                    {clienteNombre}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-450 mt-1">
                    Total del pedido: {formatCOP(totalPedido)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border mb-2 inline-flex items-center gap-1.5 ${
                    estaSaldado
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                      : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      estaSaldado ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {estaSaldado ? "Saldado" : "Pendiente"}
                </span>
                <p
                  className={`text-3xl font-black ${
                    estaSaldado ? "text-emerald-600 dark:text-emerald-400" : "text-violet-700 dark:text-violet-405"
                  }`}
                >
                  {formatCOP(totalAbonado)}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">total abonado</p>
              </div>
            </div>
          </div>

          {/* ── InfoCards de resumen ── */}
          <div className="grid grid-cols-2 gap-4">
            <InfoCard icon={TrendingUp} iconColor="violet" title="Progreso de Pago">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Porcentaje pagado</p>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-2">
                  {porcentajePagado.toFixed(1)}%
                </p>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      estaSaldado ? "bg-emerald-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${porcentajePagado}%` }}
                  />
                </div>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Número de abonos</p>
                <p className="text-sm font-mono font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block">
                  {abonos.filter((a) => a.idEstado !== 3).length} activos
                  {abonos.filter((a) => a.idEstado === 3).length > 0 &&
                    ` / ${abonos.filter((a) => a.idEstado === 3).length} anulados`}
                </p>
              </div>
            </InfoCard>

            <InfoCard icon={DollarSign} iconColor="emerald" title="Balance">
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Total abonado</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCOP(totalAbonado)}
                </p>
              </div>
              <Separator className="my-2 dark:bg-zinc-800" />
              <div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Saldo pendiente</p>
                <p
                  className={`text-sm font-bold ${
                    estaSaldado ? "text-slate-400 dark:text-zinc-550" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {estaSaldado ? "—" : formatCOP(saldoPendiente)}
                </p>
              </div>
            </InfoCard>
          </div>

          {/* ── Lista de abonos ── */}
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-slate-500 dark:text-zinc-450" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                Recibos de Caja Registrados
              </h4>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400 dark:text-zinc-500">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm">Cargando abonos...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-rose-500 dark:text-rose-450">
                <AlertCircle className="h-7 w-7" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : abonos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 dark:text-zinc-500">
                <DollarSign className="h-10 w-10 opacity-25" />
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No hay abonos registrados para este pedido
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {abonos.map((abono, idx) => (
                  <div
                    key={abono.idAbono ?? idx}
                    className={`rounded-xl border p-4 transition-all ${
                      abono.idEstado === 3
                        ? "border-slate-100 bg-slate-50 dark:border-zinc-800/50 dark:bg-zinc-950/40 opacity-60"
                        : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-900/40 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
                          <CreditCard className="h-4 w-4 text-violet-600 dark:text-violet-450" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                              RCP-{String(abono.idAbono).padStart(4, "0")}
                            </span>
                            <EstadoBadge idEstado={abono.idEstado} />
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mt-0.5 truncate">
                            {abono.descripcion || "Abono a pedido"}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-lg font-black shrink-0 ${
                          abono.idEstado === 3
                            ? "text-slate-400 dark:text-zinc-500 line-through"
                            : "text-emerald-600 dark:text-emerald-450"
                        }`}
                      >
                        {formatCOP(abono.montoAbono)}
                      </p>
                    </div>

                    <Separator className="my-2 dark:bg-zinc-800" />

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                        {formatFecha(abono.fechaAbono)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                        {abono.metodoPago || "—"}
                      </span>
                      {abono.referencia && abono.referencia !== "N/A" && (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                          Ref: {abono.referencia}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PedidoAbonosModal;
