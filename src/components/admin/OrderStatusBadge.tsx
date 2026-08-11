import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/site";

export function OrderStatusBadge({ status }: { status: string }) {
  const label =
    ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
  const style =
    ORDER_STATUS_STYLES[status as keyof typeof ORDER_STATUS_STYLES] ??
    "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${style}`}
    >
      {label}
    </span>
  );
}
