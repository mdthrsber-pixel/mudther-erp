'use client';
import { Home, Building2, Wallet, CreditCard, Receipt, BarChart3, Settings, Users } from "lucide-react";

const items = [
  { id: "dashboard", label: "لوحة المدير", icon: Home },
  { id: "branches", label: "تفاصيل الفروع", icon: Building2 },
  { id: "daily", label: "الإيرادات اليومية", icon: Wallet },
  { id: "expenses", label: "المصروفات", icon: Receipt },
  { id: "bank", label: "البنك", icon: CreditCard },
  { id: "pos", label: "نقاط البيع", icon: CreditCard },
  { id: "reports", label: "التقارير", icon: BarChart3 },
  { id: "users", label: "المستخدمين", icon: Users },
  { id: "settings", label: "الإعدادات", icon: Settings },
];

export default function Sidebar({ active, setActive }: any) {
  return (
    <aside className="bg-slate-950 text-white w-full md:w-72 md:min-h-screen p-4">
      <div className="text-center border-b border-slate-700 pb-4 mb-4">
        <div className="text-2xl font-bold">نظام مدثر</div>
        <div className="text-sm text-slate-300">محاسبة سحابية</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right transition ${active === item.id ? "bg-blue-600" : "hover:bg-slate-800"}`}>
              <Icon size={20} /><span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
