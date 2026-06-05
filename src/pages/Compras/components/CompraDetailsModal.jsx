import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  Package,
  ShoppingCart,
  User,
  XCircle,
} from "lucide-react";
import InfoCard from "../../../components/shared/InfoCard";
import { fetchProveedores } from "../../../services/comprasService";

/* ── Formatters ───────────────────────────────────────────── */
const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatMoney = (value) => moneyFormatter.format(Number(value ?? 0));
const formatId    = (id)    => `C-${String(id ?? "0").padStart(3, "0")}`;

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    day:     "2-digit",
    month:   "long",
    year:    "numeric",
  });
};

/* ── Badge de estado (color_hex de la BD) ─────────────────── */
const buildHexStyles = (colorHex) => {
  if (!colorHex) return {};
  const hex = colorHex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    borderColor:     `rgba(${r},${g},${b},0.40)`,
    color:            colorHex,
  };
};

const STATUS_ICON_MAP = {
  1: Clock3,
  2: CheckCircle2,
  3: CheckCircle2,
  4: XCircle,
  5: XCircle,
};

/* ── Componente Principal ─────────────────────────────────── */
const CompraDetailsModal = ({ isOpen, onClose, compra }) => {
  const [proveedorDetails, setProveedorDetails] = useState(null);

  useEffect(() => {
    if (!isOpen || !compra) {
      setProveedorDetails(null);
      return;
    }
    let active = true;
    const loadProveedor = async () => {
      try {
        const idTarget = compra.idProveedor ?? compra.id_proveedor ?? (compra.proveedor?.idProveedor ?? compra.proveedor?.id_proveedor);
        if (idTarget) {
          const data = await fetchProveedores();
          const matched = data.find(p => Number(p.idProveedor) === Number(idTarget));
          if (matched && active) {
            setProveedorDetails(matched);
          }
        }
      } catch (err) {
        console.error("Error loading provider details in modal:", err);
      }
    };
    loadProveedor();
    return () => {
      active = false;
    };
  }, [isOpen, compra]);

  if (!compra) return null;

  /* ── Datos generales ─────────────────────────────────────── */
  const idCompra    = compra.idCompra ?? compra.id_compra ?? compra.id;
  const estado      = (typeof compra.estado === "object" && compra.estado !== null)
    ? compra.estado
    : (compra.estadoObjeto ?? compra.estadoCompra ?? compra.estado_compra ?? {});
  const colorHex    = estado.color_hex ?? null;
  const statusId    = compra.idEstadoCompra ?? compra.idEstado ?? compra.id_estado_compra ?? 1;
  const StatusIcon  = STATUS_ICON_MAP[statusId] ?? Clock3;
  const statusName  = estado.nombre_estado ?? (typeof compra.estado === "string" ? compra.estado : null) ?? compra.estadoNombre ?? `Estado ${statusId}`;

  const proveedor   = proveedorDetails ?? compra.proveedor ?? {};
  const empleado    = compra.empleado ?? compra.employee ?? compra.user ?? {};

  const proveedorNombre =
    compra.proveedorNombre ??
    proveedor.nombreEmpresa ??
    proveedor.nombre_empresa ??
    proveedor.nombre ??
    "Sin proveedor";

  const empleadoNombre =
    compra.empleadoNombre ??
    compra.empleado_nombre ??
    (empleado.nombre ? `${empleado.nombre} ${empleado.apellido ?? ""}`.trim() : null) ??
    (empleado.nombres ? `${empleado.nombres} ${empleado.apellidos ?? ""}`.trim() : null) ??
    "Sin empleado";

  /* ── Detalles y totales ───────────────────────────────────── */
  const detalles = Array.isArray(compra.detalles) ? compra.detalles : [];

  const subtotalAcumulado = detalles.reduce((sum, d) => {
    const cantidad = Number(d.cantidad ?? 0);
    const costoUnitario = Number(
      d.costo_unitario ?? d.costoUnitario ?? d.precioUnitario ?? 0,
    );
    return sum + Number(d.subtotal ?? d.total ?? costoUnitario * cantidad);
  }, 0);
  const ivaCalculado = subtotalAcumulado * 0.19;
  const granTotal = subtotalAcumulado + ivaCalculado;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300"
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-3 pr-8">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                  Detalle de Compra
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                  Información completa de la orden de compra seleccionada
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">

          {/* Cabecera del documento */}
          <section className="flex flex-col gap-4 border-b border-slate-100 dark:border-zinc-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Compra {formatId(idCompra)}
              </h2>
              <p className="mt-1.5 text-sm text-slate-550 dark:text-zinc-400">
                {formatDate(compra.fechaRegistro ?? compra.fechaCompra ?? compra.fecha_compra)}
              </p>
            </div>

            {/* Badge de estado */}
            <span
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-semibold dark:bg-zinc-800 dark:border-zinc-700 text-slate-700 dark:text-slate-200"
              style={colorHex ? buildHexStyles(colorHex) : {}}
            >
              <StatusIcon className="h-4 w-4" />
              {statusName}
            </span>
          </section>

          {/* Info general — Grid de Detalles */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Tarjeta de Registro de Compra */}
            <div className="p-5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Detalles del Registro
              </h3>
              <div className="grid gap-3">
                <InfoCard icon={User} iconColor="violet" title="Empleado responsable">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{empleadoNombre}</p>
                </InfoCard>
                <InfoCard icon={Calendar} iconColor="amber" title="Fecha de registro">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{formatDate(compra.fechaRegistro ?? compra.fechaCompra)}</p>
                </InfoCard>
                <InfoCard icon={DollarSign} iconColor="emerald" title="Total de la compra">
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{formatMoney(granTotal)}</p>
                </InfoCard>
              </div>
            </div>

            {/* Tarjeta de Proveedor */}
            <div className="p-5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Información del Proveedor
              </h3>
              <div className="grid gap-3">
                <InfoCard icon={Building2} iconColor="blue" title="Razón Social / Empresa">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{proveedorNombre}</p>
                </InfoCard>
                <InfoCard icon={Building2} iconColor="blue" title="NIT / Documento">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{proveedor.numeroDocumento ?? proveedor.numero_documento ?? proveedor.nit ?? "No registrado"}</p>
                </InfoCard>
                <InfoCard icon={Building2} iconColor="blue" title="Dirección">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{proveedor.direccion ?? proveedor.direccion_empresa ?? proveedor.direccionEmpresa ?? "No registrada"}</p>
                </InfoCard>
                <InfoCard icon={Building2} iconColor="blue" title="Contacto / Teléfono">
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{`${proveedor.contacto ?? proveedor.persona_contacto ?? "—"} (${proveedor.telefono ?? proveedor.telefono_contacto ?? "Sin teléfono"})`}</p>
                </InfoCard>
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-wide text-slate-750 dark:text-zinc-200">
                Productos adquiridos
                <span className="ml-2 rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {detalles.length}
                </span>
              </h3>
            </div>

            {detalles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 py-10 text-center text-slate-405">
                <Package className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">Sin productos registrados en esta compra</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  {/* Encabezado */}
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40">
                      <th className="h-10 px-4 text-left   text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Producto</th>
                      <th className="h-10 px-4 text-left   text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Marca</th>
                      <th className="h-10 px-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cantidad</th>
                      <th className="h-10 px-4 text-right  text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Costo Unitario</th>
                      <th className="h-10 px-4 text-right  text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subtotal</th>
                    </tr>
                  </thead>

                  {/* Filas de detalle */}
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {detalles.map((detalle, idx) => {
                      const producto      = detalle.producto ?? {};
                      const nombre        = producto.nombre ?? detalle.nombreProducto ?? producto.nombre_producto ?? `Producto #${idx + 1}`;
                      const marca         = producto.marca  ?? producto.marca_producto  ?? "—";
                      const cantidad      = Number(detalle.cantidad      ?? 0);
                      const costoUnitario = Number(detalle.costo_unitario ?? detalle.costoUnitario ?? detalle.precioUnitario ?? 0);
                      const subtotal      = Number(detalle.subtotal      ?? detalle.total ?? (costoUnitario * cantidad));

                      return (
                        <tr
                          key={detalle.idDetalle ?? detalle.id ?? idx}
                          className="transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-850/50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">{nombre}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">{marca}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                              {cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 dark:text-zinc-300">
                            {formatMoney(costoUnitario)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                            {formatMoney(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Total */}
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-550 dark:text-zinc-400">
                        Subtotal
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        {formatMoney(subtotalAcumulado)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-550 dark:text-zinc-400">
                        IVA (19%)
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        {formatMoney(ivaCalculado)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-zinc-400">
                        Total de la compra
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {formatMoney(granTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompraDetailsModal;
