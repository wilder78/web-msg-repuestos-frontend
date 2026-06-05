import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { User, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { resolveUserRole } from "../../lib/auth-utils";


export function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();

  const profileData = useMemo(() => {
    const safeUser = user ?? {};

    return {
      name: safeUser.nombre || safeUser.nombreUsuario || "Usuario",
      email: safeUser.email || "No especificado",
      role: resolveUserRole(safeUser),
    };
  }, [user]);

  const fields = useMemo(
    () => [
      {
        key: "name",
        label: "Nombre Completo",
        icon: User,
        value: profileData.name,
      },
      {
        key: "email",
        label: "Correo Electronico",
        icon: Mail,
        value: profileData.email,
      },
      {
        key: "role",
        label: "Rol en el Sistema",
        icon: ShieldCheck,
        value: profileData.role,
      },
    ],
    [profileData]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl"
        style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
      >
        <DialogHeader className="px-7 pb-0 pt-6">
          <div className="flex items-center gap-2.5 text-[#10b981]">
            <User className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold text-[#0f172a]">
              Informacion de tu Perfil
            </DialogTitle>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <span>
              Consulta los datos personales de tu cuenta y nivel de acceso en el sistema.
            </span>
          </p>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto bg-white px-7 py-6 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="space-y-5">
            {fields.map((field) => {
              const Icon = field.icon;

              return (
                <div key={field.key}>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Icon className="h-4 w-4 text-[#10b981]" />
                    <span>{field.label}</span>
                  </label>
                  <div className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm">
                    <p className="truncate text-sm font-medium text-slate-900">
                      <span>{field.value}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
