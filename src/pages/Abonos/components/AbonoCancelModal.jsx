import React from "react";
import { ConfirmActionModal } from "../../../components/shared/ConfirmActionModal";

const AbonoCancelModal = ({ isOpen, onClose, onConfirm, abono, loading }) => {
  if (!abono) return null;

  const monto = parseFloat(abono.montoAbono ?? 0);
  const cliente = abono.clienteNombre || "Cliente";

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm(abono.idAbono)}
      loading={loading}
      title="¿Anular Recibo de Caja?"
      description="Esta acción revertirá el pago: si fue un abono a crédito, la deuda del cliente aumentará nuevamente. Si fue a un pedido, este volverá a tener saldo pendiente."
      itemName={cliente}
      itemSubtitle={`Abono registrado por $${monto.toLocaleString()}`}
      itemId={`RCP-${abono.idAbono?.toString().padStart(3, "0")}`}
      variant="danger"
      alertMessage="Atención: Esta acción no se puede deshacer. Se restablecerá la deuda original del cliente en el sistema."
    />
  );
};

export default AbonoCancelModal;
