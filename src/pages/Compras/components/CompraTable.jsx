import React from "react";
import {
  AlertCircle,
  ArchiveRestore,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";
import StatusDropdown from "../../../components/shared/StatusDropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

/* ── Helpers ──────────────────────────────────────────────────── */
const formatCurrency = (value) =>
  "$ " +
  parseFloat(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatId = (id) => "C" + String(id || "0").padStart(3, "0");

const formatDate = (dateStr) => {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  if (isNaN(d)) return "Sin fecha";
  return d.toLocaleDateString("es-CO", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
  });
};

/* ── Iconos para el select de estados de compra ──────────────── */
const STATUS_ICONS = {
  1: Clock,
  2: CheckCircle,
  3: CheckCircle,
  4: Ban,
  5: XCircle,
};

/* ── IconButton unificado (igual que en PedidoTable) ─────────── */
const IconButton = ({ label, colorClass, onClick, disabled, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition
      focus:outline-none focus:ring-2 focus:ring-slate-200 
      ${disabled ? "opacity-40 cursor-not-allowed bg-transparent text-slate-400" : `hover:bg-slate-100 dark:hover:bg-zinc-800 ${colorClass}`}`}
  >
    {children}
  </button>
);

/* ── Componente Principal ─────────────────────────────────────── */
export default function CompraTable({
  data,
  loading,
  error,
  statuses = [],
  onStatusChange,
  onView,
  onCancel,
  onDetails,
}) {
  /* Enriquecer las opciones del dropdown con el icono correcto */
  const statusOptions = statuses.map((s) => ({
    ...s,
    Icon: STATUS_ICONS[s.value] ?? Clock,
  }));

  /* Obtener el idEstado actual normalizado de una compra */
  const getCurrentStatusId = (item) =>
    Number(
      item?.idEstado ??
      item?.idEstadoCompra ??
      item?.id_estado_compra ??
      item?.id_estado ??
      1
    );

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 dark:text-zinc-500">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
        <p className="text-sm font-medium">Cargando compras...</p>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-500 border-t border-red-100 dark:border-red-950/30 bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400">No se pudieron cargar las compras</h3>
        <p className="text-sm mt-1 max-w-lg">{error}</p>
      </div>
    );
  }

  /* ── Vacío ───────────────────────────────────────────────── */
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-505 dark:text-zinc-450 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <ArchiveRestore className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-zinc-300">Sin historial de compras</h3>
        <p className="text-sm mt-1">Las compras registradas aparecerán aquí.</p>
      </div>
    );
  }

  /* ── Tabla ───────────────────────────────────────────────── */
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 px-6 text-left text-sm font-semibold text-slate-400 dark:text-slate-200">ID</TableHead>
            <TableHead className="h-12 px-6 text-left text-sm font-semibold text-slate-400 dark:text-slate-200">Fecha</TableHead>
            <TableHead className="h-12 px-6 text-left text-sm font-semibold text-slate-400 dark:text-slate-200">Proveedor</TableHead>
            <TableHead className="h-12 px-6 text-right text-sm font-semibold text-slate-400 dark:text-slate-200">Total</TableHead>
            <TableHead className="h-12 px-6 text-left text-sm font-semibold text-slate-400 dark:text-slate-200">Estado</TableHead>
            <TableHead className="h-12 px-6 text-right text-sm font-semibold text-slate-400 dark:text-slate-200">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item, index) => {
            const currentStatusId = getCurrentStatusId(item);

            let rowStatusOptions = [];
            let isDropdownDisabled = !onStatusChange || statusOptions.length === 0;

            if (currentStatusId === 1) {
              rowStatusOptions = statusOptions.filter(s => [1, 3, 4].includes(s.value));
            } else if (currentStatusId === 3) {
              rowStatusOptions = statusOptions.filter(s => [3, 2, 4].includes(s.value));
            } else if ([2, 4, 5].includes(currentStatusId)) {
              rowStatusOptions = statusOptions.filter(s => s.value === currentStatusId);
              isDropdownDisabled = true;
            } else {
              rowStatusOptions = statusOptions;
            }

            return (
              <TableRow
                key={item.idCompra || index}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
              >
                {/* ID */}
                <TableCell className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 font-mono">
                  {formatId(item.idCompra)}
                </TableCell>

                {/* Fecha */}
                <TableCell className="px-6 py-4 text-amber-600 dark:text-amber-400 font-semibold">
                  {formatDate(item.fechaCompra)}
                </TableCell>

                {/* Proveedor */}
                <TableCell className="px-6 py-4 font-medium text-slate-850 dark:text-zinc-300">
                  {item.proveedorNombre || "-"}
                </TableCell>

                {/* Total */}
                <TableCell className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(item.montoTotal)}
                </TableCell>

                {/* Estado — StatusDropdown genérico (igual que Pedidos) */}
                <TableCell className="px-6 py-4 overflow-visible">
                  <StatusDropdown
                    currentValue={currentStatusId}
                    options={rowStatusOptions}
                    onStatusChange={(nextStatus) => onStatusChange?.(item, nextStatus)}
                    disabled={isDropdownDisabled}
                  />
                </TableCell>


                {/* Acciones — mismos IconButton que PedidoTable */}
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton
                      label="Ver detalle de compra"
                      colorClass="text-blue-600 dark:text-blue-400"
                      onClick={() => onView?.(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </IconButton>

                    <IconButton
                      label="Cancelar compra"
                      colorClass="text-red-500 dark:text-red-400"
                      onClick={() => onCancel?.(item)}
                      disabled={currentStatusId !== 3}
                    >
                      <XCircle className="h-4 w-4" />
                    </IconButton>

                    <IconButton
                      label="Ver documento / factura"
                      colorClass="text-slate-500 dark:text-slate-400"
                      onClick={() => onDetails?.(item)}
                    >
                      <FileText className="h-4 w-4" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
