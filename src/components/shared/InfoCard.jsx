import React from "react";

const InfoCard = ({ icon: Icon, iconColor = "slate", title, children }) => {
  const colorVariants = {
    blue: "border-blue-100 bg-blue-50/30 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-300",
    emerald: "border-emerald-100 bg-emerald-50/30 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300",
    violet: "border-violet-100 bg-violet-50/30 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/25 dark:text-violet-300",
    amber: "border-amber-100 bg-amber-50/30 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300",
    slate: "border-slate-200 bg-white text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400",
    rose: "border-rose-100 bg-rose-50/30 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300",
  };

  const iconColorVariants = {
    blue: "text-blue-700 dark:text-blue-400",
    emerald: "text-emerald-700 dark:text-emerald-400",
    violet: "text-violet-700 dark:text-violet-400",
    amber: "text-amber-700 dark:text-amber-400",
    slate: "text-slate-500 dark:text-zinc-400",
    rose: "text-rose-700 dark:text-rose-400",
  };

  // Validar que el color exista, si no usar slate por defecto
  const validColor = colorVariants[iconColor] ? iconColor : "slate";

  return (
    <div
      className={`p-4 rounded-xl border ${colorVariants[validColor]} space-y-3 transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColorVariants[validColor]}`} />
        <span className="text-[11px] font-bold">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
};

export default InfoCard;
