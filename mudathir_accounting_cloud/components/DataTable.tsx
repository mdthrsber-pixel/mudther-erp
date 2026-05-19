export default function DataTable({ columns, rows }: any) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((c: string) => <th key={c} className="p-3 text-right whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              {columns.map((c: string) => <td key={c} className="p-3 whitespace-nowrap">{r[c] ?? "-"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
