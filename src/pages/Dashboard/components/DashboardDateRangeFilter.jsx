import React from "react";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
} from "../../../lib/dashboard-date-range";

export default function DashboardDateRangeFilter({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  disabled,
  periodLabel,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex items-center gap-2 min-w-[140px]">
        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
        <Select value={preset} onValueChange={onPresetChange} disabled={disabled}>
          <SelectTrigger className="h-9 w-[150px] border-slate-200 bg-slate-50 text-xs font-medium">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === DATE_PRESETS.CUSTOM && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            disabled={disabled}
            className="h-9 w-[130px] text-xs"
            aria-label="Fecha desde"
          />
          <span className="text-slate-400 text-xs">—</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            disabled={disabled}
            className="h-9 w-[130px] text-xs"
            aria-label="Fecha hasta"
          />
        </div>
      )}

      {periodLabel && (
        <p className="text-[10px] text-slate-500 hidden lg:block max-w-[120px] leading-tight">
          {periodLabel}
        </p>
      )}
    </div>
  );
}
