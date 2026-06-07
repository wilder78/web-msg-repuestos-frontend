import React, { useState, useEffect } from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Users, Plus, Trash2, MapPin, Map, Calendar, User } from "lucide-react";

export function RouteForm({
  formData,
  onChange,
  onSelectChange,
  onValidityChange,
  listaZonas = [],
  listaEmpleados = [],
  listaClientes = [],
}) {
  const [selectedCliente, setSelectedCliente] = useState("");

  const vendedoresDisponibles = (listaEmpleados || []).filter((e) => {
    const roleId = Number(e.idRol ?? e.id_role ?? e.usuario?.idRol ?? e.usuario?.id_role ?? 0);
    const isCurrent = formData.idEmpleado && String(e.idEmpleado) === String(formData.idEmpleado);
    return roleId === 3 || isCurrent;
  });

  useEffect(() => {
    if (!onValidityChange) return;

    const isNombreValid = (formData.nombreRuta || "").trim().length > 0;
    const isZonaValid = !!formData.idZona;
    const isFechaValid = !!formData.fechaPlanificada;
    const hasClientes = formData.detalles?.length > 0;

    const isFormValid = isNombreValid && isZonaValid && isFechaValid && hasClientes;

    onValidityChange(isFormValid);
  }, [formData, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const addClienteALista = () => {
    if (!selectedCliente) return;

    const clienteObj = listaClientes.find((c) => String(c.idCliente) === String(selectedCliente));
    if (!clienteObj) return;

    if (formData.detalles?.some((d) => d.idCliente === clienteObj.idCliente)) return;

    const nuevosDetalles = [
      ...(formData.detalles || []),
      {
        idCliente: clienteObj.idCliente,
        nombreCliente: clienteObj.razonSocial || `${clienteObj.nombre || ''} ${clienteObj.apellido || ''}`.trim() || 'Cliente Sin Nombre',
        idPedido: null,
      },
    ];

    onSelectChange("detalles", nuevosDetalles);
    setSelectedCliente("");
  };

  const removeCliente = (idCliente) => {
    const filtrados = formData.detalles.filter((d) => d.idCliente !== idCliente);
    onSelectChange("detalles", filtrados);
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Map className="h-4 w-4 text-blue-500" /> Nombre de la Ruta *
          </Label>
          <Input
            name="nombreRuta"
            value={formData.nombreRuta || ""}
            onChange={handleInputChange}
            placeholder="Ej: Ruta Norte"
            className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-emerald-500" /> Zona Operativa *
          </Label>
          <Select
            value={formData.idZona?.toString() || ""}
            onValueChange={(val) => onSelectChange("idZona", val)}
          >
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-emerald-500">
              <SelectValue placeholder="Seleccionar zona" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
              {listaZonas.map((z) => (
                <SelectItem key={z.idZona} value={z.idZona.toString()}>
                  {z.nombreZona}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-violet-500" /> Fecha Planificada *
          </Label>
          <Input
            name="fechaPlanificada"
            type="date"
            value={formData.fechaPlanificada || ""}
            onChange={handleInputChange}
            className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-violet-500"
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <User className="h-4 w-4 text-amber-500" /> Vendedor Asignado (Opcional)
          </Label>
          <Select
            value={formData.idEmpleado?.toString() || ""}
            onValueChange={(val) => onSelectChange("idEmpleado", val)}
            disabled={vendedoresDisponibles.length === 0}
          >
            <SelectTrigger className="rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus-visible:ring-amber-500">
              <SelectValue placeholder={vendedoresDisponibles.length === 0 ? "No hay vendedores" : "Seleccionar vendedor"} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
              {vendedoresDisponibles.length === 0 ? (
                <SelectItem value="none" disabled>
                  No hay vendedores registrados en el sistema
                </SelectItem>
              ) : (
                vendedoresDisponibles.map((e) => (
                  <SelectItem key={e.idEmpleado} value={e.idEmpleado.toString()}>
                    {e.nombre} {e.apellido}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {vendedoresDisponibles.length === 0 && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1">
              <span>⚠️ Para asignar una ruta, primero debes registrar un empleado con el rol de Vendedor en el módulo de Empleados.</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
        <Label className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Clientes en la Ruta ({formData.detalles?.length || 0})
        </Label>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Select
              value={selectedCliente}
              onValueChange={(val) => {
                setSelectedCliente(val);
                setTimeout(() => {
                  document.getElementById("add-client-btn")?.click();
                }, 100);
              }}
            >
              <SelectTrigger className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-xl">
                <SelectValue placeholder="Buscar cliente para agregar..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                {listaClientes.map((c) => {
                  const muniName = c.municipio?.nombre || c.municipio?.nombreMunicipio || "";
                  return (
                    <SelectItem key={c.idCliente} value={c.idCliente.toString()}>
                      {c.razonSocial || `${c.nombre || ""} ${c.apellido || ""}`.trim()}
                      {muniName ? ` (${muniName})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            id="add-client-btn"
            type="button"
            onClick={addClienteALista}
            size="icon"
            className="bg-blue-600 rounded-xl hover:bg-blue-700 shrink-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {formData.detalles?.length > 0 ? (
            formData.detalles.map((det, index) => (
              <div
                key={det.idCliente}
                className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                    {det.cliente?.razonSocial || det.nombreCliente || `Cliente #${det.idCliente}`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCliente(det.idCliente)}
                  className="text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-400 dark:text-zinc-500 py-4 italic">
              No hay clientes asignados a esta ruta todavía.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
