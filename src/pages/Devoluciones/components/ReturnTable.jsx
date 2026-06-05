import React from "react";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "../../../components/ui/table";
import { Loader2, PackageX, ArchiveRestore, ClipboardList, ShieldCheck, Eye, FileText, X, ExternalLink } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Can } from "../../../components/shared/Can";

export default function ReturnTable({ data, loading, getAvatarColor, getInitials, onView, onCancel, onExportPdf }) {
    
    // Función para manejar la apertura del comprobante
    const handleViewPdf = (item) => {
        if (item.urlComprobante) {
            // Si ya existe la URL en Cloudinary, la abrimos en pestaña nueva
            window.open(item.urlComprobante, "_blank");
        } else if (onExportPdf) {
            // Si es un registro antiguo sin URL, disparamos la función de exportación
            onExportPdf(item);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Cargando bitácora de devoluciones…</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-zinc-400 flex flex-col items-center justify-center">
                <PackageX className="mb-3 h-12 w-12 text-slate-300 dark:text-zinc-650" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Historial de Devoluciones Limpio</h3>
                <p className="mt-1 text-sm max-w-md text-slate-450 dark:text-zinc-500">No se registran devoluciones de stock aún. Los reingresos de mercancía aparecerán aquí detallando el impacto en el Kardex.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="pl-6 w-[140px] text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Folio Evento</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Factura Base</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Cliente Involucrado</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Ítems Reingresados (Kardex)</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Estado / Motivo</TableHead>
                        <TableHead className="text-right pr-6 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => {
                        const isAnulado = item.idEstadoDevolucion === 2;
                        
                        return (
                            <TableRow
                                key={item.idDevolucion}
                                className={`group transition-colors ${
                                    isAnulado 
                                        ? 'bg-slate-50/30 dark:bg-slate-900/10 opacity-75 hover:bg-blue-50/40 dark:hover:bg-slate-700/20' 
                                        : 'hover:bg-blue-50/60 dark:hover:bg-slate-700/30'
                                }`}
                            >
                                {/* Folio y Fecha */}
                                <TableCell className="pl-6">
                                    <div className="flex items-center gap-2">
                                        <ArchiveRestore className={`h-4 w-4 ${isAnulado ? 'text-slate-300 dark:text-zinc-700' : 'text-slate-400 dark:text-zinc-500'}`} />
                                        <div>
                                            <p className={`font-bold ${isAnulado ? 'text-slate-500 dark:text-zinc-500 line-through' : 'text-slate-900 dark:text-slate-200'}`}>#DEV-{item.idDevolucion}</p>
                                            <p className="text-[10px] font-normal text-slate-400 dark:text-zinc-500 mt-0.5">
                                                {item.fechaDevolucion ? new Date(item.fechaDevolucion).toLocaleDateString() : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
 
                                {/* Factura Referencia */}
                                <TableCell>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold font-mono border ${isAnulado ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-zinc-700' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'}`}>
                                        <ClipboardList size={13} /> {item.numeroFactura || (item.idVenta ? `VTA-${String(item.idVenta).padStart(3, '0')}` : "N/A")}
                                    </span>
                                </TableCell>
 
                                {/* Cliente y Usuario */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm transition-opacity ${isAnulado ? 'grayscale opacity-50' : ''} ${getAvatarColor(item.idCliente)}`}
                                        >
                                            {getInitials(item.cliente?.razonSocial || item.clienteNombre)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-zinc-200 leading-tight text-sm">
                                                {item.cliente?.razonSocial || item.clienteNombre || "Cliente General"}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <ShieldCheck size={10} className={isAnulado ? "text-slate-300 dark:text-zinc-700" : "text-emerald-500 dark:text-emerald-450"} />
                                                <p className="text-[10px] text-slate-500 dark:text-zinc-450">ID: {item.idCliente}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
 
                                {/* Resumen de Ítems */}
                                <TableCell>
                                    {(() => {
                                        const items = item.detalles || item.itemsDevueltos || [];
                                        return (
                                            <div className="space-y-1.5 py-1">
                                                {items.slice(0, 2).map((det, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className={`font-bold px-1.5 py-0.5 rounded border ${isAnulado ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-700' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30'}`}>
                                                            +{det.cantidadDevuelta || 0}
                                                        </span>
                                                        <span className="truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-300">
                                                            {det.producto?.nombre || "Producto"}
                                                        </span>
                                                    </div>
                                                ))}
                                                {items.length > 2 && (
                                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic pl-1">
                                                        + {items.length - 2} más...
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </TableCell>
 
                                {/* Estado y Motivo */}
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isAnulado ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'}`}>
                                            {isAnulado ? "Anulada" : "Completada"}
                                        </span>
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-450 line-clamp-1 max-w-[150px]" title={item.motivo}>
                                            {item.motivo || "Sin comentarios"}
                                        </p>
                                    </div>
                                </TableCell>
 
                                {/* Acciones */}
                                <TableCell className="text-right pr-6">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost" size="icon" title="Ver detalle"
                                            className="h-8 w-8 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-zinc-800"
                                            onClick={() => onView(item)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        
                                        {/* ICONO PDF DINÁMICO */}
                                        <Button
                                            variant="ghost" size="icon" 
                                            title={item.urlComprobante ? "Abrir Comprobante en la Nube" : "Generar PDF"}
                                            className={`h-8 w-8 ${item.urlComprobante ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-zinc-800' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                                            onClick={() => handleViewPdf(item)}
                                        >
                                            {item.urlComprobante ? <ExternalLink className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                        </Button>
 
                                        {!isAnulado && (
                                            <Can permission="Anular Devolución">
                                                <Button
                                                    variant="ghost" size="icon" title="Anular Devolución"
                                                    className="h-8 w-8 text-rose-500 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-zinc-800"
                                                    onClick={() => onCancel && onCancel(item)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </Can>
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
}