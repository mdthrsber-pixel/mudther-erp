export default function DataTable({ columns, rows, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((c: string) => (
              <th key={c} className="p-3 text-right whitespace-nowrap">{c}</th>
            ))}
            {(onEdit || onDelete) && <th className="p-3 text-right whitespace-nowrap">الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r: any, i: number) => (
            <tr key={r.id || i} className="border-t hover:bg-slate-50">
              {columns.map((c: string) => (
                <td key={c} className="p-3 whitespace-nowrap">{r[c] ?? "-"}</td>
              ))}
              {(onEdit || onDelete) && (
                <td className="p-3 whitespace-nowrap flex gap-3">
                  {onEdit && <button onClick={() => onEdit(r)} className="text-blue-600">تعديل</button>}
                  {onDelete && <button onClick={() => onDelete(r)} className="text-red-600">حذف</button>}
                </td>
              )}
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr><td colSpan={columns.length + 1} className="p-6 text-center text-slate-400">لا توجد بيانات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
