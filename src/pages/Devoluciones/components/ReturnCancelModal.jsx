import React from "react";
import { ConfirmActionModal } from "../../../components/shared/ConfirmActionModal";

const ReturnCancelModal = ({ isOpen, onClose, onConfirm, devolucion, loading }) => {
  if (!devolucion) return null;

  // Normalizamos el total para mostrarlo correctamente
  const totalMostrado = devolucion.totalAjuste || devolucion.totalDevolucion || 0;
  const nombreCliente = devolucion.cliente?.razonSocial || devolucion.clienteNombre || "Cliente General";

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      // Pasamos el ID correcto para la ruta DELETE o PATCH del backend
      onConfirm={() => onConfirm(devolucion.idDevolucion)} 
      loading={loading}
      title="¿Anular Devolución de Mercancía?"
      description="Esta acción revertirá los cambios en el inventario: el stock que ingresó se restará nuevamente."
      itemName={nombreCliente}
      itemSubtitle={`Comprobante por valor de $${Number(totalMostrado).toLocaleString()}`}
      itemId={`DEV-${devolucion.idDevolucion?.toString().padStart(3, "0")}`}
      variant="danger"
      alertMessage="Atención: La anulación restará el stock de buen estado del inventario y marcará el documento como anulado en el sistema."
    />
  );
};

export default ReturnCancelModal;