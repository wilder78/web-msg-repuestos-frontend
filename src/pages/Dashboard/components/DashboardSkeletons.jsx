import React from "react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "../../../lib/utils";

const BAR_HEIGHTS = [72, 48, 88, 56, 64, 40, 92, 52];

export function KpiGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn("grid gap-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="border border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-44" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({
  className,
  height = 300,
  variant = "bar",
  colSpan,
}) {
  return (
    <Card className={cn(colSpan, className)}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        {variant === "donut" ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton className="h-44 w-44 rounded-full" />
          </div>
        ) : variant === "line" ? (
          <div className="relative" style={{ height }}>
            <Skeleton className="absolute inset-0 rounded-lg opacity-40" />
            <svg
              className="absolute inset-0 w-full h-full text-slate-200/80"
              preserveAspectRatio="none"
              viewBox="0 0 400 120"
            >
              <path
                d="M0,90 Q50,70 100,75 T200,50 T300,60 T400,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="animate-pulse"
              />
            </svg>
          </div>
        ) : variant === "table" ? (
          <div className="space-y-2" style={{ height }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div
            className="flex items-end justify-around gap-2 px-2"
            style={{ height }}
          >
            {BAR_HEIGHTS.map((pct, i) => (
              <Skeleton
                key={i}
                className="flex-1 max-w-12 rounded-t-md"
                style={{ height: `${pct}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardVentasSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCardSkeleton variant="bar" height={300} />
      <ChartCardSkeleton variant="donut" height={300} />
      <ChartCardSkeleton variant="line" height={320} className="lg:col-span-2" />
      <ChartCardSkeleton variant="table" height={320} className="lg:col-span-2" />
    </div>
  );
}

export function DashboardInventarioSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCardSkeleton variant="bar" height={360} />
      <ChartCardSkeleton variant="table" height={360} />
    </div>
  );
}

export function DashboardCarteraSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCardSkeleton variant="bar" height={320} />
      <ChartCardSkeleton variant="donut" height={320} />
    </div>
  );
}

export function DashboardLogisticaSkeleton() {
  return (
    <div className="space-y-6">
      <ChartCardSkeleton variant="donut" height={340} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCardSkeleton variant="bar" height={320} />
        <ChartCardSkeleton variant="table" height={320} />
      </div>
    </div>
  );
}
