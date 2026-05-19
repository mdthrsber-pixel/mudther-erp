'use client';

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { exportExcel } from "@/lib/exportExcel";

const demoBranches = [
  { id: "1", name: "الفرع الرئيسي", city: "الرياض", manager_name: "مدير الفرع", status: "active" },
  { id: "2", name: "فرع السليمانية", city: "الرياض", manager_name: "مدير السليمانية", status: "active" },
];

export default function Page() {
  const [active, setActive] = useState("dashboard");
  const [login, setLogin] = useState(false);
  const [email, setEmail] = useState("mdthrsber@gmail.com");
  const [password, setPassword] = useState("");
  const [branches, setBranches] = useState<any[]>(demoBranches);
  const [daily, setDaily] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [modal, setModal] = useState("");
  const [form, setForm] = useState<any>({});

  async function loadData() {
    if (!isSupabaseReady) return;
    const b = await supabase.from("branches").select("*").order("created_at", { ascending: false });
    if (!b.error && b.data) setBranches(b.data);
    const d = await supabase.from("daily_revenues").select("*, branches(name)").order("created_at", { ascending: false });
    if (!d.error && d.data) setDaily(d.data);
    const e = await supabase.from("expenses").select("*, branches(name)").order("created_at", { ascending: false });
    if (!e.error && e.data) setExpenses(e.data);
  }

  useEffect(() => { loadData(); }, []);

  async function addBranch() {
    const row = { name: form.name, city: form.city, manager_name: form.manager_name, status: "active" };
    if (isSupabaseReady) await supabase.from("branches").insert(row);
    else setBranches([{ id: Date.now().toString(), ...row }, ...branches]);
    setModal(""); setForm({}); loadData();
  }

  async function deleteBranch(row: any) {
    if (!confirm("تأكيد حذف الفرع؟")) return;
    if (isSupabaseReady) await supabase.from("branches").delete().eq("id", row.id);
    else setBranches(branches.filter((b) => b.id !== row.id));
    loadData();
  }

  async function addDaily() {
    const row = {
      branch_id: form.branch_id,
      revenue_date: form.revenue_date,
      cash: Number(form.cash || 0),
      bank_transfer: Number(form.bank_transfer || 0),
      pos_amount: Number(form.pos_amount || 0),
      booking_amount: Number(form.booking_amount || 0),
      notes: form.notes || ""
    };
    if (isSupabaseReady) await supabase.from("daily_revenues").insert(row);
    else setDaily([{ id: Date.now().toString(), ...row }, ...daily]);
    setModal(""); setForm({}); loadData();
  }

  async function addExpense() {
    const row = {
      branch_id: form.branch_id,
      expense_date: form.expense_date,
      category: form.category,
      supplier: form.supplier,
      amount: Number(form.amount || 0),
      payment_method: form.payment_method,
      notes: form.notes || ""
    };
    if (isSupabaseReady) await supabase.from("expenses").insert(row);
    else setExpenses([{ id: Date.now().toString(), ...row }, ...expenses]);
    setModal(""); setForm({}); loadData();
  }

  const branchRows = branches.map((b) => ({ id:b.id, "اسم الفرع":b.name, "المدينة":b.city, "المدير":b.manager_name, "الحالة":b.status }));
  const dailyRows = daily.map((r) => ({
    id:r.id, "التاريخ":r.revenue_date, "الفرع":r.branches?.name || branches.find(b=>b.id===r.branch_id)?.name || "-",
    "كاش":r.cash || 0, "بنك":r.bank_transfer || 0, "نقاط بيع":r.pos_amount || 0, "بوكينج":r.booking_amount || 0,
    "الإجمالي":Number(r.cash||0)+Number(r.bank_transfer||0)+Number(r.pos_amount||0)+Number(r.booking_amount||0)
  }));
  const expenseRows = expenses.map((r) => ({
    id:r.id, "التاريخ":r.expense_date, "الفرع":r.branches?.name || branches.find(b=>b.id===r.branch_id)?.name || "-",
    "البند":r.category, "المورد":r.supplier, "المبلغ":r.amount, "طريقة الدفع":r.payment_method
  }));

  const totals = useMemo(() => {
    const revenue = dailyRows.reduce((s:any, r:any)=>s+Number(r["الإجمالي"]||0),0);
    const expense = expenseRows.reduce((s:any, r:any)=>s+Number(r["المبلغ"]||0),0);
    return { revenue, expense, profit: revenue - expense };
  }, [dailyRows.length, expenseRows.length]);

  const title:any = {dashboard:"لوحة المدير",branches:"تفاصيل الفروع",daily:"الإيرادات اليومية",expenses:"المصروفات",bank:"البنك",pos:"نقاط البيع",reports:"التقارير",users:"المستخدمين",settings:"الإعدادات"};

  if (!login) {
    return <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">نظام مدثر المحاسبي</h1>
        <p className="text-center text-slate-500 mb-6">دخول تجريبي للمنصة السحابية</p>
        <input className="border rounded-xl p-3 w-full mb-3" value={email} onChange={e=>setEmail(e.target.value)} placeholder="الإيميل" />
        <input className="border rounded-xl p-3 w-full mb-4" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" type="password" />
        <button onClick={()=>setLogin(true)} className="bg-blue-600 text-white rounded-xl p-3 w-full">دخول</button>
        <p className="text-xs text-slate-400 mt-4">ملاحظة: الدخول هنا تجريبي. بعد ربط Supabase Auth نفعل الدخول الحقيقي.</p>
      </div>
    </main>
  }

  return (
    <main className="min-h-screen md:flex">
      <Sidebar active={active} setActive={setActive} />
      <section className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title[active]}</h1>
            <p className="text-slate-500 mt-1">نسخة ويب متجاوبة للجوال والكمبيوتر</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active === "branches" && <button onClick={()=>setModal("branch")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة فرع</button>}
            {active === "daily" && <button onClick={()=>setModal("daily")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة إيراد</button>}
            {active === "expenses" && <button onClick={()=>setModal("expense")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة مصروف</button>}
            <button onClick={()=>exportExcel(title[active], active==="branches"?branchRows:active==="expenses"?expenseRows:dailyRows)} className="bg-blue-600 text-white rounded-xl px-4 py-2">تصدير Excel</button>
          </div>
        </div>

        {active === "dashboard" && <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title="إجمالي الإيرادات" value={`${totals.revenue.toLocaleString()} ر.س`} hint="كل الفروع" />
            <KpiCard title="إجمالي المصروفات" value={`${totals.expense.toLocaleString()} ر.س`} hint="كل الفروع" />
            <KpiCard title="صافي الربح" value={`${totals.profit.toLocaleString()} ر.س`} hint="إيرادات - مصروفات" />
            <KpiCard title="عدد الفروع" value={branches.length} hint="فروع نشطة" />
          </div>
          <DataTable columns={["اسم الفرع","المدينة","المدير","الحالة"]} rows={branchRows} />
        </div>}

        {active === "branches" && <DataTable columns={["اسم الفرع","المدينة","المدير","الحالة"]} rows={branchRows} onDelete={deleteBranch} />}
        {active === "daily" && <DataTable columns={["التاريخ","الفرع","كاش","بنك","نقاط بيع","بوكينج","الإجمالي"]} rows={dailyRows} />}
        {active === "expenses" && <DataTable columns={["التاريخ","الفرع","البند","المورد","المبلغ","طريقة الدفع"]} rows={expenseRows} />}
        {["bank","pos"].includes(active) && <DataTable columns={["التاريخ","الفرع","كاش","بنك","نقاط بيع","بوكينج","الإجمالي"]} rows={dailyRows} />}
        {active === "reports" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="تقرير الإيرادات" value={`${totals.revenue.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
          <KpiCard title="تقرير المصروفات" value={`${totals.expense.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
          <KpiCard title="تقرير صافي الربح" value={`${totals.profit.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
        </div>}
        {active === "users" && <DataTable columns={["الاسم","الدور","الفرع","الحالة"]} rows={[{"الاسم":"مدثر صابر","الدور":"مدير عام","الفرع":"كل الفروع","الحالة":"نشط"}]} />}
        {active === "settings" && <div className="bg-white rounded-2xl border p-5">الإعدادات والصلاحيات والنسخ الاحتياطي اليومي.</div>}
      </section>

      <Modal title="إضافة فرع" open={modal==="branch"} onClose={()=>setModal("")}>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="اسم الفرع" onChange={e=>setForm({...form,name:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="المدينة" onChange={e=>setForm({...form,city:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="اسم المدير" onChange={e=>setForm({...form,manager_name:e.target.value})}/>
        <button onClick={addBranch} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title="إضافة إيراد يومي" open={modal==="daily"} onClose={()=>setModal("")}>
        <select className="border rounded-xl p-3 w-full mb-3" onChange={e=>setForm({...form,branch_id:e.target.value})}>
          <option>اختر الفرع</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" className="border rounded-xl p-3 w-full mb-3" onChange={e=>setForm({...form,revenue_date:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="كاش" onChange={e=>setForm({...form,cash:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="بنك" onChange={e=>setForm({...form,bank_transfer:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="نقاط بيع" onChange={e=>setForm({...form,pos_amount:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="بوكينج" onChange={e=>setForm({...form,booking_amount:e.target.value})}/>
        <button onClick={addDaily} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title="إضافة مصروف" open={modal==="expense"} onClose={()=>setModal("")}>
        <select className="border rounded-xl p-3 w-full mb-3" onChange={e=>setForm({...form,branch_id:e.target.value})}>
          <option>اختر الفرع</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" className="border rounded-xl p-3 w-full mb-3" onChange={e=>setForm({...form,expense_date:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="البند" onChange={e=>setForm({...form,category:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="المورد" onChange={e=>setForm({...form,supplier:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="المبلغ" onChange={e=>setForm({...form,amount:e.target.value})}/>
        <input className="border rounded-xl p-3 w-full mb-3" placeholder="طريقة الدفع" onChange={e=>setForm({...form,payment_method:e.target.value})}/>
        <button onClick={addExpense} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>
    </main>
  );
}
