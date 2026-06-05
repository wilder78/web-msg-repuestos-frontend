import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  Loader2,
  Package,
  Pencil,
  User,
  X,
  XCircle,
} from "lucide-react";
import StatusDropdown from "../../../components/shared/StatusDropdown";
import { Can } from "../../../components/shared/Can";

/* ── Helpers ─────────────────────────────────────────────────── */
const getPedidoId  = (p) => p?.idPedido ?? p?.id_pedido ?? p?.id;

const formatPedidoCode = (pedido) => {
  const id = getPedidoId(pedido);
  return id ? `PED-${String(id).padStart(3, "0")}` : "PED-000";
};

const formatPedidoDate = (pedido) => {
  const rawDate = pedido?.fechaPedido ?? pedido?.fecha_pedido ?? pedido?.fecha;
  if (!rawDate) return "Sin fecha";
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d
    .toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
};

/* ── Metadatos de estado (compartidos) ──────────────────────── */
export const PEDIDO_STATUS_OPTIONS = [
  { value: 1, label: "En Proceso",  Icon: Clock3,       className: "border-amber-200  bg-amber-100  text-amber-700"  },
  { value: 2, label: "Despachado",  Icon: Package,      className: "border-emerald-200 bg-emerald-100 text-emerald-700" },
  { value: 3, label: "Cancelado",   Icon: XCircle,      className: "border-red-200    bg-red-100    text-red-700"    },
  { value: 4, label: "Entregado",   Icon: CheckCircle2, className: "border-blue-200   bg-blue-100   text-blue-700"   },
  { value: 5, label: "Pagado",      Icon: DollarSign,   className: "border-violet-200 bg-violet-100 text-violet-700" },
];

export const getStatusMeta = (statusId) =>
  PEDIDO_STATUS_OPTIONS.find((o) => o.value === Number(statusId)) ?? PEDIDO_STATUS_OPTIONS[0];

/* ── IconButton ─────────────────────────────────────────────── */
const IconButton = ({ label, colorClass, onClick, children, disabled = false }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition
      hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-zinc-700
      disabled:cursor-not-allowed disabled:opacity-40 ${colorClass}`}
  >
    {children}
  </button>
);

/* ── Componente Principal ────────────────────────────────────── */
const PedidoTable = ({
  pedidos,
  loading,
  onView,
  onEdit,
  onStatusChange,
  onAbonos,
}) => {
  const currentUserStr = localStorage.getItem("user");
  let currentUser = null;
  try { currentUser = currentUserStr ? JSON.parse(currentUserStr) : null; } catch (e) {}
  const isMasterUser =
    currentUser &&
    (currentUser.idRol === 1 ||
      currentUser.id_rol === 1 ||
      currentUser.nombreUsuario?.toLowerCase() === "master");

  /* ── Construir opciones visibles según estado y rol ────────── */
  const buildOptions = (pedido) => {
    const currentStatus = Number(pedido.idEstado ?? pedido.id_estado_pedido ?? 1);
    return PEDIDO_STATUS_OPTIONS.filter((opt) => {
      if (opt.value === 5 && currentStatus !== 5) return false;        // Pagado: solo si ya está pagado
      if (opt.value === 3 && currentStatus !== 3) return false;        // Cancelado: solo si ya está cancelado
      if (currentStatus === 4 && !isMasterUser && opt.value < 4) return false; // Entregado sin master
      return true;
    });
  };

  /* ── Loading / vacío ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 border-t border-slate-200 dark:border-zinc-800">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60">
        <p className="text-slate-600 dark:text-zinc-400 font-medium">No se encontraron pedidos</p>
        <p className="text-slate-400 dark:text-zinc-550 text-sm">Prueba con otros términos de búsqueda o estado.</p>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 px-2 text-left text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">ID Pedido</TableHead>
            <TableHead className="h-12 px-2 text-left text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Nombre</TableHead>
            <TableHead className="h-12 px-2 text-left text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Fecha</TableHead>
            <TableHead className="h-12 px-2 text-left text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Estado</TableHead>
            <TableHead className="h-12 px-2 text-right text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {pedidos.map((pedido) => {
            const pedidoId    = getPedidoId(pedido);
            const statusMeta  = getStatusMeta(pedido.idEstado ?? pedido.id_estado_pedido ?? 1);
            const isCancelled = statusMeta.value === 3;
            const isDelivered = statusMeta.value === 4;
            const isPaid      = statusMeta.value === 5;

            const customerName =
              pedido.nombreCliente ||
              pedido.cliente?.razonSocial ||
              pedido.clienteNombre ||
              "Cliente sin asignar";

            const sellerName = /^Vendedor #/i.test(pedido.nombreVendedor || "")
              ? ""
              : pedido.nombreVendedor;

            return (
              <TableRow
                key={pedidoId}
                className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors"
              >
                {/* ID */}
                <TableCell className="h-12 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500 dark:text-zinc-500" />
                    <span className="text-sm font-semibold text-black dark:text-slate-200">
                      {formatPedidoCode(pedido)}
                    </span>
                  </div>
                </TableCell>

                {/* Nombre / Vendedor */}
                <TableCell className="h-12 px-2 align-middle">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-500 dark:text-zinc-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black dark:text-slate-200">{customerName}</p>
                      {sellerName ? (
                        <p className="truncate text-xs text-slate-500 dark:text-zinc-400">Vendedor: {sellerName}</p>
                      ) : (
                        <p className="truncate text-xs text-slate-400 dark:text-zinc-500">Sin vendedor asignado</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Fecha */}
                <TableCell className="h-12 px-2 align-middle text-sm text-black dark:text-slate-200">
                  {formatPedidoDate(pedido)}
                </TableCell>

                {/* Estado — StatusDropdown genérico */}
                <TableCell className="h-12 px-2 align-middle overflow-visible">
                  <StatusDropdown
                    currentValue={Number(pedido.idEstado ?? pedido.id_estado_pedido ?? 1)}
                    options={buildOptions(pedido)}
                    disabled={isPaid && !isMasterUser}
                    onStatusChange={(nextStatus) => onStatusChange?.(pedido, nextStatus)}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell className="h-12 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton label="Ver pedido" colorClass="text-blue-600 dark:text-blue-400" onClick={() => onView(pedido)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>

                    {!isCancelled && (
                      <IconButton label="Ver abonos del pedido" colorClass="text-violet-600 dark:text-violet-400" onClick={() => onAbonos?.(pedido)}>
                        <DollarSign className="h-4 w-4" />
                      </IconButton>
                    )}

                    {!isCancelled && !isDelivered && !isPaid && (
                      <>
                        <Can permission="Editar Pedido">
                          <IconButton label="Editar pedido" colorClass="text-emerald-600 dark:text-emerald-400" onClick={() => onEdit(pedido)}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        </Can>
                        <Can permission="Anular Pedido">
                          <IconButton
                            label="Cancelar pedido"
                            colorClass="text-red-500 dark:text-red-400"
                            onClick={() => onStatusChange?.(pedido, 3)}
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </Can>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PedidoTable;
