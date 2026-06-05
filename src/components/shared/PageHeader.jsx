import React from "react";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import { Can } from "./Can";

const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  buttonText,
  onButtonClick,
  buttonColor = "bg-emerald-600 hover:bg-emerald-700",
  createPermission,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-emerald-600" />}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
      </div>

      {buttonText && (
        <Can permission={createPermission}>
          <Button
            onClick={onButtonClick}
            className={`${buttonColor} text-white shadow-sm transition-all`}
          >
            <Plus className="mr-2 h-4 w-4" /> {buttonText}
          </Button>
        </Can>
      )}
    </div>
  );
};

export default PageHeader;
