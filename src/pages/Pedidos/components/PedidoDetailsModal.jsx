import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Box,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Package,
  User,
  XCircle,
} from "lucide-react";

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const getPedidoId = (pedido) => pedido?.idPedido ?? pedido?.id_pedido ?? pedido?.id;

const formatPedidoCode = (pedido) => {
  const id = getPedidoId(pedido);
  return id ? `PED-${String(id).padStart(3, "0")}` : "PED-000";
};

const formatDate = (value, long = false) => {
  if (!value) return "No registrada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No registrada";

  return date.toLocaleDateString("es-CO", {
    weekday: long ? "long" : undefined,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (value) => moneyFormatter.format(Number(value || 0));

const parseNumeric = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).replace(/[^0-9.-]+/g,"");
  return Number(cleanStr) || 0;
};

const getStatusMeta = (pedido) => {
  const status = Number(pedido?.idEstado ?? pedido?.id_estado_pedido);

  if (status === 2) return { label: "Despachado", icon: Package,      className: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450" };
  if (status === 3) return { label: "Cancelado",  icon: XCircle,      className: "border-red-200 dark:border-red-900/50 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" };
  if (status === 4) return { label: "Entregado",  icon: CheckCircle2, className: "border-blue-200 dark:border-blue-900/50 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" };
  if (status === 5) return { label: "Pagado",     icon: DollarSign,   className: "border-violet-200 dark:border-violet-900/50 bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400" };

  return { label: "En Proceso", icon: Clock3, className: "border-amber-200 dark:border-amber-900/50 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" };
};

const getDetailValues = (detalle) => {
  const quantity = parseNumeric(detalle.cantidad ?? detalle.cantidad_solicitada ?? 0);
  const unitPrice = parseNumeric(
    detalle.precio_unitario ?? 
    detalle.precio_venta ?? 
    detalle.precioVenta ??
    detalle.precio ??
    detalle.producto?.precio_publico ?? 
    detalle.producto?.precio_compra ?? 
    0
  );

  // Subtotal BRUTO = cantidad × precio (antes de descuento)
  const subtotalBruto = quantity * unitPrice;

  // Total NETO desde subtotal_linea (fuente de verdad del backend)
  const subtotalLinea = parseNumeric(detalle.subtotal_linea ?? detalle.subtotalLinea ?? null);

  let discount;
  let total;

  if (subtotalLinea !== null && subtotalLinea > 0 && subtotalBruto > 0) {
    // Si tenemos subtotal_linea confiable, derivamos el descuento real de la diferencia.
    // Esto anula cualquier valor incorrecto en descuento_aplicado.
    discount = Math.max(subtotalBruto - subtotalLinea, 0);
    total = subtotalLinea;
  } else {
    // Fallback: usar descuento_aplicado o recalcular desde porcentaje
    discount = parseNumeric(detalle.descuento_aplicado ?? detalle.descuentoAplicado ?? detalle.descuento ?? 0);
    const porcentaje = parseNumeric(detalle.descuento_porcentaje ?? 0);
    if (discount === 0 && porcentaje > 0) {
      discount = (subtotalBruto * porcentaje) / 100;
    }
    total = Math.max(subtotalBruto - discount, 0);
  }

  return { quantity, unitPrice, subtotalBruto, discount, total };
};

const PedidoDetailsModal = ({ isOpen, onClose, pedido }) => {
  if (!pedido) return null;

  const detalles = Array.isArray(pedido.detalles) ? pedido.detalles : [];
  const cliente = pedido.cliente || {};
  const statusMeta = getStatusMeta(pedido);
  const StatusIcon = statusMeta.icon;

  const detailsTotals = detalles.reduce(
    (acc, detalle) => {
      const values = getDetailValues(acc, detalle); // wait, fixed signature
      return acc;
    },
    { subtotalBruto: 0, discount: 0, total: 0 }
  );
  
  // wait, fix reduce loop to match correct parameters
  let calculatedSubtotalBruto = 0;
  let calculatedDiscount = 0;
  let calculatedTotal = 0;
  detalles.forEach(d => {
    const v = getDetailValues(d);
    calculatedSubtotalBruto += v.subtotalBruto;
    calculatedDiscount += v.discount;
    calculatedTotal += v.total;
  });

  // Usar los campos del pedido si vienen con valor real;
  // si no, recalcular desde las líneas de detalle.
  const subtotalConDescuento = (() => {
    const fromPedido = parseNumeric(
      pedido.subtotal_con_descuento ??
      pedido.subtotal
    );
    // Si el backend devolvió un valor positivo, lo usamos.
    if (fromPedido > 0) return fromPedido;
    // Si no, calculamos desde los detalles.
    return calculatedTotal;
  })();

  const descuentoTotal = (() => {
    const fromPedido = parseNumeric(pedido.descuentos);
    if (fromPedido > 0) return fromPedido;
    return calculatedDiscount;
  })();

  const iva = (() => {
    const fromPedido = parseNumeric(pedido.impuestos ?? pedido.iva);
    if (fromPedido > 0) return fromPedido;
    // Recalcular IVA (19%) desde el subtotal neto con descuento
    return subtotalConDescuento * 0.19;
  })();

  const totalPedido = (() => {
    const fromPedido = parseNumeric(pedido.total_neto);
    if (fromPedido > 0) return fromPedido;
    return subtotalConDescuento + iva;
  })();

  const customerName =
    pedido.nombreCliente ||
    cliente.razonSocial ||
    pedido.clienteNombre ||
    "Cliente sin asignar";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-0 dark:border dark:border-zinc-800 shadow-2xl rounded-2xl flex flex-col text-slate-900 dark:text-slate-100"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-start gap-3 pr-8">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-black dark:text-white">
                Detalles del Pedido
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                Información completa del pedido seleccionado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-150">
          <section className="flex flex-col gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-white">
                Pedido {formatPedidoCode(pedido)}
              </h2>
              <p className="mt-2 text-base text-slate-600 dark:text-zinc-400">
                {formatDate(pedido.fechaPedido ?? pedido.fecha_pedido, true)}
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-zinc-400 sm:grid-cols-2">
                <span>
                  Vendedor:{" "}
                  <strong className="font-semibold text-slate-900 dark:text-slate-200">
                    {pedido.nombreVendedor || pedido.id_vendedor || "Sin asignar"}
                  </strong>
                </span>
                <span>
                  Forma de pago:{" "}
                  <strong className="font-semibold text-slate-900 dark:text-slate-200">
                    {pedido.tipo_pago || "Pendiente"}
                  </strong>
                </span>
              </div>
            </div>

            <span
              className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold ${statusMeta.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusMeta.label}
            </span>
          </section>

          <section className="mt-6 border-b border-slate-200 dark:border-zinc-800 pb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Información del Cliente
            </h3>

            <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 p-4">
              <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Nombre / Razón Social</p>
                  <p className="mt-1 font-semibold text-blue-950 dark:text-blue-200">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">NIT / Cédula</p>
                  <p className="mt-1 font-semibold text-blue-950 dark:text-blue-200">
                    {cliente.numeroDocumento || pedido.numeroDocumento || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Teléfono</p>
                  <p className="mt-1 font-semibold text-blue-950 dark:text-blue-200">
                    {cliente.telefono || pedido.telefono || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Email</p>
                  <p className="mt-1 break-all font-semibold text-blue-950 dark:text-blue-200">
                    {cliente.email || pedido.email || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Dirección</p>
                  <p className="mt-1 font-semibold text-blue-950 dark:text-blue-200">
                    {cliente.direccion || pedido.direccion || "No registrada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">Tipo de cliente</p>
                  <span className="mt-1 inline-flex rounded-md bg-emerald-100 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-450">
                    {cliente.tipoCliente || pedido.tipoCliente || "No definido"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Box className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Productos del Pedido
            </h3>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-violet-50 dark:bg-zinc-950 text-left text-slate-900 dark:text-zinc-300">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Código</th>
                    <th className="px-3 py-3 font-semibold">Descripción</th>
                    <th className="px-3 py-3 text-center font-semibold">Cantidad</th>
                    <th className="px-3 py-3 text-right font-semibold">Precio Unit.</th>
                    <th className="px-3 py-3 text-right font-semibold">Descuento</th>
                    <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
                    <th className="px-3 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-250">
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => {
                      const values = getDetailValues(detalle);
                      const producto = detalle.producto || {};
                      const code =
                        producto.referencia ||
                        detalle.referenciaProducto ||
                        detalle.id_producto ||
                        "-";
                      const rawName =
                        producto.nombre ||
                        detalle.nombreProducto ||
                        detalle.descripcion ||
                        "Producto sin nombre";
                      
                      const name = rawName.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

                      return (
                        <tr key={detalle.idDetallePedido || detalle.id_detalle_pedido || index} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                          <td className="px-3 py-3 font-semibold text-violet-700 dark:text-violet-400">{code}</td>
                          <td className="px-3 py-3 text-slate-900 dark:text-slate-200">{name}</td>
                          <td className="px-3 py-3 text-center text-slate-900 dark:text-slate-200">{values.quantity}</td>
                          <td className="px-3 py-3 text-right text-slate-900 dark:text-slate-200">
                            {formatMoney(values.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right text-red-600 dark:text-red-400">
                            {values.discount > 0 ? `-${formatMoney(values.discount)}` : "-"}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-900 dark:text-slate-200">
                            {formatMoney(values.subtotalBruto)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-450">
                            {formatMoney(values.total)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500 dark:text-zinc-550" colSpan={7}>
                        No hay productos registrados en este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ml-auto mt-6 w-full max-w-[480px] space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-950/60 px-4 py-3 text-sm">
                <span className="text-slate-600 dark:text-zinc-400">Subtotal con Descuento:</span>
                <strong className="text-slate-950 dark:text-slate-200">{formatMoney(subtotalConDescuento)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-950/60 px-4 py-3 text-sm">
                <span className="text-slate-600 dark:text-zinc-400">Descuento Total:</span>
                <strong className="text-red-600 dark:text-red-400">
                  {descuentoTotal > 0 ? `-${formatMoney(descuentoTotal)}` : formatMoney(0)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-950/60 px-4 py-3 text-sm">
                <span className="text-slate-600 dark:text-zinc-400">IVA Total:</span>
                <strong className="text-amber-700 dark:text-amber-450">{formatMoney(iva)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-violet-300 dark:border-violet-900/30 bg-violet-50 dark:bg-violet-950/20 px-4 py-4">
                <span className="flex items-center gap-2 text-base font-semibold text-violet-900 dark:text-violet-400">
                  <DollarSign className="h-5 w-5" />
                  Total del Pedido:
                </span>
                <strong className="text-xl font-semibold text-violet-850 dark:text-violet-300">
                  {formatMoney(totalPedido)}
                </strong>
              </div>
            </div>
          </section>
          
          <div className="flex justify-end pt-2 pb-1">
            <button 
              type="button"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-blue-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm font-semibold text-blue-700 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-zinc-800 hover:text-blue-800 dark:hover:text-blue-300"
              onClick={() => window.print()}
            >
              <FileText size={14} /> Ver PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PedidoDetailsModal;
