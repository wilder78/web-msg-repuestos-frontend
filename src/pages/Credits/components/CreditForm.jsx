import React, { useState, useEffect, useMemo } from "react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  BadgeDollarSign,
  UserCheck,
  Wallet,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "CL";

const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-violet-500",
  "bg-amber-500", "bg-rose-500", "bg-sky-500",
];
const avatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];

export function CreditForm({
  formData,
  onChange,
  onValidityChange,
  isEditing = false,
  item = null,
  customers = [],
  creditedIds = [],
}) {
  const [customerOrderCount, setCustomerOrderCount] = useState(null);
  const [loadingAverage, setLoadingAverage] = useState(false);

  // Selected customer object for Create mode
  const selectedCustomer = useMemo(() => {
    if (isEditing) return null;
    return customers.find(c => String(c.idCliente) === String(formData.idCliente)) || null;
  }, [customers, formData.idCliente, isEditing]);

  const creditedIdsSet = useMemo(() => new Set(creditedIds), [creditedIds]);

  // Fetch purchase history / average when customer is selected
  useEffect(() => {
    if (isEditing || !formData.idCliente) {
      setCustomerOrderCount(null);
      return;
    }

    const fetchAverage = async () => {
      setLoadingAverage(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/customers/${formData.idCliente}/purchase-average`,
          { headers: authHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          const count = data.orderCount || 0;
          setCustomerOrderCount(count);

          if (count >= 5) {
            if (data.average > 0) {
              const suggestedCupo = Math.min(data.average, 5000000);
              onChange({
                ...formData,
                cupoAprobado: suggestedCupo.toString(),
              });
            } else {
              onChange({ ...formData, cupoAprobado: "" });
            }
          } else {
            onChange({ ...formData, cupoAprobado: "" });
            toast.error(
              `El cliente debe contar con un historial mínimo de 5 compras pagadas (Actuales: ${count}/5)`,
              { id: "min-orders-toast" }
            );
          }
        }
      } catch (err) {
        console.error("Error al obtener promedio de compras", err);
      } finally {
        setLoadingAverage(false);
      }
    };

    fetchAverage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.idCliente, isEditing]);

  // Validation Logic
  useEffect(() => {
    const cupoNum = Number(formData.cupoAprobado);
    const isCupoValid = cupoNum > 0 && cupoNum <= 5000000;

    if (isEditing) {
      const hasChanged =
        cupoNum !== parseFloat(item?.cupoAprobado ?? item?.montoCredito ?? 0) ||
        Number(formData.idEstado) !== Number(item?.idEstado ?? 1);
      onValidityChange(isCupoValid && hasChanged);
    } else {
      const meetsMinimumOrders = customerOrderCount !== null && customerOrderCount >= 5;
      const alreadyHasCredit = formData.idCliente ? creditedIdsSet.has(Number(formData.idCliente)) : false;
      const isValid = Boolean(formData.idCliente) && isCupoValid && !alreadyHasCredit && meetsMinimumOrders;
      onValidityChange(isValid);
    }
  }, [formData, isEditing, item, customerOrderCount, creditedIdsSet, onValidityChange]);

  const handleFieldChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  const cupoNum = Number(formData.cupoAprobado);
  const isCupoValid = cupoNum > 0 && cupoNum <= 5000000;
  if (isEditing && item) {
    return (
      <div className="space-y-5 py-2 px-1">
        {/* Customer card (Read Only) */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 px-4 py-3">
          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/20 rounded-full flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {item.clienteNombre || `Cliente #${item.idCliente ?? item.id_cliente}`}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              ID Cliente: {item.idCliente ?? item.id_cliente}
              {item.numeroDocumento ? ` · Doc: ${item.numeroDocumento}` : ""}
            </p>
          </div>
        </div>

        {/* Cupo aprobado */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
            Cupo Aprobado <span className="text-emerald-500">*</span>
            <span className="ml-2 font-normal text-slate-400 dark:text-zinc-500">
              Actual: ${parseFloat(item.cupoAprobado ?? item.montoCredito ?? 0).toFixed(2)}
            </span>
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-2.5 text-slate-500 dark:text-zinc-500 font-bold">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.cupoAprobado}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange("cupoAprobado", val);
                if (Number(val) > 5000000) {
                  toast.error("El monto ingresado supera el cupo máximo de crédito permitido por la empresa ($5,000,000)", { id: "cupo-max-toast" });
                }
              }}
              className={`pl-8 h-11 rounded-xl font-bold text-lg border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-[#10b981]
                ${formData.cupoAprobado && !isCupoValid ? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20" : ""}`}
            />
          </div>
          {formData.cupoAprobado && !isCupoValid && (
            <p className="text-red-500 text-[11px] mt-1">
              {cupoNum > 5000000 
                ? "El cupo excede el límite de $5,000,000."
                : "El cupo debe ser mayor a $0."}
            </p>
          )}
          {isCupoValid && cupoNum !== parseFloat(item.cupoAprobado ?? 0) && (
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Nuevo disponible:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${(cupoNum - parseFloat(item.cupoUtilizado ?? 0)).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Estado */}
        <div>
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
            Estado del Crédito
          </Label>
          <Select
            value={formData.idEstado}
            onValueChange={(val) => handleFieldChange("idEstado", val)}
          >
            <SelectTrigger className="h-11 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-[#10b981] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
              <SelectItem value="1">Activo</SelectItem>
              <SelectItem value="2">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Create Mode
  return (
    <div className="space-y-5 py-2 px-1">
      {/* Customer select */}
      <div>
        <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Cliente <span className="text-[#10b981]">*</span>
          {loadingAverage && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
          <span className="font-normal text-slate-400 dark:text-zinc-500">
            {customers.length} activos
          </span>
        </Label>

        <Select
          value={formData.idCliente?.toString() || ""}
          onValueChange={(val) => handleFieldChange("idCliente", val)}
        >
          <SelectTrigger className="h-[42px] border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm focus:ring-[#10b981] rounded-xl">
            <SelectValue placeholder="Selecciona un cliente de la lista" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white animate-in fade-in-50">
            {customers.length === 0 && (
              <SelectItem value="__no_customers__" disabled>
                No hay clientes disponibles
              </SelectItem>
            )}
            {customers.map((c) => {
              const hasCredit = creditedIdsSet.has(c.idCliente);
              return (
                <SelectItem
                  key={c.idCliente}
                  value={c.idCliente.toString()}
                  disabled={hasCredit}
                >
                  {c.displayName} {c.documento ? `- Doc: ${c.documento}` : ""} {hasCredit ? "(Ya tiene crédito)" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedCustomer && (
          <div className="flex items-center gap-3 mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ring-1 ring-slate-100 dark:ring-zinc-800 ${avatarColor(selectedCustomer.idCliente)}`}>
              {getInitials(selectedCustomer.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedCustomer.displayName}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-zinc-400">
                {selectedCustomer.documento && <span>Doc: {selectedCustomer.documento}</span>}
                <span>ID: {selectedCustomer.idCliente}</span>
                {creditedIdsSet.has(selectedCustomer.idCliente) ? (
                  <span className="rounded-md bg-amber-100 dark:bg-amber-950/30 px-1.5 py-0.5 font-semibold text-amber-750 dark:text-amber-400">
                    ⚠ Ya tiene crédito
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ Sin crédito asignado
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-zinc-850" />

      {/* Cupo aprobado */}
      <div className={!selectedCustomer ? "pointer-events-none opacity-45" : ""}>
        <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Cupo Aprobado <span className="text-[#10b981]">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-2.5 font-bold text-slate-500 dark:text-zinc-500">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej: 5000.00"
            value={formData.cupoAprobado}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange("cupoAprobado", val);
              if (Number(val) > 5000000) {
                toast.error("El monto ingresado supera el cupo máximo de crédito permitido por la empresa ($5,000,000)", { id: "cupo-max-toast" });
              }
            }}
            disabled={!selectedCustomer || (customerOrderCount !== null && customerOrderCount < 5)}
            className={`h-11 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 text-lg font-bold focus-visible:ring-[#10b981]
              ${(formData.cupoAprobado && !isCupoValid) || (selectedCustomer && customerOrderCount !== null && customerOrderCount < 5)
                ? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 focus-visible:ring-red-400"
                : "text-slate-800 dark:text-slate-100"
              }`}
          />
        </div>
        {selectedCustomer && customerOrderCount !== null && customerOrderCount < 5 && (
          <p className="mt-1.5 text-xs font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            No se puede asignar crédito: Historial mínimo de 5 compras pagadas es requerido (Actuales: {customerOrderCount}/5).
          </p>
        )}
        {formData.cupoAprobado && !isCupoValid && customerOrderCount !== null && customerOrderCount >= 5 && (
          <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
            {cupoNum > 5000000 
              ? "El cupo excede el límite de $5,000,000."
              : "El cupo debe ser mayor a $0."}
          </p>
        )}
        {isCupoValid && customerOrderCount !== null && customerOrderCount >= 5 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <Wallet className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>
              El cliente podrá comprar a crédito hasta{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">${cupoNum.toFixed(2)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Notas opcionales */}
      <div className={!selectedCustomer ? "pointer-events-none opacity-45" : ""}>
        <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Notas internas{" "}
          <span className="font-normal text-slate-400 dark:text-zinc-500">(opcional)</span>
        </Label>
        <textarea
          rows={2}
          placeholder="Motivo de la asignación, condiciones especiales…"
          value={formData.notas}
          onChange={(e) => handleFieldChange("notas", e.target.value)}
          disabled={!selectedCustomer}
          className="w-full resize-none rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 px-4 py-3 text-sm text-slate-700 dark:text-zinc-350 placeholder:text-slate-400 dark:placeholder:text-zinc-550 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981] disabled:opacity-50"
        />
      </div>
    </div>
  );
}
