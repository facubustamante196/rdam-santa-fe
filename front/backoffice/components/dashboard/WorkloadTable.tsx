type WorkloadItem = {
  label: string;
  total: number;
};

type WorkloadTableProps = {
  items: WorkloadItem[];
};

export function WorkloadTable({ items }: WorkloadTableProps) {
  const max = Math.max(1, ...items.map((item) => item.total));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Carga de equipo
      </h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-slate-700">{item.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.max(8, Math.round((item.total / max) * 100))}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
