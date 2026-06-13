import React from "react";
import { toast } from "sonner";
import SuccessToast from "../components/ui/SuccessToast";

export const showForbiddenToast = () => {
  toast.custom((id) => (
    <SuccessToast
      visible={true}
      title="Acceso denegado"
      message="No tienes permisos para realizar esta acción"
      type="error"
      onClose={() => toast.dismiss(id)}
    />
  ), {
    duration: 4000,
  });
};
