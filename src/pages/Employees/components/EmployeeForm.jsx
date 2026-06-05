import React, { useEffect } from 'react';
import { Contact, FileText, Phone, Briefcase, User as UserIcon } from 'lucide-react';
import { FormField } from "../../../components/shared/FormInput";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export function EmployeeForm({
  formData,
  onChange,
  onSelectChange,
  onValidityChange,
  roles = [],
  availableUsers = [],
  usedUserIds = [],
  isEditing = false,
  canEditIdentity = false,
}) {
  useEffect(() => {
    if (!onValidityChange) return;

    const isNombreValid = (formData.nombre || "").trim().length > 0;
    const isApellidoValid = (formData.apellido || "").trim().length > 0;
    const isTelefonoValid = (formData.telefono || "").trim().length > 0;
    const isRolValid = !isEditing || formData.idUsuario === null ? true : (formData.rolOperativo || "").trim().length > 0;

    let isValid = isNombreValid && isApellidoValid && isTelefonoValid && isRolValid;

    if (!isEditing) {
      const isDocumentoValid = (formData.numeroDocumento || "").trim().length > 0;
      isValid = isValid && isDocumentoValid && !!formData.idTipoDocumento;
    }

    onValidityChange(isValid);
  }, [formData, isEditing, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };
  const identityReadOnly = isEditing && !canEditIdentity;

  const usedSet = new Set(usedUserIds.map((id) => String(id)));
  const filteredUsers = availableUsers.filter((user) => {
    const roleId = Number(user.idRol ?? user.idrol ?? user.id_rol ?? user.rol?.idRol ?? user.rol?.idrol ?? user.rol?.id_rol ?? 0);
    const roleName = (
      user.nombreRol ||
      user.nombrerol ||
      user.nombre_rol ||
      user.rol?.nombreRol ||
      user.rol?.nombrerol ||
      user.rol?.nombre_rol ||
      ""
    ).toLowerCase();
    if (roleId === 4 || roleName.includes("cliente")) return false;

    const userId = String(user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id);
    const currentSelected =
      formData.idUsuario !== null && formData.idUsuario !== undefined
        ? String(formData.idUsuario)
        : null;
    if (currentSelected && userId === currentSelected) return true;
    return !usedSet.has(userId);
  });

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
      <FormField label="Tipo Documento" icon={Contact} required>
        <Select
          value={formData.idTipoDocumento?.toString()}
          onValueChange={(val) => onSelectChange("idTipoDocumento", val)}
          disabled={identityReadOnly}
        >
          <SelectTrigger className={`pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white ${identityReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
            <SelectItem value="1">Cédula de Ciudadanía</SelectItem>
            <SelectItem value="2">Cédula de Extranjería</SelectItem>
            <SelectItem value="3">NIT</SelectItem>
            <SelectItem value="4">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="space-y-2 w-full">
        <Label className="text-slate-700 dark:text-zinc-350 font-bold flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            Número de Documento <span className="text-emerald-500">*</span>
          </div>
          {(formData.numeroDocumento?.length >= 15) && !identityReadOnly && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/50 animate-in fade-in zoom-in duration-200">
              Máx. 15 caracteres
            </span>
          )}
        </Label>
        <div className="relative w-full">
          <Input
            name="numeroDocumento"
            value={formData.numeroDocumento || ""}
            onChange={handleInputChange}
            disabled={identityReadOnly}
            placeholder="Ej: 1020304050"
            maxLength={15}
            className={`w-full h-11 px-4 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl focus-visible:ring-emerald-500 transition-colors ${
              (formData.numeroDocumento?.length >= 15) && !identityReadOnly
                ? "border-amber-400 focus-visible:ring-amber-400"
                : "border-slate-200 dark:border-zinc-700"
            }`}
          />
        </div>
      </div>

      <FormField
        label="Nombres" icon={FileText}
        name="nombre"
        value={formData.nombre || ""}
        onChange={handleInputChange}
        required
        placeholder="Juan Pérez"
      />

      <FormField
        label="Apellidos"
        name="apellido"
        value={formData.apellido || ""}
        onChange={handleInputChange}
        required
        placeholder="García López"
      />

      <div className="space-y-2 w-full">
        <Label className="text-slate-700 dark:text-zinc-350 font-bold flex justify-between items-center text-xs">
          <div className="flex items-center gap-1">
            Teléfono <span className="text-emerald-500">*</span>
          </div>
          {(formData.telefono?.length >= 16) && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/50 animate-in fade-in zoom-in duration-200">
              Máx. 16 caracteres
            </span>
          )}
        </Label>
        <div className="relative group flex items-center w-full">
          <Phone className="absolute left-3 text-slate-400 dark:text-zinc-500 transition-colors group-focus-within:text-emerald-600 z-10" size={16} />
          <Input
            name="telefono"
            value={formData.telefono || ""}
            onChange={handleInputChange}
            placeholder="Ej: 3205697845"
            maxLength={16}
            className={`w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl focus-visible:ring-emerald-500 transition-colors ${
              (formData.telefono?.length >= 16)
                ? "border-amber-400 focus-visible:ring-amber-400"
                : "border-slate-200 dark:border-zinc-700"
            }`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800 mt-2">
        <FormField label="Vincular Cuenta de Usuario (Opcional)" icon={UserIcon}>
          <Select
            value={
              formData.idUsuario === null || formData.idUsuario === undefined
                ? "null"
                : formData.idUsuario.toString()
            }
            onValueChange={(val) => {
              onSelectChange("idUsuario", val === "null" ? null : val);
            }}
          >
            <SelectTrigger className="pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="Ninguno / Sin cuenta" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px] overflow-y-auto border-slate-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
              <SelectItem value="null" className="font-semibold text-slate-500 dark:text-zinc-400 italic">
                Ninguno / Sin cuenta
              </SelectItem>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const userId = user.idUsuario ?? user.idusuario ?? user.id_usuario ?? user.id;
                  const roleName =
                    user.nombreRol ||
                    user.nombrerol ||
                    user.nombre_rol ||
                    user.rol?.nombreRol ||
                    user.rol?.nombrerol ||
                    user.rol?.nombre_rol ||
                    "Sin rol";
                  return (
                    <SelectItem
                      key={userId}
                      value={userId.toString()}
                    >
                      {user.nombreUsuario || user.nombreusuario || user.nombre || "Usuario"} ({user.email}) - {roleName}
                    </SelectItem>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-slate-400 dark:text-zinc-500 italic">No hay usuarios disponibles</div>
              )}
            </SelectContent>
          </Select>
          {!isEditing && <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-1">Solo se muestran usuarios sin empleado ni cliente asignado.</p>}
        </FormField>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
          <FormField label={`Rol Operativo ${formData.idUsuario ? '*' : ''}`} icon={Briefcase}>
            <Select
              value={formData.rolOperativo || ""}
              onValueChange={(val) => onSelectChange("rolOperativo", val)}
              disabled={!formData.idUsuario || (isEditing && !!formData.idUsuario)}
            >
              <SelectTrigger className={`pl-10 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white ${(!formData.idUsuario || (isEditing && !!formData.idUsuario)) ? "opacity-60 cursor-not-allowed" : ""}`}>
                <SelectValue placeholder={!formData.idUsuario ? "Vincule un usuario primero" : "Seleccionar cargo"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                {roles.map((rol) => (
                  <SelectItem key={rol.idRol} value={rol.nombreRol}>
                    {rol.nombreRol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && !!formData.idUsuario && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic">
                El rol está sincronizado con la cuenta de usuario. Para cambiarlo, por favor edite el rol desde Gestión de Usuarios.
              </p>
            )}
          </FormField>
        </div>
      )}
    </form>
  );
}
