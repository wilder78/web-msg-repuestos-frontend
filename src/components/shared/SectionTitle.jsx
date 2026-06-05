import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function SectionTitle({ subtitle, title, href, linkLabel = "Ver más" }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {subtitle && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
            {subtitle}
          </p>
        )}
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl flex items-center gap-3 flex-wrap">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          to={href}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 sm:mt-0"
        >
          {linkLabel}
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}