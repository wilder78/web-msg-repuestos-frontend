import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import { CreditCard, Loader2, ShieldAlert } from "lucide-react";
import ActionButtons from "../../../components/shared/ActionButtons";
import StatusToggleButton from "../../../components/shared/StatusToggleButton";

const isActiveCredit = (item) => item.idEstado === 1 || item.id_estado === 1 || item.estado === "Activo";

const CreditTable = ({
    data,
    loading,
    authFetch,
    getAvatarColor,
    getInitials,
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-zinc-400 flex flex-col items-center justify-center">
                <ShieldAlert className="mb-3 h-12 w-12 text-slate-300 dark:text-zinc-650" />
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">No hay créditos registrados</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-zinc-500">El sistema no encontró clientes con límites de crédito asignados.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/40">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="pl-6 w-[130px] text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Crédito ID</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Cliente</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Límite Aprobado</TableHead>
                        <TableHead className="text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Estado</TableHead>
                        <TableHead className="text-right pr-6 text-slate-400 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.idCredito} className="group hover:bg-blue-50/60 dark:hover:bg-slate-700/30 transition-colors">
                            <TableCell className="pl-6 font-medium text-slate-900 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                                    #C-{item.idCredito}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${getAvatarColor(item.id_cliente || item.idCredito)}`}>
                                        {getInitials(item.clienteNombre || "Cliente")}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-zinc-100 leading-tight">{item.clienteNombre || `Cliente #${item.id_cliente}`}</p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">ID Cliente: {item.id_cliente || item.idCliente}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <p className="font-bold text-[#10b981] dark:text-emerald-400">
                                    ${parseFloat(item.cupoAprobado ?? item.montoCredito ?? 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-zinc-500">
                                    Disp: <span className="font-semibold text-slate-600 dark:text-slate-300">${(parseFloat(item.cupoAprobado ?? item.montoCredito ?? 0) - parseFloat(item.cupoUtilizado ?? 0)).toFixed(2)}</span>
                                </p>
                            </TableCell>
                            <TableCell>
                                <StatusToggleButton
                                    id={item.idCredito}
                                    currentStatus={item.idEstado || item.id_estado}
                                    apiUrl="/api/credits"
                                    onSuccess={onToggleStatus}
                                    authFetch={authFetch}
                                    fieldName="idEstado"
                                    customBody={item}
                                />
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <ActionButtons
                                    item={item}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    disabledEdit={!isActiveCredit(item)}
                                    disabledDelete={!isActiveCredit(item)}
                                    editPermission="Editar Crédito"
                                    deletePermission="Eliminar Crédito"
                                    labels={{
                                        view: "Ver crédito",
                                        edit: "Editar crédito",
                                        delete: "Eliminar crédito",
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

export default CreditTable;
