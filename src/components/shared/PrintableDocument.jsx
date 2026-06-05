import React from "react";

/**
 * PrintableDocument - Versión compacta y profesional para impresión
 */
const PrintableDocument = ({ 
  title = "Documento",
  folio = "000",
  date = "",
  client = { name: "Cliente", id: "0" },
  concept = "Operación Comercial",
  items = [],
  totals = { subtotal: 0, total: 0 },
  footerNote = "Documento oficial generado por el sistema.",
  isCancelled = false,
  type = "default", // "default" o "sale"
  printedBy = ""
}) => {
  const subtotalSinDescuento = parseFloat(totals.subtotalSinDescuento || 0);
  const descuentoTotal = parseFloat(totals.descuentoTotal || 0);
  const subtotalConDescuento = parseFloat(
    totals.subtotalConDescuento ?? Math.max(subtotalSinDescuento - descuentoTotal, 0)
  );
  const ivaTotal = parseFloat(
    totals.ivaTotal ?? Math.max(parseFloat(totals.total || 0) - subtotalConDescuento, 0)
  );

  return (
    <div className="print-only hidden print:block bg-white text-black font-sans w-full mx-auto text-[11px]">
      {/* Header Compacto */}
      <div className="flex justify-between items-center border-b border-black pb-2 mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">MSG Repuestos</h1>
          <p className="text-[10px] text-gray-600">NIT: 901.XXX.XXX-X | Calle 123 # 45 - 67 | Tel: 123 4567</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-bold uppercase">{title}</h2>
          <p className="text-sm font-mono font-bold">N° {folio}</p>
          <p className="text-[9px] text-gray-500 uppercase">Fecha: {date || new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Info Cliente Simplificada */}
      <div className="grid grid-cols-2 gap-4 mb-4 border-b border-gray-100 pb-2">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cliente:</p>
          <p className="text-sm font-bold uppercase">{client.name}</p>
          <p className="text-[10px] text-gray-600">{client.docType || "NIT/CC"}: {client.id}</p>
          {!!(client.address || client.city || client.email || client.phone) && (
             <div className="text-[9px] text-gray-500 mt-1 space-y-0.5">
               {!!(client.address || client.city || client.department) && (
                 <p>
                   {client.address || ""} 
                   {client.city ? ` - ${client.city}` : ""}
                   {client.department ? `, ${client.department}` : ""}
                 </p>
               )}
               {!!client.phone && <p>Tel: {client.phone}</p>}
               {!!client.email && <p>{client.email}</p>}
             </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Concepto:</p>
          <p className="text-[11px] font-medium text-gray-700">{concept}</p>
        </div>
      </div>

      {/* Tabla de Contenido */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            {type === "sale" ? (
              <tr className="border-y border-black text-[10px] font-bold uppercase">
                <th className="py-1">Código</th>
                <th className="py-1">Descripción</th>
                <th className="py-1 text-center">Cant</th>
                <th className="py-1 text-right">Precio U.</th>
                <th className="py-1 text-right">Subtotal</th>
                <th className="py-1 text-right">Descuento</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            ) : (
              <tr className="border-y border-black text-[10px] font-bold uppercase">
                <th className="py-1">Descripción</th>
                <th className="py-1">Detalle</th>
                <th className="py-1">Ref</th>
                <th className="py-1 text-right">Monto</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item, idx) => (
              type === "sale" ? (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2 text-[10px] text-gray-600">{item.codigo || "—"}</td>
                  <td className="py-1.5 pr-2 font-bold text-[11px]">{item.descripcion || item.description}</td>
                  <td className="py-1.5 text-[10px] text-center">{item.cantidad || "1"}</td>
                  <td className="py-1.5 text-[10px] text-right">${parseFloat(item.precioUnitario || 0).toLocaleString('es-CO', {maximumFractionDigits: 0})}</td>
                  <td className="py-1.5 text-[10px] text-right">${parseFloat(item.subtotal || 0).toLocaleString('es-CO', {maximumFractionDigits: 0})}</td>
                  <td className="py-1.5 text-[10px] text-right text-red-500">
                    {parseFloat(item.descuento || 0) > 0 ? `-$${parseFloat(item.descuento).toLocaleString('es-CO', {maximumFractionDigits: 0})}` : '-'}
                  </td>
                  <td className="py-1.5 text-[11px] text-right font-bold">
                    <span className={isCancelled ? 'line-through text-gray-300' : ''}>
                      ${parseFloat(item.total || item.amount || 0).toLocaleString('es-CO', {maximumFractionDigits: 0})}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-1.5 pr-2">
                    <p className="font-bold text-[11px]">{item.description}</p>
                    {!!item.subtext && <p className="text-[9px] text-gray-400 italic">{item.subtext}</p>}
                  </td>
                  <td className="py-1.5 text-[10px] uppercase">{item.detail1 || "—"}</td>
                  <td className="py-1.5 text-[10px] font-mono">{item.detail2 || "—"}</td>
                  <td className="py-1.5 text-right font-bold text-sm">
                    <span className={isCancelled ? 'line-through text-gray-300' : ''}>
                      ${parseFloat(item.amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales Compactos */}
      <div className="flex justify-end mb-8">
        <div className="w-[200px] space-y-1">
          {type === "sale" ? (
            <>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Subtotal sin descuento:</span>
                <span>${subtotalSinDescuento.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Descuento Total:</span>
                <span className="text-red-500">-${descuentoTotal.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Subtotal con descuento:</span>
                <span>${subtotalConDescuento.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>IVA Total (19%):</span>
                <span>${ivaTotal.toLocaleString('es-CO', {maximumFractionDigits: 0})}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Subtotal:</span>
              <span>${parseFloat(totals.subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
            <span>TOTAL:</span>
            <span>${parseFloat(totals.total || 0).toLocaleString('es-CO', { maximumFractionDigits: type === "sale" ? 0 : 2, minimumFractionDigits: type === "sale" ? 0 : 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end pt-4 border-t border-gray-100">
        <div className="w-1/3">
          <div className="border-t border-gray-400 mt-8" />
          <p className="text-center text-[9px] text-gray-400 uppercase mt-1">Firma Autorizada</p>
        </div>
        <div className="w-1/2 text-right">
          {!!printedBy && (
            <p className="text-[9px] text-gray-500 mb-1">
              Impreso por: <span className="font-semibold text-gray-700">{printedBy}</span>
            </p>
          )}
          {!!isCancelled && (
            <p className="text-red-500 font-bold text-[10px] uppercase mb-1">*** ANULADO ***</p>
          )}
          <p className="text-[9px] text-gray-400 italic leading-tight">{footerNote}</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            display: block !important;
          }
          @page { 
            size: letter; 
            margin: 20mm; 
          }
        }
      `}} />
    </div>
  );
};

export default PrintableDocument;
