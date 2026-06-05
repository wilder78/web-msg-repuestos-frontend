import React, { useState, useEffect } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { FormField } from "../../../components/shared/FormInput";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../../components/ui/select";

export function UserForm({ 
  formData, 
  onChange, 
  onSelectChange,
  onSubmit,        // ✅ se usa solo para validar antes del submit
  onValidityChange,
  listaRoles = [],
  isEditing = false,
}) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!onValidityChange) return;

    const isNombreValid = (formData.nombreUsuario || formData.nombre || "").trim().length > 0;
    const isEmailValid  = (formData.email || "").trim().length > 0;
    const isRolValid    = !!formData.id_rol && formData.id_rol.toString().trim().length > 0;

    let isValid = isNombreValid && isEmailValid && isRolValid;

    if (!isEditing) {
      const isPasswordValid        = (formData.password || "").trim().length > 0;
      const isConfirmPasswordValid = confirmPassword.trim().length > 0;
      const passwordsMatch         = formData.password === confirmPassword;

      isValid = isValid && isPasswordValid && isConfirmPasswordValid && passwordsMatch;

      setError(isConfirmPasswordValid && !passwordsMatch
        ? "Las contraseñas no coinciden"
        : ""
      );
    }

    onValidityChange(isValid);
  }, [formData, confirmPassword, isEditing, onValidityChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  return (
    // ✅ Sin onSubmit ni id — el botón externo maneja el click directamente
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => e.preventDefault()}>

      <FormField
        label="Nombre Completo" icon={User}
        name="nombreUsuario"
        value={formData.nombreUsuario || formData.nombre || ""}
        onChange={handleInputChange}
        required
      />
      <FormField
        label="Correo Electrónico" icon={Mail}
        name="email" type="email"
        value={formData.email || ""}
        onChange={handleInputChange}
        required
      />

      <FormField label="Rol del Sistema" required>
        <Select
          value={formData.id_rol?.toString()}
          onValueChange={(val) => onSelectChange("id_rol", val)}
        >
          <SelectTrigger className="bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
            {listaRoles.map((role) => (
              <SelectItem
                key={role.idRol || role.id_rol}
                value={(role.idRol || role.id_rol).toString()}
              >
                {role.nombreRol || role.nombre_rol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      {!isEditing && (
        <>
          <FormField
            label="Contraseña" icon={Lock}
            name="password" type="password"
            value={formData.password || ""}
            onChange={handleInputChange}
            required
          />
          <FormField
            label="Confirmar Contraseña" icon={Lock}
            name="confirmPassword" type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error}
            required
          />
        </>
      )}
    </form>
  );
}