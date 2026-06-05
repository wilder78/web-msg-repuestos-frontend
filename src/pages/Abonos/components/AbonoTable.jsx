import React from "react";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "../../../components/ui/table";
import { Loader2, ShieldAlert, Banknote, Landmark, CreditCard, HandCoins } from "lucide-react";
import ActionButtons from "../../../components/shared/ActionButtons";

const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
        case "efectivo":              return <Banknote  className="h-4 w-4 text-emerald-600" />;
        case "transferencia bancaria": return <Landmark  className="h-4 w-4 text-blue-600"    />;
        default:                       return <CreditCard className="h-4 w-4 text-slate-500"   />;
    }
};

const AbonoTable = ({ data, loading, getAvatarColor, getInitials, onView, onCancel, onPrint }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-sm font-medium">Cargando abonos…</span>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center border-t border-slate-100 bg-slate-50 p-12 text-center text-slate-500">
                <ShieldAlert className="mb-3 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-700">No hay abonos registrados</h3>
                <p className="mt-1 text-sm">Registra un nuevo recaudo usando el botón superior.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/40">
                    <TableRow>
                        <TableHead className="pl-6 w-[130px] text-slate-400 dark:text-slate-200">Folio</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200">Cliente</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200">Monto Abonado</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200">Método / Referencia</TableHead>
                        <TableHead className="text-right pr-6 text-slate-400 dark:text-slate-200">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow
                            key={item.idAbono}
                            className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700"
                        >
                            {/* Folio */}
                            <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <HandCoins className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <div>
                                        <p>#RCP-{item.idAbono}</p>
                                        <p className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                                            {item.fechaCreacion
                                                ? new Date(item.fechaCreacion).toLocaleDateString()
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Cliente */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${getAvatarColor(item.id_cliente || item.idCliente)}`}
                                    >
                                        {getInitials(item.cliente?.razonSocial || item.clienteNombre || "C")}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{item.cliente?.razonSocial || item.clienteNombre}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.cliente?.tipoDocumento?.sigla || "ID"}: {item.cliente?.numeroDocumento || item.id_cliente || item.idCliente}</p>
                                    </div>
                                </div>
                            </TableCell>

                            {/* Monto */}
                            <TableCell>
                                <div className="flex flex-col">
                                    <p className={`font-bold ${item.idEstado === 3 ? "text-slate-400 dark:text-slate-500 line-through" : "text-emerald-600 dark:text-emerald-400"}`}>
                                        ${parseFloat(item.montoAbono ?? 0).toFixed(2)}
                                    </p>
                                    {item.idEstado === 3 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded w-fit mt-1 border border-red-200 dark:border-red-800">
                                            CANCELADO
                                        </span>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Impacta saldo a favor</p>
                                    )}
                                </div>
                            </TableCell>

                            {/* Método / Ref */}
                            <TableCell>
                                <div className={`flex flex-col gap-1 ${item.idEstado === 3 ? "opacity-50" : ""}`}>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                        {getMethodIcon(item.metodoPago)}{item.metodoPago}
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Ref: {item.referencia || "N/A"}</p>
                                </div>
                            </TableCell>

                            {/* Acciones */}
                            <TableCell className="text-right pr-6">
                                <ActionButtons
                                    item={item}
                                    onView={onView}
                                    onCancel={onCancel}
                                    onPrint={onPrint}
                                    disabledCancel={item.idEstado === 3}
                                    cancelPermission="Anular Abono"
                                    labels={{
                                        view: "Ver recibo de caja",
                                        cancel: item.idEstado === 3 ? "Este abono ya fue cancelado" : "Anular este abono",
                                        print: "Exportar Recibo (PDF)"
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default AbonoTable;
