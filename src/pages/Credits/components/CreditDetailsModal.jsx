import React from "react";
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
    CreditCard,
    Calendar,
    TrendingUp,
    Wallet,
    BadgeDollarSign,
    Hash,
    Receipt,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";

// ── Barra de uso del cupo ────────────────────────────────────────────────────
const CreditUsageBar = ({ used, approved }) => {
    const pct = approved > 0 ? Math.min((used / approved) * 100, 100) : 0;
    const barColor =
        pct >= 90 ? "bg-rose-500" : pct >= 60 ? "bg-amber-400" : "bg-emerald-500";
    const label =
        pct >= 90 ? "⚠ Cupo crítico" : pct >= 60 ? "Cupo moderado" : "Cupo saludable";

    return (
        <div className="w-full">
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mb-1">
                <span>Uso: {pct.toFixed(1)}%</span>
                <span>{label}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const fmt = (n) =>
    new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n ?? 0);

// ── Componente principal ─────────────────────────────────────────────────────
export default function CreditDetailsModal({ isOpen, onClose, item, getAvatarColor, getInitials }) {
    const [recentPayments, setRecentPayments] = React.useState([]);
    const [loadingPayments, setLoadingPayments] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen || !item) return;

        const fetchRecentPayments = () => {
            setLoadingPayments(true);
            try {
                // Obtenemos los abonos del almacenamiento mock (usado en useAbonos.js)
                const localData = localStorage.getItem("msg_mock_abonos");
                if (localData) {
                    const allAbonos = JSON.parse(localData);
                    const idCliente = item.idCliente ?? item.id_cliente;
                    
                    // Filtramos por cliente y ordenamos por fecha descendente
                    const clientAbonos = allAbonos
                        .filter(a => String(a.id_cliente) === String(idCliente))
                        .sort((a, b) => new Date(b.fechaCreacion || b.fecha_pago) - new Date(a.fechaCreacion || a.fecha_pago))
                        .slice(0, 3); // Solo los últimos 3
                        
                    setRecentPayments(clientAbonos);
                } else {
                    setRecentPayments([]);
                }
            } catch (err) {
                console.error("Error al cargar pagos recientes:", err);
            } finally {
                setLoadingPayments(false);
            }
        };

        fetchRecentPayments();
    }, [isOpen, item]);

    if (!item) return null;

    const cupoAprobado   = parseFloat(item.cupoAprobado   ?? item.montoCredito ?? 0);
    const cupoUtilizado  = parseFloat(item.cupoUtilizado  ?? 0);
    const cupoDisponible = cupoAprobado - cupoUtilizado;
    const isActive       = item.idEstado === 1 || item.estado === "Activo";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="w-full max-w-4xl lg:max-w-5xl p-0 overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100"
            >
                {/* ── Encabezado estándar ── */}
                <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                    <DialogHeader className="p-6 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                                    Detalle de Crédito
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-sm mt-1">
                                    Información del cupo y cartera asignados al cliente
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* ── Contenido ── */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">

                    {/* Perfil del cliente */}
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm">
                        <div className="flex items-center gap-4 sm:gap-5">
                            <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-4 border-white dark:border-zinc-700 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-850">
                                <AvatarFallback
                                    className={`${getAvatarColor(item.idCliente ?? item.id_cliente)} text-white font-bold text-xl`}
                                >
                                    {getInitials(item.clienteNombre || "Cliente")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {item.clienteNombre || `Cliente #${item.idCliente ?? item.id_cliente}`}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                        variant="outline"
                                        className="bg-slate-50 dark:bg-zinc-850 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 px-3 font-semibold text-[10px] tracking-wide rounded-full font-mono"
                                    >
                                        #C-{item.idCredito}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] px-2.5 py-0.5 tracking-wide rounded-full font-semibold ${
                                            isActive
                                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/50"
                                                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/50"
                                        }`}
                                    >
                                        {isActive ? "Activo" : "Suspendido"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de tarjetas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Cupo aprobado */}
                        <InfoCard icon={BadgeDollarSign} iconColor="emerald" title="Cupo Aprobado">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Límite autorizado</p>
                                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-450 leading-none">
                                    ${fmt(cupoAprobado)}
                                </p>
                            </div>
                            <Separator className="my-2 dark:bg-zinc-800" />
                            <CreditUsageBar used={cupoUtilizado} approved={cupoAprobado} />
                        </InfoCard>

                        {/* Movimientos del cupo */}
                        <InfoCard icon={TrendingUp} iconColor="rose" title="Movimiento de Cupo">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Utilizado</p>
                                <p className="text-xl font-bold text-rose-500 dark:text-rose-400">${fmt(cupoUtilizado)}</p>
                            </div>
                            <Separator className="my-2 dark:bg-zinc-800" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Disponible</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${fmt(cupoDisponible)}</p>
                            </div>
                        </InfoCard>

                        {/* Información del registro */}
                        <InfoCard icon={Hash} iconColor="blue" title="Información del Registro">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">ID de Crédito</p>
                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-250 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded-md inline-block">
                                    #C-{item.idCredito?.toString().padStart(4, "0")}
                                </p>
                            </div>
                            <Separator className="my-2 dark:bg-zinc-800" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">ID Cliente vinculado</p>
                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-250 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded-md inline-block">
                                    #{(item.idCliente ?? item.id_cliente)?.toString().padStart(4, "0")}
                                </p>
                            </div>
                        </InfoCard>

                        {/* Fecha y estado */}
                        <InfoCard icon={Calendar} iconColor="amber" title="Vigencia del Crédito">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Fecha de Aprobación</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                                    {item.fechaAprobacion
                                        ? new Date(item.fechaAprobacion).toLocaleDateString("es-CO", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "No registrada"}
                                </p>
                            </div>
                            <Separator className="my-2 dark:bg-zinc-800" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-zinc-450 mb-1">Estado actual</p>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wide rounded-full font-semibold ${
                                        isActive
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/50"
                                            : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/50"
                                    }`}
                                >
                                    {isActive ? "Activo" : "Suspendido"}
                                </Badge>
                            </div>
                        </InfoCard>
                    </div>

                    {/* Historial de Abonos Recientes */}
                    <div className="bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <div className="bg-white dark:bg-zinc-900 px-5 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-emerald-500 dark:text-emerald-450" />
                                Últimos 3 Abonos Realizados
                            </h4>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-850 px-2 py-0.5 rounded-full border border-slate-100 dark:border-zinc-800">
                                Historial de Cartera
                            </span>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {loadingPayments ? (
                                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs italic bg-white dark:bg-zinc-900">Cargando historial...</div>
                            ) : recentPayments.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs italic bg-white dark:bg-zinc-900">No se registran abonos recientes para este cliente.</div>
                            ) : (
                                recentPayments.map((p) => (
                                    <div key={p.idAbono} className="px-5 py-3.5 hover:bg-white dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between group bg-white dark:bg-zinc-900">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-600 transition-all flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    ${fmt(p.montoAbono)}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                                    {p.fechaCreacion || p.fecha_pago 
                                                        ? new Date(p.fechaCreacion || p.fecha_pago).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) 
                                                        : "Fecha N/A"}
                                                    {p.metodoPago && ` · ${p.metodoPago}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 tracking-tight mb-0.5">Referencia</p>
                                            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-zinc-950 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800">
                                                {p.referencia || (p.idPedido ? `PED-${String(p.idPedido).padStart(3, "0")}` : "N/A")}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
