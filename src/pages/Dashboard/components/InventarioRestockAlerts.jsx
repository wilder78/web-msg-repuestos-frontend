import React from "react";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export default function InventarioRestockAlerts({
  items = [],
  onGeneratePurchase,
  purchaseLoadingId,
  isAdmin,
}) {
  return (
    <Card className="border-red-100 bg-red-50/20 h-full">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Reabastecimiento Crítico
        </CardTitle>
        <p className="text-xs text-red-700/80 mt-1">
          Productos con existencia en cero — genere una orden de compra directa al módulo de Compras.
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600 py-12 text-center">
            No hay productos agotados en este momento.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-red-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Producto</th>
                  <th className="px-3 py-2.5 font-semibold">Referencia</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Stock</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Mínimo</th>
                  <th className="px-3 py-2.5 font-semibold text-right">P. compra</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const loading = purchaseLoadingId === item.idProducto;
                  return (
                    <tr
                      key={item.idProducto}
                      className="border-b border-slate-50 last:border-0 hover:bg-red-50/40"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900 max-w-[160px]">
                        <span className="line-clamp-2">{item.nombre}</span>
                        <span className="text-[10px] text-slate-400 block">{item.marca}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{item.referencia}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge className="bg-red-600 text-white hover:bg-red-600">0</Badge>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">{item.minimo}</td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {formatCurrency(item.precioCompra)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          disabled={!isAdmin || loading}
                          onClick={() => onGeneratePurchase(item)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8 gap-1.5"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {loading ? "Generando…" : "Generar Orden de Compra"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isAdmin && items.length > 0 && (
          <p className="text-xs text-amber-700 mt-3">
            Solo administradores pueden registrar órdenes de compra.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
