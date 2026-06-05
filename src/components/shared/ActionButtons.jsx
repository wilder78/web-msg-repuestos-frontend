import { Eye, Edit2, Trash2, X, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Can } from "./Can";

const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  onCancel,
  onPrint,
  item,
  disabledEdit = false,
  disabledDelete = false,
  disabledCancel = false,
  labels = { view: "Ver detalles", edit: "Editar", delete: "Eliminar", cancel: "Anular", print: "Imprimir PDF" },
  editPermission,
  deletePermission,
  cancelPermission,
}) => {
  return (
    <div className="flex justify-end gap-1">
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          title={labels.view}
          className="h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
          onClick={(e) => { e.stopPropagation(); onView(item); }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      <Can permission={editPermission}>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            title={disabledEdit ? `${labels.edit} (Inactivo)` : labels.edit}
            className={`h-8 w-8 text-emerald-500 ${disabledEdit ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-100 hover:text-emerald-700"}`}
            disabled={disabledEdit}
            onClick={(e) => { if (disabledEdit) return; e.stopPropagation(); onEdit(item); }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </Can>

      <Can permission={deletePermission}>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            title={disabledDelete ? `${labels.delete} (Inactivo)` : labels.delete}
            className={`h-8 w-8 text-red-400 ${disabledDelete ? "opacity-50 cursor-not-allowed" : "hover:bg-red-100 hover:text-red-600"}`}
            disabled={disabledDelete}
            onClick={(e) => { if (disabledDelete) return; e.stopPropagation(); onDelete(item); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </Can>

      <Can permission={cancelPermission}>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            title={disabledCancel ? `${labels.cancel} (Inactivo)` : labels.cancel}
            className={`h-8 w-8 text-rose-500 ${disabledCancel ? "opacity-50 cursor-not-allowed" : "hover:bg-rose-100 hover:text-rose-700"}`}
            disabled={disabledCancel}
            onClick={(e) => { if (disabledCancel) return; e.stopPropagation(); onCancel(item); }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Can>

      {onPrint && (
        <Button
          variant="ghost"
          size="icon"
          title={labels.print}
          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => { e.stopPropagation(); onPrint(item); }}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
