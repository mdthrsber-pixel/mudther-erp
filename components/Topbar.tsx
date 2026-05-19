
export default function Topbar() {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4 flex justify-between items-center mb-6">
      <div>
        <div className="font-bold text-xl">لوحة المدير</div>
        <div className="text-sm text-slate-500">نظام محاسبي سحابي متكامل</div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-xl text-sm">
          النظام متصل
        </div>
      </div>
    </div>
  );
}
