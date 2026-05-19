'use client';

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KpiCard from "@/components/KpiCard";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import { FormInput, FormSelect } from "@/components/FormInput";
import { supabase, isSupabaseReady } from "@/lib/supabase";
import { exportExcel, exportPdf } from "@/lib/export";

const demoBranches = [
  { id: "1", name: "الفرع الرئيسي", city: "الرياض", manager_name: "مدير الفرع", status: "active" },
  { id: "2", name: "فرع السليمانية", city: "الرياض", manager_name: "مدير السليمانية", status: "active" },
];

export default function Page() {
  const [logged, setLogged] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [branches, setBranches] = useState<any[]>(demoBranches);
  const [daily, setDaily] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [bank, setBank] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([
    { id: "u1", full_name: "مدثر صابر", email: "mdthrsber@gmail.com", role: "general_manager", active: true }
  ]);
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  async function loadData() {
    if (!isSupabaseReady) return;

    const b = await supabase.from("branches").select("*").order("created_at", { ascending: false });
    if (!b.error && b.data) setBranches(b.data);

    const d = await supabase.from("daily_revenues").select("*, branches(name)").order("created_at", { ascending: false });
    if (!d.error && d.data) setDaily(d.data);

    const e = await supabase.from("expenses").select("*, branches(name)").order("created_at", { ascending: false });
    if (!e.error && e.data) setExpenses(e.data);

    const ba = await supabase.from("bank_transactions").select("*, branches(name)").order("created_at", { ascending: false });
    if (!ba.error && ba.data) setBank(ba.data);

    const po = await supabase.from("pos_transactions").select("*, branches(name)").order("created_at", { ascending: false });
    if (!po.error && po.data) setPos(po.data);

    const u = await supabase.from("users_profiles").select("*, branches(name)").order("created_at", { ascending: false });
    if (!u.error && u.data) setUsers(u.data);
  }

  useEffect(() => { loadData(); }, []);

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  function branchName(id: string) {
    return branches.find((b) => b.id === id)?.name || "-";
  }

  async function saveBranch() {
    const row = { name: form.name, city: form.city, manager_name: form.manager_name, status: form.status || "active" };
    if (editing?.id) {
      if (isSupabaseReady) await supabase.from("branches").update(row).eq("id", editing.id);
      else setBranches(branches.map((b) => b.id === editing.id ? { ...b, ...row } : b));
    } else {
      if (isSupabaseReady) await supabase.from("branches").insert(row);
      else setBranches([{ id: Date.now().toString(), ...row }, ...branches]);
    }
    closeModal(); loadData();
  }

  async function deleteBranch(row: any) {
    if (!confirm("تأكيد حذف الفرع؟")) return;
    if (isSupabaseReady) await supabase.from("branches").delete().eq("id", row.id);
    else setBranches(branches.filter((b) => b.id !== row.id));
    loadData();
  }

  async function saveDaily() {
    const row = {
      branch_id: form.branch_id, revenue_date: form.revenue_date,
      cash: Number(form.cash || 0), bank_transfer: Number(form.bank_transfer || 0),
      pos_amount: Number(form.pos_amount || 0), booking_amount: Number(form.booking_amount || 0),
      notes: form.notes || ""
    };
    if (editing?.id) {
      if (isSupabaseReady) await supabase.from("daily_revenues").update(row).eq("id", editing.id);
      else setDaily(daily.map((x) => x.id === editing.id ? { ...x, ...row } : x));
    } else {
      if (isSupabaseReady) await supabase.from("daily_revenues").insert(row);
      else setDaily([{ id: Date.now().toString(), ...row }, ...daily]);
    }
    closeModal(); loadData();
  }

  async function deleteDaily(row: any) {
    if (!confirm("تأكيد حذف الإيراد؟")) return;
    if (isSupabaseReady) await supabase.from("daily_revenues").delete().eq("id", row.id);
    else setDaily(daily.filter((x) => x.id !== row.id));
    loadData();
  }

  async function saveExpense() {
    const row = {
      branch_id: form.branch_id, expense_date: form.expense_date,
      category: form.category, supplier: form.supplier, amount: Number(form.amount || 0),
      payment_method: form.payment_method, notes: form.notes || ""
    };
    if (editing?.id) {
      if (isSupabaseReady) await supabase.from("expenses").update(row).eq("id", editing.id);
      else setExpenses(expenses.map((x) => x.id === editing.id ? { ...x, ...row } : x));
    } else {
      if (isSupabaseReady) await supabase.from("expenses").insert(row);
      else setExpenses([{ id: Date.now().toString(), ...row }, ...expenses]);
    }
    closeModal(); loadData();
  }

  async function deleteExpense(row: any) {
    if (!confirm("تأكيد حذف المصروف؟")) return;
    if (isSupabaseReady) await supabase.from("expenses").delete().eq("id", row.id);
    else setExpenses(expenses.filter((x) => x.id !== row.id));
    loadData();
  }

  async function saveBank() {
    const row = {
      branch_id: form.branch_id, transaction_date: form.transaction_date, bank_name: form.bank_name,
      reference_no: form.reference_no, amount: Number(form.amount || 0), transaction_type: form.transaction_type || "deposit",
      notes: form.notes || ""
    };
    if (isSupabaseReady) await supabase.from("bank_transactions").insert(row);
    else setBank([{ id: Date.now().toString(), ...row }, ...bank]);
    closeModal(); loadData();
  }

  async function savePos() {
    const row = {
      branch_id: form.branch_id, transaction_date: form.transaction_date, device_name: form.device_name,
      reference_no: form.reference_no, amount: Number(form.amount || 0), settlement_status: form.settlement_status || "pending",
      notes: form.notes || ""
    };
    if (isSupabaseReady) await supabase.from("pos_transactions").insert(row);
    else setPos([{ id: Date.now().toString(), ...row }, ...pos]);
    closeModal(); loadData();
  }

  function openAdd(type: string) {
    setEditing(null); setForm({}); setModal(type);
  }

  function openEdit(type: string, row: any) {
    setEditing(row); setModal(type);
    if (type === "branch") setForm(branches.find((b) => b.id === row.id) || {});
    if (type === "daily") setForm(daily.find((x) => x.id === row.id) || {});
    if (type === "expense") setForm(expenses.find((x) => x.id === row.id) || {});
  }

  function closeModal() {
    setModal(""); setEditing(null); setForm({});
  }

  const branchRows = branches.map((b) => ({ id: b.id, "اسم الفرع": b.name, "المدينة": b.city, "المدير": b.manager_name, "الحالة": b.status }));
  const dailyRows = daily.map((r) => ({ id: r.id, "التاريخ": r.revenue_date, "الفرع": r.branches?.name || branchName(r.branch_id), "كاش": r.cash || 0, "بنك": r.bank_transfer || 0, "نقاط بيع": r.pos_amount || 0, "بوكينج": r.booking_amount || 0, "الإجمالي": Number(r.cash||0)+Number(r.bank_transfer||0)+Number(r.pos_amount||0)+Number(r.booking_amount||0) }));
  const expenseRows = expenses.map((r) => ({ id: r.id, "التاريخ": r.expense_date, "الفرع": r.branches?.name || branchName(r.branch_id), "البند": r.category, "المورد": r.supplier, "المبلغ": r.amount, "طريقة الدفع": r.payment_method }));
  const bankRows = bank.map((r) => ({ id: r.id, "التاريخ": r.transaction_date, "الفرع": r.branches?.name || branchName(r.branch_id), "البنك": r.bank_name, "المرجع": r.reference_no, "النوع": r.transaction_type, "المبلغ": r.amount }));
  const posRows = pos.map((r) => ({ id: r.id, "التاريخ": r.transaction_date, "الفرع": r.branches?.name || branchName(r.branch_id), "الجهاز": r.device_name, "المرجع": r.reference_no, "الحالة": r.settlement_status, "المبلغ": r.amount }));
  const userRows = users.map((u) => ({ id: u.id, "الاسم": u.full_name, "الإيميل": u.email, "الدور": u.role, "الفرع": u.branches?.name || branchName(u.branch_id), "الحالة": u.active ? "نشط" : "موقوف" }));

  const totals = useMemo(() => {
    const revenue = dailyRows.reduce((s:any, r:any) => s + Number(r["الإجمالي"] || 0), 0);
    const expense = expenseRows.reduce((s:any, r:any) => s + Number(r["المبلغ"] || 0), 0);
    return { revenue, expense, profit: revenue - expense };
  }, [dailyRows.length, expenseRows.length]);

  const title:any = {
    dashboard:"لوحة المدير", branches:"تفاصيل الفروع", daily:"الإيرادات اليومية", expenses:"المصروفات",
    bank:"البنك", pos:"نقاط البيع", reports:"التقارير", users:"المستخدمين", settings:"الإعدادات"
  };

  const activeRows:any = {
    branches: branchRows, daily: dailyRows, expenses: expenseRows, bank: bankRows, pos: posRows, users: userRows
  };

  if (!logged) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2">نظام مدثر المحاسبي</h1>
          <p className="text-center text-slate-500 mb-6">دخول تجريبي للمنصة السحابية</p>
          <input className="border rounded-xl p-3 w-full mb-3" defaultValue="mdthrsber@gmail.com" placeholder="الإيميل" />
          <input className="border rounded-xl p-3 w-full mb-4" placeholder="كلمة المرور" type="password" />
          <button onClick={() => setLogged(true)} className="bg-blue-600 text-white rounded-xl p-3 w-full">دخول</button>
          <p className="text-xs text-slate-400 mt-4">بعد ربط Supabase Auth يتم تفعيل الدخول الحقيقي.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen md:flex">
      <Sidebar active={active} setActive={setActive} />
      <section className="flex-1 p-4 md:p-8">
        <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title[active]}</h1>
            <p className="text-slate-500 mt-1">منصة سحابية متجاوبة للجوال والكمبيوتر</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active === "branches" && <button onClick={() => openAdd("branch")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة فرع</button>}
            {active === "daily" && <button onClick={() => openAdd("daily")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة إيراد</button>}
            {active === "expenses" && <button onClick={() => openAdd("expense")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة مصروف</button>}
            {active === "bank" && <button onClick={() => openAdd("bank")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة حركة بنك</button>}
            {active === "pos" && <button onClick={() => openAdd("pos")} className="bg-slate-900 text-white rounded-xl px-4 py-2">إضافة نقطة بيع</button>}
            <button onClick={() => exportExcel(title[active], activeRows[active] || dailyRows)} className="bg-blue-600 text-white rounded-xl px-4 py-2">Excel</button>
            <button onClick={() => exportPdf(title[active], activeRows[active] || dailyRows)} className="bg-green-600 text-white rounded-xl px-4 py-2">PDF</button>
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

        {active === "branches" && <DataTable columns={["اسم الفرع","المدينة","المدير","الحالة"]} rows={branchRows} onEdit={(r:any)=>openEdit("branch",r)} onDelete={deleteBranch} />}
        {active === "daily" && <DataTable columns={["التاريخ","الفرع","كاش","بنك","نقاط بيع","بوكينج","الإجمالي"]} rows={dailyRows} onEdit={(r:any)=>openEdit("daily",r)} onDelete={deleteDaily} />}
        {active === "expenses" && <DataTable columns={["التاريخ","الفرع","البند","المورد","المبلغ","طريقة الدفع"]} rows={expenseRows} onEdit={(r:any)=>openEdit("expense",r)} onDelete={deleteExpense} />}
        {active === "bank" && <DataTable columns={["التاريخ","الفرع","البنك","المرجع","النوع","المبلغ"]} rows={bankRows} />}
        {active === "pos" && <DataTable columns={["التاريخ","الفرع","الجهاز","المرجع","الحالة","المبلغ"]} rows={posRows} />}
        {active === "users" && <DataTable columns={["الاسم","الإيميل","الدور","الفرع","الحالة"]} rows={userRows} />}

        {active === "reports" && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="تقرير الإيرادات" value={`${totals.revenue.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
          <KpiCard title="تقرير المصروفات" value={`${totals.expense.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
          <KpiCard title="تقرير صافي الربح" value={`${totals.profit.toLocaleString()} ر.س`} hint="جاهز للتصدير" />
        </div>}

        {active === "settings" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-bold text-xl mb-3">الصلاحيات</h2>
            <p className="text-slate-600">مدير عام، مدير فرع، محاسب، إدخال فقط.</p>
          </div>
          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-bold text-xl mb-3">النسخ الاحتياطي</h2>
            <p className="text-slate-600">يتم ضبطه من Supabase أو VPS حسب الاستضافة.</p>
          </div>
        </div>}
      </section>

      <Modal title={editing ? "تعديل فرع" : "إضافة فرع"} open={modal==="branch"} onClose={closeModal}>
        <FormInput label="اسم الفرع" value={form.name} onChange={(v:any)=>setForm({...form,name:v})} />
        <FormInput label="المدينة" value={form.city} onChange={(v:any)=>setForm({...form,city:v})} />
        <FormInput label="اسم المدير" value={form.manager_name} onChange={(v:any)=>setForm({...form,manager_name:v})} />
        <FormSelect label="الحالة" value={form.status} onChange={(v:any)=>setForm({...form,status:v})} options={[{value:"active",label:"نشط"},{value:"inactive",label:"موقوف"}]} />
        <button onClick={saveBranch} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title={editing ? "تعديل إيراد" : "إضافة إيراد يومي"} open={modal==="daily"} onClose={closeModal}>
        <FormSelect label="الفرع" value={form.branch_id} onChange={(v:any)=>setForm({...form,branch_id:v})} options={branchOptions} />
        <FormInput label="التاريخ" type="date" value={form.revenue_date} onChange={(v:any)=>setForm({...form,revenue_date:v})} />
        <FormInput label="كاش" value={form.cash} onChange={(v:any)=>setForm({...form,cash:v})} />
        <FormInput label="بنك" value={form.bank_transfer} onChange={(v:any)=>setForm({...form,bank_transfer:v})} />
        <FormInput label="نقاط بيع" value={form.pos_amount} onChange={(v:any)=>setForm({...form,pos_amount:v})} />
        <FormInput label="بوكينج" value={form.booking_amount} onChange={(v:any)=>setForm({...form,booking_amount:v})} />
        <button onClick={saveDaily} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title={editing ? "تعديل مصروف" : "إضافة مصروف"} open={modal==="expense"} onClose={closeModal}>
        <FormSelect label="الفرع" value={form.branch_id} onChange={(v:any)=>setForm({...form,branch_id:v})} options={branchOptions} />
        <FormInput label="التاريخ" type="date" value={form.expense_date} onChange={(v:any)=>setForm({...form,expense_date:v})} />
        <FormInput label="البند" value={form.category} onChange={(v:any)=>setForm({...form,category:v})} />
        <FormInput label="المورد" value={form.supplier} onChange={(v:any)=>setForm({...form,supplier:v})} />
        <FormInput label="المبلغ" value={form.amount} onChange={(v:any)=>setForm({...form,amount:v})} />
        <FormInput label="طريقة الدفع" value={form.payment_method} onChange={(v:any)=>setForm({...form,payment_method:v})} />
        <button onClick={saveExpense} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title="إضافة حركة بنك" open={modal==="bank"} onClose={closeModal}>
        <FormSelect label="الفرع" value={form.branch_id} onChange={(v:any)=>setForm({...form,branch_id:v})} options={branchOptions} />
        <FormInput label="التاريخ" type="date" value={form.transaction_date} onChange={(v:any)=>setForm({...form,transaction_date:v})} />
        <FormInput label="اسم البنك" value={form.bank_name} onChange={(v:any)=>setForm({...form,bank_name:v})} />
        <FormInput label="رقم المرجع" value={form.reference_no} onChange={(v:any)=>setForm({...form,reference_no:v})} />
        <FormInput label="المبلغ" value={form.amount} onChange={(v:any)=>setForm({...form,amount:v})} />
        <FormSelect label="النوع" value={form.transaction_type} onChange={(v:any)=>setForm({...form,transaction_type:v})} options={[{value:"deposit",label:"إيداع"},{value:"withdrawal",label:"سحب"},{value:"transfer",label:"تحويل"},{value:"fee",label:"رسوم"}]} />
        <button onClick={saveBank} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>

      <Modal title="إضافة نقطة بيع" open={modal==="pos"} onClose={closeModal}>
        <FormSelect label="الفرع" value={form.branch_id} onChange={(v:any)=>setForm({...form,branch_id:v})} options={branchOptions} />
        <FormInput label="التاريخ" type="date" value={form.transaction_date} onChange={(v:any)=>setForm({...form,transaction_date:v})} />
        <FormInput label="اسم الجهاز" value={form.device_name} onChange={(v:any)=>setForm({...form,device_name:v})} />
        <FormInput label="رقم المرجع" value={form.reference_no} onChange={(v:any)=>setForm({...form,reference_no:v})} />
        <FormInput label="المبلغ" value={form.amount} onChange={(v:any)=>setForm({...form,amount:v})} />
        <FormSelect label="الحالة" value={form.settlement_status} onChange={(v:any)=>setForm({...form,settlement_status:v})} options={[{value:"pending",label:"معلق"},{value:"settled",label:"تم التسوية"}]} />
        <button onClick={savePos} className="bg-blue-600 text-white rounded-xl p-3 w-full">حفظ</button>
      </Modal>
    </main>
  );
}
