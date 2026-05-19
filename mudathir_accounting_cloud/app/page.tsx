'use client';

import { useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import * as XLSX from "xlsx";

const branches = [
  { "اسم الفرع": "الفرع الرئيسي", "المدينة": "الرياض", "المدير": "مدير الفرع", "الحالة": "نشط" },
  { "اسم الفرع": "فرع السليمانية", "المدينة": "الرياض", "المدير": "مدير السليمانية", "الحالة": "نشط" },
];

const daily = [
  { "التاريخ": "2026-05-16", "الفرع": "الفرع الرئيسي", "كاش": 1500, "بنك": 800, "نقاط بيع": 2200, "الإجمالي": 4500 },
  { "التاريخ": "2026-05-16", "الفرع": "فرع السليمانية", "كاش": 900, "بنك": 500, "نقاط بيع": 1300, "الإجمالي": 2700 },
];

const expenses = [
  { "التاريخ": "2026-05-16", "الفرع": "الفرع الرئيسي", "البند": "كهرباء", "المبلغ": 700, "طريقة الدفع": "تحويل" },
  { "التاريخ": "2026-05-16", "الفرع": "فرع السليمانية", "البند": "نظافة", "المبلغ": 350, "طريقة الدفع": "كاش" },
];

function exportExcel(name: string, rows: any[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name);
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export default function Page() {
  const [active, setActive] = useState("dashboard");

  const totals = useMemo(() => {
    const revenue = daily.reduce((s, r) => s + Number(r["الإجمالي"]), 0);
    const expense = expenses.reduce((s, r) => s + Number(r["المبلغ"]), 0);
    return { revenue, expense, profit: revenue - expense };
  }, []);

  const sectionTitle: any = {
    dashboard: "لوحة المدير",
    branches: "تفاصيل الفروع",
    daily: "الإيرادات اليومية",
    monthly: "الإيرادات الشهرية",
    bank: "البنك",
    pos: "نقاط البيع",
    expenses: "المصروفات",
    reports: "التقارير",
    settings: "الإعدادات",
  };

  return (
    <main className="min-h-screen md:flex">
      <Sidebar active={active} setActive={setActive} />

      <section className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{sectionTitle[active]}</h1>
            <p className="text-slate-500 mt-1">منصة تعمل على الجوال والكمبيوتر بنفس قاعدة البيانات</p>
          </div>

          <div className="flex gap-2">
            <button className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة جديد</button>
            <button onClick={() => exportExcel(sectionTitle[active], active === "expenses" ? expenses : active === "branches" ? branches : daily)} className="bg-blue-600 text-white rounded-xl px-4 py-2">
              تصدير Excel
            </button>
          </div>
        </div>

        {active === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard title="إجمالي الإيرادات" value={`${totals.revenue.toLocaleString()} ر.س`} hint="من كل الفروع" />
              <KpiCard title="إجمالي المصروفات" value={`${totals.expense.toLocaleString()} ر.س`} hint="مصروفات اليوم" />
              <KpiCard title="صافي الربح" value={`${totals.profit.toLocaleString()} ر.س`} hint="إيرادات - مصروفات" />
              <KpiCard title="عدد الفروع" value={branches.length} hint="فروع نشطة" />
            </div>
            <DataTable columns={["اسم الفرع", "المدينة", "المدير", "الحالة"]} rows={branches} />
          </div>
        )}

        {active === "branches" && <DataTable columns={["اسم الفرع", "المدينة", "المدير", "الحالة"]} rows={branches} />}
        {active === "daily" && <DataTable columns={["التاريخ", "الفرع", "كاش", "بنك", "نقاط بيع", "الإجمالي"]} rows={daily} />}
        {active === "monthly" && <DataTable columns={["التاريخ", "الفرع", "كاش", "بنك", "نقاط بيع", "الإجمالي"]} rows={daily} />}
        {active === "bank" && <DataTable columns={["التاريخ", "الفرع", "بنك", "الإجمالي"]} rows={daily} />}
        {active === "pos" && <DataTable columns={["التاريخ", "الفرع", "نقاط بيع", "الإجمالي"]} rows={daily} />}
        {active === "expenses" && <DataTable columns={["التاريخ", "الفرع", "البند", "المبلغ", "طريقة الدفع"]} rows={expenses} />}
        {active === "reports" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="تقرير الإيرادات" value={`${totals.revenue.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
            <KpiCard title="تقرير المصروفات" value={`${totals.expense.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
            <KpiCard title="تقرير صافي الربح" value={`${totals.profit.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
          </div>
        )}
        {active === "settings" && (
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <h2 className="font-bold text-xl mb-4">الصلاحيات</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {["مدير عام", "مدير فرع", "محاسب", "إدخال فقط"].map((r) => (
                <div key={r} className="border rounded-xl p-4">{r}</div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
