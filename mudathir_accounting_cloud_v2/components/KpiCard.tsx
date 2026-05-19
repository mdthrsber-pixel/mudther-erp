export default function KpiCard({ title, value, hint }: any) {
  return <div className="bg-white rounded-2xl shadow-sm border p-5">
    <div className="text-slate-500 text-sm">{title}</div>
    <div className="text-2xl font-bold mt-2">{value}</div>
    <div className="text-xs text-slate-400 mt-2">{hint}</div>
  </div>
}
