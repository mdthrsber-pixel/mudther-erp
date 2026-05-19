"use client";

import { useMemo, useState } from "react";
type Page =
  | "dashboard"
  | "branches"
  | "branchDetails"
  | "monthlyClose"
  | "annualBudget"
  | "approvals"
  | "auditLog"
  | "dailyOps"
  | "revenues"
  | "expenses"
  | "pos"
  | "bank"
  | "reports"
  | "settings";

type Branch = {
  id: number;
  name: string;
  rooms: number;
  occupied: number;
  emptyApartments: number;
  doubles: number;
  manager: string;
  status: "نشط" | "متوقف";
};

type ExpenseStatus = "تم التدقيق والترحيل" | "في انتظار الاعتماد" | "مرفوض";

type Expense = {
  id: number;
  date: string;
  month: string;
  branchId: number;
  category: string;
  statement: string;
  paymentMethod: string;
  amount: number;
  status: ExpenseStatus;
  notes: string;
  docNo?: string;
  attachmentName?: string;
};

type DailyRevenue = {
  id: number;
  date: string;
  month: string;
  branchId: number;
  roomRevenue: number;
  monthlyRent: number;
  otherRevenue: number;
  statement: string;
  status: "مرحل" | "معلق" | "مرفوض";
  docNo?: string;
};

type Deposit = {
  id: number;
  date: string;
  month: string;
  branchId: number;
  bankName: string;
  amount: number;
  reference: string;
  notes: string;
  docNo?: string;
};

type PosTxn = {
  id: number;
  date: string;
  month: string;
  branchId: number;
  device: string;
  amount: number;
  reference: string;
  notes: string;
  docNo?: string;
};

type JournalEntry = {
  id: number;
  date: string;
  branchId: number;
  type: "إيراد" | "مصروف" | "إيداع بنكي" | "نقاط بيع" | "تسوية";
  debit: string;
  credit: string;
  amount: number;
  statement: string;
  status: "مرحل" | "مسودة" | "مرفوض";
  docNo?: string;
};

type AuditLog = {
  id: number;
  date: string;
  time: string;
  user: string;
  role: string;
  action: string;
  target: string;
  branchId?: number;
  docNo?: string;
  amount?: number;
  notes: string;
};

type LockedPeriod = {
  id: number;
  branchId: number;
  from: string;
  to: string;
  lockedBy: string;
  lockedAt: string;
};

type UserRole = "مدير عام" | "محاسب" | "مشرف فرع" | "موظف استقبال" | "مشاهدة فقط";

type UserPermission =
  | "view"
  | "entry"
  | "edit"
  | "approve"
  | "delete"
  | "print"
  | "reports"
  | "monthlyClose"
  | "annualBudget";

type UserAccount = {
  id: number;
  name: string;
  role: UserRole;
  branchId?: number;
  phone?: string;
  username?: string;
  tempPassword?: string;
  mustChangePassword?: boolean;
  whatsappStatus?: string;
  permissions: UserPermission[];
  active: boolean;
};

const getSaudiToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const today = getSaudiToday();
const currentMonth = today.slice(0, 7);

const fmt = (n: number) => `${Number(n || 0).toLocaleString()} ريال`;
const sar = (n: number) => `SAR ${Number(n || 0).toLocaleString()}`;
const uid = () => Date.now() + Math.floor(Math.random() * 1000);
const APP_STORAGE_KEY = "mudathir_accounting_data_v1";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SNAPSHOT_ID = "main_accounting_snapshot";

export default function HomePage() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [branchTab, setBranchTab] = useState<"summary" | "daily" | "expenses" | "operations" | "pos" | "bank">("summary");
  const [monthlyCloseBranchId, setMonthlyCloseBranchId] = useState<number>(1);
  const [monthlyCloseFrom, setMonthlyCloseFrom] = useState("2026-01-01");
  const [monthlyCloseTo, setMonthlyCloseTo] = useState("2026-01-31");
  const [monthlyCloseResultBranchId, setMonthlyCloseResultBranchId] = useState<number>(1);
  const [monthlyCloseResultFrom, setMonthlyCloseResultFrom] = useState("2026-01-01");
  const [monthlyCloseResultTo, setMonthlyCloseResultTo] = useState("2026-01-31");
  const [annualBranchId, setAnnualBranchId] = useState<number>(1);
  const [annualYear, setAnnualYear] = useState("2026");
  const [annualCompareYear, setAnnualCompareYear] = useState("2025");
  const [annualResultBranchId, setAnnualResultBranchId] = useState<number>(1);
  const [annualResultYear, setAnnualResultYear] = useState("2026");
  const [annualResultCompareYear, setAnnualResultCompareYear] = useState("2025");
  const [reportTab, setReportTab] = useState<"summary" | "branches" | "close" | "expenseCategories" | "annual">("summary");
  const [currentUser, setCurrentUser] = useState("مدثر صابر");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<"مدير عام" | "محاسب" | "مشرف فرع" | "موظف استقبال" | "مشاهدة فقط">("مدير عام");
  const [lockedPeriods, setLockedPeriods] = useState<LockedPeriod[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 1, date: today, time: "09:00", user: "النظام", role: "النظام", action: "تهيئة", target: "النظام", notes: "تم تشغيل سجل التدقيق" },
  ]);
  const [systemUsers, setSystemUsers] = useState<UserAccount[]>([
    { id: 1, name: "مدثر صابر", role: "مدير عام", permissions: ["view", "entry", "edit", "approve", "delete", "print", "reports", "monthlyClose", "annualBudget"], active: true },
    { id: 2, name: "محاسب النظام", role: "محاسب", permissions: ["view", "entry", "edit", "approve", "print", "reports"], active: true },
    { id: 3, name: "مشرف فرع", role: "مشرف فرع", branchId: 1, permissions: ["view", "entry", "approve", "print"], active: true },
    { id: 4, name: "موظف استقبال", role: "موظف استقبال", branchId: 1, permissions: ["view", "entry", "approve", "print"], active: true },
  ]);
  const [newUser, setNewUser] = useState<{ name: string; phone: string; role: UserRole; branchId: number }>({ name: "", phone: "", role: "محاسب", branchId: 1 });

  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, name: "فرع السليمانية", rooms: 38, occupied: 25, emptyApartments: 38 - 25, doubles: 0, manager: "مدير الفرع", status: "نشط" },
    { id: 2, name: "فرع العليا", rooms: 24, occupied: 15, emptyApartments: 24 - 15, doubles: 0, manager: "مدير الفرع", status: "نشط" },
    { id: 3, name: "فرع المطار", rooms: 18, occupied: 8, emptyApartments: 18 - 8, doubles: 0, manager: "مدير الفرع", status: "نشط" },
    { id: 4, name: "شقق الممسي", rooms: 30, occupied: 21, emptyApartments: 30 - 21, doubles: 0, manager: "مشرف الممسي", status: "نشط" },
    { id: 5, name: "شقق بازل", rooms: 22, occupied: 16, emptyApartments: 22 - 16, doubles: 0, manager: "مشرف بازل", status: "نشط" },
    { id: 6, name: "شقق رست دي", rooms: 18, occupied: 13, emptyApartments: 18 - 13, doubles: 0, manager: "مشرف رست دي", status: "نشط" },
    { id: 7, name: "شقق طيف", rooms: 20, occupied: 14, emptyApartments: 20 - 14, doubles: 0, manager: "مشرف طيف", status: "نشط" },
    { id: 8, name: "شقق مارينا", rooms: 16, occupied: 11, emptyApartments: 16 - 11, doubles: 0, manager: "مشرف مارينا", status: "نشط" },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, date: "2026-05-17", month: "2026-05", branchId: 1, category: "صيانة وتشغيل", statement: "صيانة مكيفات وفلتر استقبال", paymentMethod: "تحويل بنكي", amount: 25000, status: "تم التدقيق والترحيل", notes: "معتمد" },
    { id: 2, date: "2026-05-17", month: "2026-05", branchId: 2, category: "فواتير وطاقة", statement: "كرت كهرباء وفواتير خدمات", paymentMethod: "نقداً", amount: 5000, status: "تم التدقيق والترحيل", notes: "" },
    { id: 3, date: "2026-05-16", month: "2026-05", branchId: 1, category: "مستلزمات ونظافة", statement: "صابون وضيافة غرف", paymentMethod: "نقاط بيع", amount: 15000, status: "في انتظار الاعتماد", notes: "بانتظار الاعتماد" },
    { id: 4, date: "2026-05-15", month: "2026-05", branchId: 3, category: "رواتب وأجور", statement: "حراسات مؤقتة", paymentMethod: "تحويل بنكي", amount: 10000, status: "تم التدقيق والترحيل", notes: "" },
    { id: 5, date: "2026-05-17", month: "2026-05", branchId: 4, category: "صيانة", statement: "صيانة نقدية", paymentMethod: "شهري", amount: 170000, status: "في انتظار الاعتماد", notes: "" },
    { id: 6, date: "2026-05-17", month: "2026-05", branchId: 5, category: "الصيانة", statement: "الفواتير الخيرة الاعتماد", paymentMethod: "شهري", amount: 80000, status: "تم التدقيق والترحيل", notes: "" },
    { id: 7, date: "2026-05-17", month: "2026-05", branchId: 7, category: "نوع المصروف", statement: "العليا", paymentMethod: "شهري", amount: 56000, status: "في انتظار الاعتماد", notes: "" },
    { id: 8, date: "2026-05-17", month: "2026-05", branchId: 8, category: "نوع المصروف", statement: "الفواتير الاعتماد", paymentMethod: "شهري", amount: 55000, status: "في انتظار الاعتماد", notes: "" },
  ]);

  const [dailyRevenues, setDailyRevenues] = useState<DailyRevenue[]>([
    { id: 1, date: "2026-05-17", month: "2026-05", branchId: 1, roomRevenue: 12000, monthlyRent: 8000, otherRevenue: 1200, statement: "إيراد يومي شقق 101", status: "مرحل" },
    { id: 2, date: "2026-05-17", month: "2026-05", branchId: 2, roomRevenue: 9000, monthlyRent: 6000, otherRevenue: 800, statement: "إيراد يومي العليا", status: "مرحل" },
    { id: 3, date: "2026-05-17", month: "2026-05", branchId: 3, roomRevenue: 4000, monthlyRent: 3500, otherRevenue: 500, statement: "إيراد يومي المطار", status: "مرحل" },
    { id: 4, date: "2026-05-17", month: "2026-05", branchId: 4, roomRevenue: 7000, monthlyRent: 4500, otherRevenue: 500, statement: "إيراد الممسي", status: "مرحل" },
    { id: 5, date: "2026-05-17", month: "2026-05", branchId: 5, roomRevenue: 6200, monthlyRent: 3800, otherRevenue: 300, statement: "إيراد بازل", status: "مرحل" },
    { id: 6, date: "2026-05-17", month: "2026-05", branchId: 6, roomRevenue: 4800, monthlyRent: 2500, otherRevenue: 250, statement: "إيراد رست دي", status: "مرحل" },
    { id: 7, date: "2026-05-17", month: "2026-05", branchId: 7, roomRevenue: 5200, monthlyRent: 3000, otherRevenue: 300, statement: "إيراد طيف", status: "مرحل" },
    { id: 8, date: "2026-05-17", month: "2026-05", branchId: 8, roomRevenue: 4300, monthlyRent: 2700, otherRevenue: 200, statement: "إيراد مارينا", status: "مرحل" },
  ]);

  const [deposits, setDeposits] = useState<Deposit[]>([
    { id: 1, date: "2026-05-17", month: "2026-05", branchId: 1, bankName: "الراجحي", amount: 12000, reference: "DEP-1001", notes: "إيداع يوم 17-05" },
    { id: 2, date: "2026-05-17", month: "2026-05", branchId: 2, bankName: "الأهلي", amount: 9000, reference: "DEP-1002", notes: "إيداع خزينة" },
    { id: 3, date: "2026-05-17", month: "2026-05", branchId: 3, bankName: "الراجحي", amount: 8000, reference: "DEP-1003", notes: "إيداع بنكي" },
    { id: 4, date: "2026-05-17", month: "2026-05", branchId: 4, bankName: "الراجحي", amount: 11000, reference: "DEP-1004", notes: "إيداع الممسي" },
  ]);

  const [posTxns, setPosTxns] = useState<PosTxn[]>([
    { id: 1, date: "2026-05-17", month: "2026-05", branchId: 1, device: "مدى 1", amount: 5000, reference: "POS-101", notes: "تحصيل نقاط بيع" },
    { id: 2, date: "2026-05-17", month: "2026-05", branchId: 2, device: "مدى 2", amount: 2500, reference: "POS-102", notes: "شبكة الفرع" },
    { id: 3, date: "2026-05-17", month: "2026-05", branchId: 3, device: "مدى 3", amount: 3200, reference: "POS-103", notes: "تحصيل شبكة" },
    { id: 4, date: "2026-05-17", month: "2026-05", branchId: 4, device: "مدى 1", amount: 4200, reference: "POS-104", notes: "شبكة الممسي" },
  ]);

  const [journal, setJournal] = useState<JournalEntry[]>([
    { id: 1, date: "2026-05-17", branchId: 1, type: "إيراد", debit: "الصندوق", credit: "إيرادات الغرف", amount: 5000, statement: "قيد إيراد يومي", status: "مرحل" },
    { id: 2, date: "2026-05-17", branchId: 2, type: "مصروف", debit: "مصروفات تشغيلية", credit: "الصندوق", amount: 2500, statement: "قيد مصروف كهرباء", status: "مرحل" },
    { id: 3, date: "2026-05-17", branchId: 3, type: "إيداع بنكي", debit: "البنك", credit: "الصندوق", amount: 8000, statement: "إيداع بنكي", status: "مرحل" },
  ]);

  const [newExpense, setNewExpense] = useState({ branchId: 1, category: "صيانة وتشغيل", statement: "", paymentMethod: "تحويل بنكي", amount: "" });
  const [newRevenue, setNewRevenue] = useState({ branchId: 1, roomRevenue: "", monthlyRent: "", otherRevenue: "", statement: "" });
  const [newDeposit, setNewDeposit] = useState({ branchId: 1, bankName: "الراجحي", amount: "", reference: "", notes: "" });
  const [newPos, setNewPos] = useState({ branchId: 1, device: "مدى 1", amount: "", reference: "", notes: "" });
  const [newJournal, setNewJournal] = useState({ branchId: 1, type: "إيراد" as JournalEntry["type"], debit: "الصندوق", credit: "إيرادات الغرف", amount: "", statement: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [storageStatus, setStorageStatus] = useState("جاري تجهيز الحفظ...");
  const [cloudStatus, setCloudStatus] = useState(SUPABASE_URL && SUPABASE_ANON_KEY ? "السحابة جاهزة" : "حفظ محلي");
  const dataHydrated = useRef(false);


  const branchName = (id: number) => branches.find((b) => b.id === id)?.name || "غير محدد";
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3500);
  };

  const requireFields = (fields: Record<string, any>) => {
    const nextErrors: Record<string, string> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value).trim() === "" || Number(value) === 0 && key.includes("amount")) {
        nextErrors[key] = "هذا الحقل مطلوب";
      }
    });
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast("أكمل الحقول المطلوبة قبل الحفظ");
      return false;
    }
    return true;
  };

  const clearFormError = (key: string) => setFormErrors((prev) => {
    const copy = { ...prev };
    delete copy[key];
    return copy;
  });

  const canUse = (permission: UserPermission) => currentRole === "مدير عام" || systemUsers.find((u) => u.name === currentUser)?.permissions.includes(permission);

  const buildSnapshot = () => ({
    branches,
    expenses,
    dailyRevenues,
    deposits,
    posTxns,
    journal,
    lockedPeriods,
    auditLogs,
    systemUsers,
    currentUser,
    currentRole,
    backupAt: new Date().toISOString(),
  });

  const applySnapshot = (snapshot: any) => {
    if (!snapshot || typeof snapshot !== "object") return;

    const mergeById = <T extends { id: number }>(current: T[], incoming: any): T[] => {
      if (!Array.isArray(incoming) || incoming.length === 0) return current;
      const merged = new Map<number, T>();
      current.forEach((item) => merged.set(item.id, item));
      incoming.forEach((item: T) => {
        if (!item || typeof item !== "object" || item.id === undefined) return;
        const oldItem = merged.get(item.id) || ({} as T);
        merged.set(item.id, { ...oldItem, ...item });
      });
      return Array.from(merged.values());
    };

    setBranches((prev) => mergeById(prev, snapshot.branches));
    setExpenses((prev) => mergeById(prev, snapshot.expenses));
    setDailyRevenues((prev) => mergeById(prev, snapshot.dailyRevenues));
    setDeposits((prev) => mergeById(prev, snapshot.deposits));
    setPosTxns((prev) => mergeById(prev, snapshot.posTxns));
    setJournal((prev) => mergeById(prev, snapshot.journal));
    setLockedPeriods((prev) => mergeById(prev, snapshot.lockedPeriods));
    setAuditLogs((prev) => mergeById(prev, snapshot.auditLogs));
    setSystemUsers((prev) => mergeById(prev, snapshot.systemUsers));

    if (snapshot.currentUser) setCurrentUser(snapshot.currentUser);
    if (snapshot.currentRole) setCurrentRole(snapshot.currentRole);
  };

  const saveCloudSnapshot = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      showToast("أضف مفاتيح Supabase أولاً لتفعيل الحفظ السحابي");
      return;
    }
    setCloudStatus("جاري الحفظ السحابي...");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_snapshots`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ id: SUPABASE_SNAPSHOT_ID, data: buildSnapshot(), updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCloudStatus("تم الحفظ السحابي");
      showToast("تم حفظ نسخة سحابية من البيانات");
    } catch (error) {
      console.error(error);
      setCloudStatus("تعذر الحفظ السحابي");
      showToast("تعذر الحفظ السحابي: تأكد من جدول Supabase");
    }
  };

  const loadCloudSnapshot = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      showToast("أضف مفاتيح Supabase أولاً لتفعيل الاستعادة السحابية");
      return;
    }
    setCloudStatus("جاري الاستعادة...");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_snapshots?id=eq.${SUPABASE_SNAPSHOT_ID}&select=data`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      if (!rows?.[0]?.data) {
        showToast("لا توجد نسخة سحابية محفوظة حتى الآن");
        setCloudStatus("لا توجد نسخة سحابية");
        return;
      }
      applySnapshot(rows[0].data);
      setCloudStatus("تمت الاستعادة السحابية");
      showToast("تم استرجاع البيانات من Supabase");
    } catch (error) {
      console.error(error);
      setCloudStatus("تعذر الاستعادة");
      showToast("تعذر الاستعادة من Supabase");
    }
  };

  const handleLogout = () => {
    setCurrentUser("مشاهدة فقط");
    setCurrentRole("مشاهدة فقط");
    setPage("dashboard");
    showToast("تم تسجيل الخروج من الجلسة الحالية");
  };

  const requireDeleteReason = (target: string) => {
    if (!canDelete) {
      alert("الحذف متاح للمدير العام فقط");
      return "";
    }
    const reason = prompt(`اكتب سبب حذف ${target}`);
    if (!reason?.trim()) {
      showToast("لا يمكن الحذف بدون كتابة سبب واضح");
      return "";
    }
    if (!confirm(`تأكيد حذف ${target}؟
السبب: ${reason}`)) return "";
    return reason.trim();
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(APP_STORAGE_KEY) || localStorage.getItem("mudathir_accounting_backup_latest");
      if (saved) {
        applySnapshot(JSON.parse(saved));
        setStorageStatus("تم استرجاع آخر بيانات محفوظة");
      } else {
        setStorageStatus("حفظ محلي تلقائي مفعل");
      }
    } catch (error) {
      console.error(error);
      setStorageStatus("تعذر استرجاع البيانات المحلية");
    } finally {
      dataHydrated.current = true;
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        window.setTimeout(() => {
          loadCloudSnapshot().catch((error) => console.error(error));
        }, 600);
      }
    }
  }, []);

  useEffect(() => {
    if (!dataHydrated.current) return;
    const snapshot = buildSnapshot();
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem("mudathir_accounting_backup_latest", JSON.stringify(snapshot));
      setStorageStatus("تم الحفظ تلقائياً على هذا الجهاز");
    } catch {
      setStorageStatus("تعذر الحفظ المحلي");
    }
  }, [branches, expenses, dailyRevenues, deposits, posTxns, journal, lockedPeriods, auditLogs, systemUsers, currentUser, currentRole]);

  useEffect(() => {
    if (!dataHydrated.current || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/app_snapshots`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({ id: SUPABASE_SNAPSHOT_ID, data: buildSnapshot(), updated_at: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(await res.text());
        setCloudStatus("تم الحفظ السحابي تلقائياً");
      } catch (error) {
        console.error(error);
        setCloudStatus("تعذر الحفظ السحابي");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [branches, expenses, dailyRevenues, deposits, posTxns, journal, lockedPeriods, auditLogs, systemUsers, currentUser, currentRole]);

  const canApprove = currentRole === "مدير عام";
  const canDelete = currentRole === "مدير عام";
  const canEditLocked = currentRole === "مدير عام";

  const makeDocNo = (prefix: string, id = uid()) => `${prefix}-${String(id).slice(-6)}`;

  const logAction = (action: string, target: string, details?: { branchId?: number; docNo?: string; amount?: number; notes?: string }) => {
    setAuditLogs((prev) => [
      {
        id: uid(),
        date: today,
        time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        user: currentUser,
        role: currentRole,
        action,
        target,
        branchId: details?.branchId,
        docNo: details?.docNo,
        amount: details?.amount,
        notes: details?.notes || "",
      },
      ...prev,
    ]);
  };

  const isDateLocked = (branchId: number, date: string) =>
    lockedPeriods.some((p) => p.branchId === branchId && date >= p.from && date <= p.to);

  const blockIfLocked = (branchId: number, date: string) => {
    if (!isDateLocked(branchId, date) || canEditLocked) return false;
    alert("هذه الفترة مقفلة مالياً ولا يمكن التعديل إلا بواسطة المدير العام");
    return true;
  };

  const lockMonthlyPeriod = () => {
    if (currentRole !== "مدير عام") return alert("قفل الفترة المالية متاح للمدير العام فقط");
    const exists = lockedPeriods.some((p) => p.branchId === monthlyCloseResultBranchId && p.from === monthlyCloseResultFrom && p.to === monthlyCloseResultTo);
    if (exists) return alert("هذه الفترة مقفلة مسبقاً");
    const lock = { id: uid(), branchId: monthlyCloseResultBranchId, from: monthlyCloseResultFrom, to: monthlyCloseResultTo, lockedBy: currentUser, lockedAt: today };
    setLockedPeriods((prev) => [lock, ...prev]);
    logAction("قفل فترة مالية", "الإقفال الشهري", { branchId: monthlyCloseResultBranchId, notes: `من ${monthlyCloseResultFrom} إلى ${monthlyCloseResultTo}` });
  };

  const attachExpenseFile = (id: number, file?: File | null) => {
    if (!file) return;
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, attachmentName: file.name } : e));
    const exp = expenses.find((e) => e.id === id);
    logAction("إرفاق فاتورة", "مصروف", { branchId: exp?.branchId, docNo: exp?.docNo, amount: exp?.amount, notes: file.name });
  };

  const selectUserContext = (userId: number) => {
    const user = systemUsers.find((u) => u.id === userId);
    if (!user) return;
    setCurrentUser(user.name);
    setCurrentRole(user.role);
  };

  const permissionLabel = (permission: UserPermission) => ({
    view: "مشاهدة",
    entry: "إدخال",
    edit: "تعديل",
    approve: "اعتماد",
    delete: "حذف",
    print: "طباعة",
    reports: "تقارير",
    monthlyClose: "إقفال شهري",
    annualBudget: "ميزانية سنوية",
  }[permission]);

  const allPermissions: UserPermission[] = ["view", "entry", "edit", "approve", "delete", "print", "reports", "monthlyClose", "annualBudget"];

  const normalizePhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("966")) return digits;
    if (digits.startsWith("0")) return `966${digits.slice(1)}`;
    if (digits.length === 9) return `966${digits}`;
    return digits;
  };

  const generateUsername = (name: string) => {
    const clean = name.trim().replace(/\s+/g, "_").replace(/[^؀-ۿa-zA-Z0-9_]/g, "");
    return `${clean || "user"}_${String(uid()).slice(-4)}`;
  };

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let pass = "Mdr@";
    for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  };

  const buildUserWelcomeMessage = (user: UserAccount, password: string) => `مرحباً ${user.name} 👋

تم إنشاء حسابك في نظام مدثر للمحاسبة.

اسم المستخدم:
${user.username}

كلمة المرور المؤقتة:
${password}

الدور:
${user.role}

الفرع:
${user.branchId ? branchName(user.branchId) : "كل الفروع"}

رابط الدخول:
${typeof window !== "undefined" ? window.location.origin : ""}

يرجى تغيير كلمة المرور بعد أول تسجيل دخول.`;

  const sendWhatsAppCredentials = async (user: UserAccount, password: string) => {
    if (!user.phone) return { ok: false, message: "رقم الجوال غير موجود" };
    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: normalizePhoneForWhatsApp(user.phone),
          body: buildUserWelcomeMessage(user, password),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "تعذر إرسال واتساب");
      return { ok: true, message: "تم إرسال بيانات الدخول واتساب" };
    } catch (error: any) {
      console.error(error);
      return { ok: false, message: error?.message || "فشل إرسال واتساب" };
    }
  };

  const addSystemUser = async () => {
    if (!newUser.name.trim()) return alert("اكتب اسم المستخدم");
    if (!newUser.phone.trim()) return alert("اكتب رقم الجوال لإرسال بيانات الدخول عبر الواتساب");

    const permissionsByRole: Record<UserRole, UserPermission[]> = {
      "مدير عام": ["view", "entry", "edit", "approve", "delete", "print", "reports", "monthlyClose", "annualBudget"],
      "محاسب": ["view", "entry", "edit", "approve", "print", "reports"],
      "مشرف فرع": ["view", "entry", "approve", "print"],
      "موظف استقبال": ["view", "entry", "approve", "print"],
      "مشاهدة فقط": ["view"],
    };

    const id = uid();
    const username = generateUsername(newUser.name);
    const tempPassword = generateTempPassword();

    const user: UserAccount = {
      id,
      name: newUser.name.trim(),
      phone: newUser.phone.trim(),
      username,
      tempPassword,
      mustChangePassword: true,
      role: newUser.role,
      branchId: newUser.role === "مشرف فرع" || newUser.role === "موظف استقبال" ? Number(newUser.branchId) : undefined,
      permissions: permissionsByRole[newUser.role],
      active: true,
      whatsappStatus: "جاري الإرسال...",
    };

    setSystemUsers((prev) => [user, ...prev]);
    setNewUser({ name: "", phone: "", role: "محاسب", branchId: 1 });
    logAction("إضافة مستخدم", "المستخدمين والصلاحيات", { branchId: user.branchId, notes: `${user.name} - ${user.role} - ${user.username}` });

    const result = await sendWhatsAppCredentials(user, tempPassword);
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, whatsappStatus: result.ok ? "تم إرسال بيانات الدخول واتساب" : `فشل الإرسال: ${result.message}` }
          : u
      )
    );

    if (result.ok) showToast("تم إضافة المستخدم وإرسال بيانات الدخول عبر واتساب");
    else showToast(`تم إضافة المستخدم لكن فشل إرسال واتساب: ${result.message}`);
  };

  const toggleUserPermission = (userId: number, permission: UserPermission) => {
    setSystemUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      const permissions = u.permissions.includes(permission)
        ? u.permissions.filter((p) => p !== permission)
        : [...u.permissions, permission];
      return { ...u, permissions };
    }));
    logAction("تعديل صلاحية", "المستخدمين والصلاحيات", { notes: permissionLabel(permission) });
  };

  const updateSystemUser = (userId: number, key: keyof UserAccount, value: any) => {
    setSystemUsers((prev) => prev.map((u) => u.id === userId ? { ...u, [key]: key === "branchId" ? Number(value) : value } : u));
    logAction("تعديل مستخدم", "المستخدمين والصلاحيات", { notes: String(value) });
  };

  const deleteSystemUser = (userId: number) => {
    if (userId === 1) return alert("لا يمكن حذف المدير الأساسي");
    const user = systemUsers.find((u) => u.id === userId);
    if (!confirm("هل تريد حذف هذا المستخدم؟")) return;
    setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
    logAction("حذف مستخدم", "المستخدمين والصلاحيات", { notes: user?.name || "" });
  };

  const editExpenseFromApproval = (id: number) => {
    const item = expenses.find((e) => e.id === id);
    if (!item) return;
    const statement = prompt("تعديل البيان", item.statement) ?? item.statement;
    const category = prompt("تعديل بند المصروف", item.category) ?? item.category;
    const amountText = prompt("تعديل المبلغ", String(item.amount));
    const amount = amountText === null ? item.amount : Number(amountText || item.amount);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, statement, category, amount } : e));
    logAction("تعديل مصروف قبل الاعتماد", "اعتماد العمليات", { branchId: item.branchId, docNo: item.docNo, amount, notes: statement });
  };

  const editRevenueFromApproval = (id: number) => {
    const item = dailyRevenues.find((r) => r.id === id);
    if (!item) return;
    const statement = prompt("تعديل البيان", item.statement) ?? item.statement;
    const roomRevenue = Number(prompt("تعديل الإيراد اليومي", String(item.roomRevenue)) ?? item.roomRevenue);
    const monthlyRent = Number(prompt("تعديل الإيجار الشهري", String(item.monthlyRent)) ?? item.monthlyRent);
    const otherRevenue = Number(prompt("تعديل الإيرادات الأخرى", String(item.otherRevenue)) ?? item.otherRevenue);
    setDailyRevenues((prev) => prev.map((r) => r.id === id ? { ...r, statement, roomRevenue, monthlyRent, otherRevenue } : r));
    logAction("تعديل إيراد قبل الاعتماد", "اعتماد العمليات", { branchId: item.branchId, docNo: item.docNo, amount: roomRevenue + monthlyRent + otherRevenue, notes: statement });
  };

  const editJournalFromApproval = (id: number) => {
    const item = journal.find((j) => j.id === id);
    if (!item) return;
    const statement = prompt("تعديل البيان", item.statement) ?? item.statement;
    const amount = Number(prompt("تعديل المبلغ", String(item.amount)) ?? item.amount);
    setJournal((prev) => prev.map((j) => j.id === id ? { ...j, statement, amount } : j));
    logAction("تعديل قيد قبل الترحيل", "اعتماد العمليات", { branchId: item.branchId, docNo: item.docNo, amount, notes: statement });
  };

  const branchStats = (id: number) => {
    const revenues = dailyRevenues.filter((r) => r.branchId === id).reduce((s, r) => s + r.roomRevenue + r.monthlyRent + r.otherRevenue, 0);
    const exps = expenses.filter((e) => e.branchId === id).reduce((s, e) => s + e.amount, 0);
    const bank = deposits.filter((d) => d.branchId === id).reduce((s, d) => s + d.amount, 0);
    const pos = posTxns.filter((p) => p.branchId === id).reduce((s, p) => s + p.amount, 0);
    const cashClose = revenues - exps - bank - pos;
    return { revenues, expenses: exps, bank, pos, cashClose, profit: revenues - exps };
  };

  const totals = useMemo(() => {
    const revenue = dailyRevenues.reduce((s, r) => s + r.roomRevenue + r.monthlyRent + r.otherRevenue, 0);
    const expense = expenses.reduce((s, e) => s + e.amount, 0);
    const bank = deposits.reduce((s, d) => s + d.amount, 0);
    const pos = posTxns.reduce((s, p) => s + p.amount, 0);
    const pending = expenses.filter((e) => e.status === "في انتظار الاعتماد").reduce((s, e) => s + e.amount, 0);
    return { revenue, expense, bank, pos, pending, net: revenue - expense, cashClose: revenue - expense - bank - pos };
  }, [dailyRevenues, expenses, deposits, posTxns]);

  function addBranch() {
    const name = prompt("اكتب اسم الفرع الجديد");
    if (!name?.trim()) return;
    setBranches((prev) => [
      ...prev,
      { id: uid(), name: name.trim(), rooms: 0, occupied: 0, emptyApartments: 0, doubles: 0, manager: "مدير الفرع", status: "نشط" },
    ]);
  }

  function deleteBranch(id: number) {
    if (branches.length <= 1) return alert("لا يمكن حذف كل الفروع");
    const branch = branches.find((b) => b.id === id);
    const reason = requireDeleteReason(branch?.name || "الفرع");
    if (!reason) return;
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setExpenses((prev) => prev.filter((x) => x.branchId !== id));
    setDailyRevenues((prev) => prev.filter((x) => x.branchId !== id));
    setDeposits((prev) => prev.filter((x) => x.branchId !== id));
    setPosTxns((prev) => prev.filter((x) => x.branchId !== id));
    setJournal((prev) => prev.filter((x) => x.branchId !== id));
    logAction("حذف فرع", "الفروع", { branchId: id, notes: reason });
    setPage("branches");
  }

  function openBranch(id: number) {
    setSelectedBranchId(id);
    setBranchTab("summary");
    setPage("branchDetails");
  }

  function addExpense() {
    const amount = Number(newExpense.amount);
    const id = uid();
    const branchId = Number(newExpense.branchId);
    const docNo = makeDocNo("EXP", id);
    if (!requireFields({ expense_branchId: branchId, expense_category: newExpense.category, expense_statement: newExpense.statement, expense_paymentMethod: newExpense.paymentMethod, expense_amount: newExpense.amount })) return;
    if (!amount || amount <= 0) { setFormErrors({ expense_amount: "أدخل مبلغ أكبر من صفر" }); return showToast("مبلغ المصروف يجب أن يكون أكبر من صفر"); }
    if (blockIfLocked(branchId, today)) return;
    setExpenses((prev) => [
      { id, docNo, date: today, month: currentMonth, branchId, category: newExpense.category, statement: newExpense.statement || "مصروف جديد", paymentMethod: newExpense.paymentMethod, amount, status: amount >= highExpenseLimit ? "في انتظار الاعتماد" : "في انتظار الاعتماد", notes: amount >= highExpenseLimit ? "تنبيه: مصروف عالي يحتاج اعتماد" : "" },
      ...prev,
    ]);
    logAction("إضافة مصروف", "المصروفات", { branchId, docNo, amount, notes: newExpense.statement || "مصروف جديد" });
    setJournal((prev) => [
      { id: uid(), date: today, branchId, type: "مصروف", debit: "مصروفات تشغيلية", credit: newExpense.paymentMethod, amount, statement: newExpense.statement || "قيد مصروف", status: "مسودة" },
      ...prev,
    ]);
    setNewExpense({ branchId: Number(newExpense.branchId), category: "صيانة وتشغيل", statement: "", paymentMethod: "تحويل بنكي", amount: "" });
  }

  function addRevenue() {
    const roomRevenue = Number(newRevenue.roomRevenue || 0);
    const monthlyRent = Number(newRevenue.monthlyRent || 0);
    const otherRevenue = Number(newRevenue.otherRevenue || 0);
    const id = uid();
    const branchId = Number(newRevenue.branchId);
    const docNo = makeDocNo("REV", id);
    if (!requireFields({ revenue_branchId: branchId, revenue_statement: newRevenue.statement })) return;
    if (roomRevenue + monthlyRent + otherRevenue <= 0) { setFormErrors({ revenue_roomRevenue: "أدخل قيمة في أحد حقول الإيراد" }); return showToast("أدخل قيمة إيراد أكبر من صفر"); }
    if (blockIfLocked(branchId, today)) return;
    setDailyRevenues((prev) => [
      { id, docNo, date: today, month: currentMonth, branchId, roomRevenue, monthlyRent, otherRevenue, statement: newRevenue.statement || "إيراد يومي", status: "مرحل" },
      ...prev,
    ]);
    logAction("إضافة إيراد", "الإيرادات", { branchId, docNo, amount: roomRevenue + monthlyRent + otherRevenue, notes: newRevenue.statement || "إيراد يومي" });
    setJournal((prev) => [
      { id: uid(), date: today, branchId, type: "إيراد", debit: "الصندوق", credit: "إيرادات", amount: roomRevenue + monthlyRent + otherRevenue, statement: newRevenue.statement || "قيد إيراد يومي", status: "مرحل" },
      ...prev,
    ]);
    setNewRevenue({ branchId: Number(newRevenue.branchId), roomRevenue: "", monthlyRent: "", otherRevenue: "", statement: "" });
  }

  function addDeposit() {
    const amount = Number(newDeposit.amount);
    const id = uid();
    const branchId = Number(newDeposit.branchId);
    const docNo = makeDocNo("DEP", id);
    if (!requireFields({ deposit_branchId: branchId, deposit_bankName: newDeposit.bankName, deposit_amount: newDeposit.amount, deposit_reference: newDeposit.reference, deposit_notes: newDeposit.notes })) return;
    if (!amount || amount <= 0) { setFormErrors({ deposit_amount: "أدخل مبلغ أكبر من صفر" }); return showToast("قيمة الإيداع يجب أن تكون أكبر من صفر"); }
    if (blockIfLocked(branchId, today)) return;
    setDeposits((prev) => [
      { id, docNo, date: today, month: currentMonth, branchId, bankName: newDeposit.bankName, amount, reference: newDeposit.reference || docNo, notes: newDeposit.notes },
      ...prev,
    ]);
    logAction("إضافة إيداع", "البنك والإيداعات", { branchId, docNo, amount, notes: newDeposit.notes || "إيداع بنكي" });
    setJournal((prev) => [
      { id: uid(), date: today, branchId, type: "إيداع بنكي", debit: "البنك", credit: "الصندوق", amount, statement: newDeposit.notes || "إيداع بنكي", status: "مرحل" },
      ...prev,
    ]);
    setNewDeposit({ branchId: Number(newDeposit.branchId), bankName: "الراجحي", amount: "", reference: "", notes: "" });
  }

  function addPos() {
    const amount = Number(newPos.amount);
    const id = uid();
    const branchId = Number(newPos.branchId);
    const docNo = makeDocNo("POS", id);
    if (!requireFields({ pos_branchId: branchId, pos_device: newPos.device, pos_amount: newPos.amount, pos_reference: newPos.reference, pos_notes: newPos.notes })) return;
    if (!amount || amount <= 0) { setFormErrors({ pos_amount: "أدخل مبلغ أكبر من صفر" }); return showToast("قيمة نقاط البيع يجب أن تكون أكبر من صفر"); }
    if (blockIfLocked(branchId, today)) return;
    setPosTxns((prev) => [
      { id, docNo, date: today, month: currentMonth, branchId, device: newPos.device, amount, reference: newPos.reference || docNo, notes: newPos.notes },
      ...prev,
    ]);
    logAction("إضافة نقاط بيع", "نقاط البيع", { branchId, docNo, amount, notes: newPos.notes || "تحصيل نقاط بيع" });
    setJournal((prev) => [
      { id: uid(), date: today, branchId, type: "نقاط بيع", debit: "ذمم نقاط البيع", credit: "الصندوق", amount, statement: newPos.notes || "تحصيل نقاط بيع", status: "مرحل" },
      ...prev,
    ]);
    setNewPos({ branchId: Number(newPos.branchId), device: "مدى 1", amount: "", reference: "", notes: "" });
  }

  function addJournal() {
    const amount = Number(newJournal.amount);
    const id = uid();
    const branchId = Number(newJournal.branchId);
    const docNo = makeDocNo("JRN", id);
    if (!requireFields({ journal_branchId: branchId, journal_debit: newJournal.debit, journal_credit: newJournal.credit, journal_amount: newJournal.amount, journal_statement: newJournal.statement })) return;
    if (!amount || amount <= 0) { setFormErrors({ journal_amount: "أدخل مبلغ أكبر من صفر" }); return showToast("مبلغ القيد يجب أن يكون أكبر من صفر"); }
    if (blockIfLocked(branchId, today)) return;
    setJournal((prev) => [
      { id, docNo, date: today, branchId, type: newJournal.type, debit: newJournal.debit, credit: newJournal.credit, amount, statement: newJournal.statement || "قيد يومية", status: "مسودة" },
      ...prev,
    ]);
    logAction("إضافة قيد", "العمليات اليومية", { branchId, docNo, amount, notes: newJournal.statement || "قيد يومية" });
    setNewJournal({ branchId: Number(newJournal.branchId), type: "إيراد", debit: "الصندوق", credit: "إيرادات الغرف", amount: "", statement: "" });
  }

  function searchMonthlyClose() {
    setMonthlyCloseResultBranchId(Number(monthlyCloseBranchId));
    setMonthlyCloseResultFrom(monthlyCloseFrom);
    setMonthlyCloseResultTo(monthlyCloseTo);
    setPage("monthlyClose");
  }

  function searchAnnualBudget() {
    setAnnualResultBranchId(Number(annualBranchId));
    setAnnualResultYear(annualYear);
    setAnnualResultCompareYear(annualCompareYear);
    setPage("annualBudget");
  }

  const yearlyStats = (branchId: number, year: string) => {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const inYear = (date: string) => date >= from && date <= to;
    const revenues = dailyRevenues
      .filter((r) => r.branchId === branchId && inYear(r.date))
      .reduce((sum, r) => sum + r.roomRevenue + r.monthlyRent + r.otherRevenue, 0);
    const exps = expenses
      .filter((e) => e.branchId === branchId && inYear(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
    const bank = deposits
      .filter((d) => d.branchId === branchId && inYear(d.date))
      .reduce((sum, d) => sum + d.amount, 0);
    const pos = posTxns
      .filter((p) => p.branchId === branchId && inYear(p.date))
      .reduce((sum, p) => sum + p.amount, 0);
    const cashClose = revenues - exps - bank - pos;
    const profit = revenues - exps;
    const assets = cashClose + bank + pos;
    const liabilities = exps > revenues ? Math.abs(profit) : 0;
    const equity = assets - liabilities;
    return { from, to, revenues, expenses: exps, bank, pos, cashClose, profit, assets, liabilities, equity };
  };

  const annualBudgetStats = useMemo(() => {
    const current = yearlyStats(Number(annualResultBranchId), annualResultYear);
    const previous = yearlyStats(Number(annualResultBranchId), annualResultCompareYear);
    const diff = {
      revenues: current.revenues - previous.revenues,
      expenses: current.expenses - previous.expenses,
      bank: current.bank - previous.bank,
      pos: current.pos - previous.pos,
      cashClose: current.cashClose - previous.cashClose,
      profit: current.profit - previous.profit,
      assets: current.assets - previous.assets,
      liabilities: current.liabilities - previous.liabilities,
      equity: current.equity - previous.equity,
    };
    return { current, previous, diff };
  }, [annualResultBranchId, annualResultYear, annualResultCompareYear, dailyRevenues, expenses, deposits, posTxns]);

  const annualBudgetRows = () => [
    ["الفرع", "السنة", "من تاريخ", "إلى تاريخ", "الإيرادات", "المصروفات", "نقاط البيع", "الإيداعات البنكية", "إقفال الصندوق", "صافي الربح", "الأصول", "الالتزامات", "حقوق الملكية"],
    [branchName(annualResultBranchId), annualResultYear, annualBudgetStats.current.from, annualBudgetStats.current.to, annualBudgetStats.current.revenues, annualBudgetStats.current.expenses, annualBudgetStats.current.pos, annualBudgetStats.current.bank, annualBudgetStats.current.cashClose, annualBudgetStats.current.profit, annualBudgetStats.current.assets, annualBudgetStats.current.liabilities, annualBudgetStats.current.equity],
    [branchName(annualResultBranchId), annualResultCompareYear, annualBudgetStats.previous.from, annualBudgetStats.previous.to, annualBudgetStats.previous.revenues, annualBudgetStats.previous.expenses, annualBudgetStats.previous.pos, annualBudgetStats.previous.bank, annualBudgetStats.previous.cashClose, annualBudgetStats.previous.profit, annualBudgetStats.previous.assets, annualBudgetStats.previous.liabilities, annualBudgetStats.previous.equity],
    ["فرق المقارنة", `${annualResultYear} مقابل ${annualResultCompareYear}`, "", "", annualBudgetStats.diff.revenues, annualBudgetStats.diff.expenses, annualBudgetStats.diff.pos, annualBudgetStats.diff.bank, annualBudgetStats.diff.cashClose, annualBudgetStats.diff.profit, annualBudgetStats.diff.assets, annualBudgetStats.diff.liabilities, annualBudgetStats.diff.equity],
  ];

  const printAnnualBudget = () => {
    const rows = annualBudgetRows();
    const htmlRows = rows.map((row, i) => `<tr>${row.map((cell) => `<${i === 0 ? "th" : "td"}>${cell}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) return;
    win.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>الميزانية السنوية - ${branchName(annualResultBranchId)}</title>
          <style>
            body{font-family:Tahoma,Arial,sans-serif;padding:28px;color:#0f172a}
            h1{text-align:center;margin:0 0 8px}
            p{text-align:center;margin:0 0 24px;font-weight:700;color:#334155}
            table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
            th,td{border:1px solid #cbd5e1;padding:10px;text-align:center;font-weight:700}
            th{background:#08223d;color:#fff}
            .sign{display:flex;justify-content:space-between;margin-top:60px;font-weight:800}
          </style>
        </head>
        <body>
          <h1>تقرير الميزانية السنوية والمقارنة</h1>
          <p>${branchName(annualResultBranchId)} | السنة الحالية ${annualResultYear} حتى 31/12/${annualResultYear} | مقارنة مع ${annualResultCompareYear}</p>
          <table>${htmlRows}</table>
          <div class="sign"><span>إعداد المحاسب: ____________</span><span>اعتماد المدير: ____________</span></div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };


  const expenseCategorySummary = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const key = e.category || "أخرى";
      map.set(key, (map.get(key) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totals.expense ? (amount / totals.expense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, totals.expense]);

  const reportExportRows = () => {
    if (reportTab === "summary") {
      return [
        ["البند", "القيمة"],
        ["إجمالي الإيرادات", totals.revenue],
        ["إجمالي المصروفات", totals.expense],
        ["صافي الربح", totals.net],
        ["نقاط البيع", totals.pos],
        ["الإيداعات البنكية", totals.bank],
        ["إقفال الخزينة", totals.cashClose],
      ];
    }

    if (reportTab === "branches") {
      return [
        ["الفرع", "الإيرادات", "المصروفات", "صافي الربح", "نسبة الربح", "الحالة"],
        ...branches.map((b) => {
          const s = branchStats(b.id);
          const margin = s.revenues ? ((s.profit / s.revenues) * 100).toFixed(1) + "%" : "0%";
          return [b.name, s.revenues, s.expenses, s.profit, margin, b.status];
        }),
      ];
    }

    if (reportTab === "close") {
      return [
        ["الفرع", "الإيرادات", "المصروفات", "نقاط البيع", "الإيداعات البنكية", "إقفال الخزينة", "صافي الربح"],
        ...branches.map((b) => {
          const s = branchStats(b.id);
          return [b.name, s.revenues, s.expenses, s.pos, s.bank, s.cashClose, s.profit];
        }),
      ];
    }

    if (reportTab === "expenseCategories") {
      return [
        ["بند المصروف", "الإجمالي", "النسبة من المصروفات"],
        ...expenseCategorySummary.map((x) => [x.category, x.amount, `${x.percentage.toFixed(1)}%`]),
      ];
    }

    return annualBudgetRows();
  };

  const monthlyCloseStats = useMemo(() => {
    const inPeriod = (date: string) => date >= monthlyCloseResultFrom && date <= monthlyCloseResultTo;
    const branchId = Number(monthlyCloseResultBranchId);
    const revenues = dailyRevenues
      .filter((r) => r.branchId === branchId && inPeriod(r.date))
      .reduce((sum, r) => sum + r.roomRevenue + r.monthlyRent + r.otherRevenue, 0);
    const exps = expenses
      .filter((e) => e.branchId === branchId && inPeriod(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
    const bank = deposits
      .filter((d) => d.branchId === branchId && inPeriod(d.date))
      .reduce((sum, d) => sum + d.amount, 0);
    const pos = posTxns
      .filter((p) => p.branchId === branchId && inPeriod(p.date))
      .reduce((sum, p) => sum + p.amount, 0);
    return { revenues, expenses: exps, bank, pos, cashClose: revenues - exps - bank - pos, profit: revenues - exps };
  }, [monthlyCloseResultBranchId, monthlyCloseResultFrom, monthlyCloseResultTo, dailyRevenues, expenses, deposits, posTxns]);

  const monthlyCloseRows = () => [
    ["الفرع", "من تاريخ", "إلى تاريخ", "الإيرادات", "المصروفات", "نقاط البيع", "الإيداعات البنكية", "إقفال الصندوق نهاية الشهر", "صافي الربح"],
    [branchName(monthlyCloseResultBranchId), monthlyCloseResultFrom, monthlyCloseResultTo, monthlyCloseStats.revenues, monthlyCloseStats.expenses, monthlyCloseStats.pos, monthlyCloseStats.bank, monthlyCloseStats.cashClose, monthlyCloseStats.profit],
  ];

  const printMonthlyClose = () => {
    const rows = monthlyCloseRows();
    const htmlRows = rows.map((row, i) => `<tr>${row.map((cell) => `<${i === 0 ? "th" : "td"}>${cell}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    win.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>الإقفال الشهري - ${branchName(monthlyCloseResultBranchId)}</title>
          <style>
            body{font-family:Tahoma,Arial,sans-serif;padding:28px;color:#0f172a}
            h1{text-align:center;margin:0 0 8px}
            p{text-align:center;margin:0 0 24px;font-weight:700;color:#334155}
            table{width:100%;border-collapse:collapse;margin-top:18px}
            th,td{border:1px solid #cbd5e1;padding:12px;text-align:center;font-weight:700}
            th{background:#08223d;color:#fff}
            .sign{display:flex;justify-content:space-between;margin-top:60px;font-weight:800}
          </style>
        </head>
        <body>
          <h1>تقرير الإقفال الشهري</h1>
          <p>${branchName(monthlyCloseResultBranchId)} | من ${monthlyCloseResultFrom} إلى ${monthlyCloseResultTo}</p>
          <table>${htmlRows}</table>
          <div class="sign"><span>توقيع المحاسب: ____________</span><span>اعتماد المدير: ____________</span></div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };


  const highExpenseLimit = 50000;
  const pendingExpenses = expenses.filter((e) => e.status === "في انتظار الاعتماد");
  const pendingRevenues = dailyRevenues.filter((r) => r.status === "معلق");
  const draftJournal = journal.filter((j) => j.status === "مسودة");
  const highExpenses = expenses.filter((e) => e.amount >= highExpenseLimit);

  const approveExpenseById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الاعتماد");
    const item = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "تم التدقيق والترحيل", notes: e.notes || "تم الاعتماد" } : e));
    logAction("اعتماد مصروف", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: item?.statement });
  };

  const rejectExpenseById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الرفض");
    const item = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, status: "مرفوض", notes: e.notes || "مرفوض" } : e));
    logAction("رفض مصروف", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: item?.statement });
  };

  const deleteExpenseById = (id: number) => {
    const item = expenses.find((e) => e.id === id);
    const reason = requireDeleteReason("هذا المصروف");
    if (!reason) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAction("حذف مصروف", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: `${item?.statement || ""} | سبب الحذف: ${reason}` });
  };

  const approveRevenueById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الاعتماد");
    const item = dailyRevenues.find((r) => r.id === id);
    setDailyRevenues((prev) => prev.map((r) => r.id === id ? { ...r, status: "مرحل" } : r));
    logAction("اعتماد إيراد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item ? item.roomRevenue + item.monthlyRent + item.otherRevenue : 0, notes: item?.statement });
  };

  const rejectRevenueById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الرفض");
    const item = dailyRevenues.find((r) => r.id === id);
    setDailyRevenues((prev) => prev.map((r) => r.id === id ? { ...r, status: "مرفوض" } : r));
    logAction("رفض إيراد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item ? item.roomRevenue + item.monthlyRent + item.otherRevenue : 0, notes: item?.statement });
  };

  const deleteRevenueById = (id: number) => {
    const item = dailyRevenues.find((r) => r.id === id);
    const reason = requireDeleteReason("هذا الإيراد");
    if (!reason) return;
    setDailyRevenues((prev) => prev.filter((r) => r.id !== id));
    logAction("حذف إيراد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, notes: `${item?.statement || ""} | سبب الحذف: ${reason}` });
  };

  const approveJournalById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الترحيل");
    const item = journal.find((j) => j.id === id);
    setJournal((prev) => prev.map((j) => j.id === id ? { ...j, status: "مرحل" } : j));
    logAction("ترحيل قيد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: item?.statement });
  };

  const rejectJournalById = (id: number) => {
    if (!canApprove) return alert("ليست لديك صلاحية الرفض");
    const item = journal.find((j) => j.id === id);
    setJournal((prev) => prev.map((j) => j.id === id ? { ...j, status: "مرفوض" } : j));
    logAction("رفض قيد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: item?.statement });
  };

  const deleteJournalById = (id: number) => {
    const item = journal.find((j) => j.id === id);
    const reason = requireDeleteReason("هذا القيد");
    if (!reason) return;
    setJournal((prev) => prev.filter((j) => j.id !== id));
    logAction("حذف قيد", "اعتماد العمليات", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: `${item?.statement || ""} | سبب الحذف: ${reason}` });
  };

  const approvalExportRows = () => [
    ["النوع", "التاريخ", "الفرع", "البيان", "المبلغ", "الحالة"],
    ...pendingExpenses.map((e) => ["مصروف معلق", e.date, branchName(e.branchId), e.statement, e.amount, e.status]),
    ...pendingRevenues.map((r) => ["إيراد معلق", r.date, branchName(r.branchId), r.statement, r.roomRevenue + r.monthlyRent + r.otherRevenue, r.status]),
    ...draftJournal.map((j) => ["قيد مسودة", j.date, branchName(j.branchId), j.statement, j.amount, j.status]),
    ...highExpenses.map((e) => ["تنبيه مصروف عالي", e.date, branchName(e.branchId), e.statement, e.amount, e.status]),
  ];


  const auditExportRows = () => [
    ["التاريخ", "الوقت", "المستخدم", "الصلاحية", "الإجراء", "الموقع", "الفرع", "رقم المستند", "المبلغ", "ملاحظات"],
    ...auditLogs.map((x) => [x.date, x.time, x.user, x.role, x.action, x.target, x.branchId ? branchName(x.branchId) : "-", x.docNo || "-", x.amount || "", x.notes]),
  ];

  const currentExportRows = () => {
    if (page === "monthlyClose") return monthlyCloseRows();
    if (page === "annualBudget") return annualBudgetRows();
    if (page === "reports") return reportExportRows();
    if (page === "approvals") return approvalExportRows();
    if (page === "auditLog") return auditExportRows();
    return reportRows(branches, branchStats);
  };

  const currentExportTitle = () => {
    if (page === "monthlyClose") return "الإقفال_الشهري";
    if (page === "annualBudget") return "الميزانية_السنوية";
    if (page === "reports") return `تقرير_${reportTab}`;
    if (page === "approvals") return "اعتماد_العمليات";
    if (page === "auditLog") return "سجل_التدقيق";
    return "تقرير_النظام";
  };

  const exportCsv = (title: string, rows: any[][]) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={sidebarCollapsed ? "app sidebarCollapsed" : "app"}>
      <style>{styles}</style>
      {toastMessage && <div className="toastMessage">{toastMessage}</div>}

      <div className="topUserBar">
        <div className="userMenuWrap">
          <button
            className="userMenuButton"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            <span className="userAvatar">{currentUser.slice(0, 1)}</span>
            <span className="userMenuText">
              <b>{currentUser}</b>
              <small>{currentRole}</small>
            </span>
            <span className="userChevron">⌄</span>
          </button>

          {userMenuOpen && (
            <div className="userDropdown">
              <button
                onClick={() => {
                  setPage("settings");
                  setUserMenuOpen(false);
                }}
              >
                الملف الشخصي
              </button>
              <button
                className="logoutBtn"
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
              >
                تسجيل خروج
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className={sidebarCollapsed ? "sidebar collapsed" : "sidebar"}>
        <div className="brand">
          <div className="brandLogo" aria-hidden="true">
            <span className="brandLogoBuilding">▥</span>
            <span className="brandLogoChart">↗</span>
          </div>
          <div className="brandTextBox">
            <div className="brandTitle">نظام مدثر للمحاسبة</div>
            <div className="brandSub">نظام تشغيل مالي للفروع</div>
          </div>
        </div>


        <Nav page={page} setPage={setPage} id="dashboard" icon="⌂" label="لوحة التحكم" />
        <Nav page={page} setPage={setPage} id="branches" icon="▥" label="الفروع" />
        <Nav page={page} setPage={setPage} id="monthlyClose" icon="▣" label="الإقفال الشهري" />
        <Nav page={page} setPage={setPage} id="annualBudget" icon="▨" label="الميزانية السنوية" />
        {canUse("approve") && <Nav page={page} setPage={setPage} id="approvals" icon="✓" label="اعتماد العمليات" />}
        <Nav page={page} setPage={setPage} id="auditLog" icon="◷" label="سجل التدقيق" />
        <Nav page={page} setPage={setPage} id="reports" icon="▧" label="التقارير" />
        <Nav page={page} setPage={setPage} id="settings" icon="⚙" label="الإعدادات" />

        <button
          className="sidebarToggle"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          title={sidebarCollapsed ? "إظهار الشريط" : "إخفاء الشريط"}
        >
          {sidebarCollapsed ? "‹" : "›"}
        </button>
      </aside>

      <section className="content">
        {page === "dashboard" && (
          <>
            <Header title="لوحة التحكم الرئيسية" subtitle={`تاريخ اليوم: ${today} | الفترة المالية: كل الفروع`} />
            <div className="actions">
              <button className="btn dark" onClick={() => setPage("branches")}>▥ الدخول إلى الفروع</button>
              <button className="btn green" onClick={() => exportCsv("تقرير_النظام", reportRows(branches, branchStats))}>⬇ تقرير Excel</button>
              <button className="btn red" onClick={() => window.print()}>▧ تقرير PDF</button>
            </div>

            <div className="statGrid">
              <StatCard title="مصروفات قيد التدقيق" value={totals.pending} icon="⚠️" c1="#d97706" c2="#f59e0b" />
              <StatCard title="المصروفات البنكية" value={totals.bank} icon="💳" c1="#1e3a8a" c2="#2563eb" />
              <StatCard title="المصروفات النقدية" value={totals.cashClose} icon="💵" c1="#059669" c2="#34d399" />
              <StatCard title="إجمالي المصروفات" value={totals.expense} icon="👛" c1="#1e40af" c2="#3b82f6" />
            </div>


            <Panel title="الفروع">
              <button className="btn dark small" onClick={addBranch}>＋ إضافة فرع</button>
              <Table>
                <thead>
                  <tr>
                    <th>م</th><th>اسم الفرع</th><th>عدد الوحدات</th><th>الشقق الفارغة</th><th>الدبل</th><th>الإيرادات الشهرية</th><th>المصروفات الشهرية</th><th>صافي الربح</th><th>الحالة</th><th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b, i) => {
                    const s = branchStats(b.id);
                    return (
                      <tr key={b.id}>
                        <td>{i + 1}</td>
                        <td className="bold">{b.name}</td>
                        <td>{b.rooms}</td>
                        <td>{b.emptyApartments}</td>
                        <td>{b.doubles}</td>
                        <td className="greenText">{fmt(s.revenues)}</td>
                        <td className="redText">{fmt(s.expenses)}</td>
                        <td className="greenText">{fmt(s.profit)}</td>
                        <td><span className="badge greenBadge">{b.status}</span></td>
                        <td className="rowActions">
                          <button className="iconBtn view" onClick={() => openBranch(b.id)}>عرض</button>
                          <button className="iconBtn edit" onClick={() => openBranch(b.id)}>تعديل</button>
                          <button className="iconBtn del" onClick={() => deleteBranch(b.id)}>حذف</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Panel>

            <div className="twoCols">
              <ChartBox title="إيرادات كل فرع" branches={branches} getValue={(id) => branchStats(id).revenues} />
              <ChartBox title="مصروفات كل فرع" branches={branches} getValue={(id) => branchStats(id).expenses} />
            </div>

            <Panel title="آخر الحركات">
              <Table>
                <thead><tr><th>م</th><th>التاريخ</th><th>الفرع</th><th>النوع</th><th>البيان</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  {journal.slice(0, 8).map((j, i) => (
                    <tr key={j.id}><td>{i+1}</td><td>{j.date}</td><td>{branchName(j.branchId)}</td><td><span className="badge blueBadge">{j.type}</span></td><td>{j.statement}</td><td>{fmt(j.amount)}</td><td><span className="badge greenBadge">{j.status}</span></td></tr>
                  ))}
                </tbody>
              </Table>
            </Panel>

            <div className="miniGrid">
              <Mini title="صافي الربح" value={totals.net} icon="💰" />
              <Mini title="المصروفات" value={totals.expense} icon="📉" />
              <Mini title="الإيرادات" value={totals.revenue} icon="📈" />
              <Mini title="نقاط البيع" value={totals.pos} icon="💳" />
              <Mini title="الإيداعات البنكية" value={totals.bank} icon="🏦" />
            </div>
          </>
        )}

        {page === "branches" && (
          <>
            <Header title="إدارة الفروع" subtitle="اضافة وحذف الفروع والدخول على تفاصيل كل فرع" />
            <Panel title="قائمة الفروع">
              <button className="btn dark small" onClick={addBranch}>＋ إضافة فرع جديد</button>
              <div className="branchCards">
                {branches.map((b) => {
                  const s = branchStats(b.id);
                  return (
                    <div className="branchCard" key={b.id} onClick={() => openBranch(b.id)}>
                      <div>
                        <h3>{b.name}</h3>
                        <p>الوحدات: {b.rooms} | النشطة: {b.occupied} | الفارغة: {b.emptyApartments} | الدبل: {b.doubles} | المدير: {b.manager}</p>
                        <p>الإيرادات: {fmt(s.revenues)} | المصروفات: {fmt(s.expenses)} | الصافي: {fmt(s.profit)}</p>
                      </div>
                      <div className="rowActions" onClick={(e) => e.stopPropagation()}>
                        <button className="iconBtn view" onClick={() => openBranch(b.id)}>تفاصيل</button>
                        <button className="iconBtn del" onClick={() => deleteBranch(b.id)}>حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </>
        )}

        {page === "branchDetails" && selectedBranch && (
          <>
            <Header title={`تفاصيل ${selectedBranch.name}`} subtitle="كل حركات الفرع: اليومية، المصروفات، القيود، الشبكات، الإيداعات" />
            <div className="branchTabs">
              {[
                ["summary","الملخص"],
                ["daily","اليومية والإيرادات"],
                ["expenses","المصروفات"],
                ["operations","العمليات اليومية"],
                ["pos","نقاط البيع"],
                ["bank","الإيداعات البنكية"],
              ].map(([id, label]) => (
                <button key={id} onClick={() => setBranchTab(id as any)} className={branchTab === id ? "tab active" : "tab"}>{label}</button>
              ))}
            </div>
            <BranchDetails
              branch={selectedBranch}
              stats={branchStats(selectedBranch.id)}
              expenses={expenses.filter((x) => x.branchId === selectedBranch.id)}
              revenues={dailyRevenues.filter((x) => x.branchId === selectedBranch.id)}
              deposits={deposits.filter((x) => x.branchId === selectedBranch.id)}
              pos={posTxns.filter((x) => x.branchId === selectedBranch.id)}
              journal={journal.filter((x) => x.branchId === selectedBranch.id)}
              tab={branchTab}
              branchName={branchName}
              setBranchTab={setBranchTab}
              setPage={setPage}
              allExpenses={expenses}
              setExpenses={setExpenses}
              allRevenues={dailyRevenues}
              setDailyRevenues={setDailyRevenues}
              allDeposits={deposits}
              setDeposits={setDeposits}
              allPos={posTxns}
              setPosTxns={setPosTxns}
              allJournal={journal}
              setJournal={setJournal}
              canDelete={canDelete}
              requireDeleteReason={requireDeleteReason}
              logAction={logAction}
              blockIfLocked={blockIfLocked}
              setBranches={setBranches}
              currentRole={currentRole}
            />
          </>
        )}
        {page === "dailyOps" && (
          <>
            <Header title="العمليات اليومية" subtitle="تشغيل الفروع اليومية والإيرادات والمصروفات ونقاط البيع والإيداعات" />

            <div className="actions">
              <button className="btn dark" onClick={() => setPage("revenues")}>＋ إضافة إيراد</button>
              <button className="btn green" onClick={() => setPage("expenses")}>＋ إضافة مصروف</button>
              <button className="btn red" onClick={() => window.print()}>▧ طباعة التقرير</button>
            </div>

            <div className="miniGrid">
              <Mini title="إيرادات اليوم" value={totals.revenue} icon="📈" />
              <Mini title="مصروفات اليوم" value={totals.expense} icon="📉" />
              <Mini title="نقاط البيع" value={totals.pos} icon="💳" />
              <Mini title="الإيداعات البنكية" value={totals.bank} icon="🏦" />
              <Mini title="رصيد الخزينة" value={totals.cashClose} icon="📘" />
            </div>

            <Panel title="حركة العمليات اليومية">
              <Table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>نوع العملية</th>
                    <th>البيان</th>
                    <th>طريقة الحركة</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((j) => (
                    <tr key={j.id}>
                      <td>{j.date}</td>
                      <td className="bold">{branchName(j.branchId)}</td>
                      <td><span className="badge blueBadge">{j.type}</span></td>
                      <td>{j.statement}</td>
                      <td>{j.credit}</td>
                      <td className="greenText">{fmt(j.amount)}</td>
                      <td><span className="badge greenBadge">{j.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
          </>
        )}

        {page === "revenues" && (
          <>
            <Header title="الإيرادات" subtitle="اليومية والشهرية وكامل الحركة لكل فرع مع إقفال الخزينة" />
            <AddRevenue branches={branches} data={newRevenue} setData={setNewRevenue} onAdd={addRevenue} errors={formErrors} clearError={clearFormError} />
            <Panel title="تفصيل الإيرادات اليومية والشهرية">
              <EditableRevenueTable rows={dailyRevenues} setRows={setDailyRevenues} branches={branches} branchName={branchName} />
            </Panel>
            <MonthlyClose branches={branches} branchStats={branchStats} />
          </>
        )}

        {page === "expenses" && (
          <>
            <Header title="جدول المصروفات التشغيلية والعمومية - شقق الممسي" subtitle={`تاريخ اليوم: ${today} | الفترة المالية: كل الفروع`} />
            <div className="actions">
              <button className="btn dark" onClick={addExpense}>＋ تسجيل سند صرف جديد</button>
              <button className="btn green" onClick={() => exportCsv("تقرير_المصروفات", expenses.map((e) => [e.date, branchName(e.branchId), e.category, e.statement, e.paymentMethod, e.amount, e.status]))}>⬇ تحميل تقرير Excel</button>
              <button className="btn red" onClick={() => window.print()}>▧ تحميل تقرير PDF</button>
            </div>
            <div className="statGrid">
              <StatCard title="مصروفات قيد التدقيق" value={totals.pending} icon="⚠️" c1="#d97706" c2="#f59e0b" />
              <StatCard title="المصروفات البنكية" value={expenses.filter(e=>e.paymentMethod.includes("بنكي")).reduce((s,e)=>s+e.amount,0)} icon="💳" c1="#1e3a8a" c2="#2563eb" />
              <StatCard title="المصروفات النقدية" value={expenses.filter(e=>e.paymentMethod.includes("نقد")).reduce((s,e)=>s+e.amount,0)} icon="💵" c1="#059669" c2="#34d399" />
              <StatCard title="إجمالي المصروفات" value={totals.expense} icon="👛" c1="#1e40af" c2="#3b82f6" />
            </div>
            <AddExpense branches={branches} data={newExpense} setData={setNewExpense} onAdd={addExpense} errors={formErrors} clearError={clearFormError} />
            <Panel title="كشف المصروفات التفصيلي">
              <EditableExpenseTable rows={expenses} setRows={setExpenses} branches={branches} branchName={branchName} />
            </Panel>
          </>
        )}

        {page === "pos" && (
          <>
            <Header title="نقاط البيع لكل فرع" subtitle="تفصيل الشبكات حسب الجهاز والتاريخ والفرع" />
            <AddPos branches={branches} data={newPos} setData={setNewPos} onAdd={addPos} errors={formErrors} clearError={clearFormError} />
            <Panel title="حركة نقاط البيع">
              <EditablePosTable rows={posTxns} setRows={setPosTxns} branches={branches} branchName={branchName} />
            </Panel>
          </>
        )}

        {page === "bank" && (
          <>
            <Header title="البنك والإيداعات" subtitle="حركة الإيداع والتاريخ والمرجع لكل فرع" />
            <AddDeposit branches={branches} data={newDeposit} setData={setNewDeposit} onAdd={addDeposit} errors={formErrors} clearError={clearFormError} />
            <Panel title="تفصيل الإيداعات البنكية">
              <EditableDepositTable rows={deposits} setRows={setDeposits} branches={branches} branchName={branchName} />
            </Panel>
          </>
        )}

        {page === "monthlyClose" && (
          <>
            <Header title="الإقفال الشهري" subtitle="اختار الفرع وحدد الفترة ثم اضغط بحث لعرض إقفال الصندوق نهاية الشهر" />

            <Panel title="بحث الإقفال الشهري">
              <div className="monthlyCloseSearch">
                <label>اختر الفرع
                  <SelectBranch branches={branches} value={monthlyCloseBranchId} onChange={setMonthlyCloseBranchId} />
                </label>

                <label>من تاريخ
                  <input type="date" value={monthlyCloseFrom} onChange={(e) => setMonthlyCloseFrom(e.target.value)} />
                </label>

                <label>إلى تاريخ
                  <input type="date" value={monthlyCloseTo} onChange={(e) => setMonthlyCloseTo(e.target.value)} />
                </label>

                <button className="btn dark" onClick={searchMonthlyClose}>بحث</button>
                <button className="btn green" onClick={() => exportCsv(`الإقفال_الشهري_${branchName(monthlyCloseResultBranchId)}`, monthlyCloseRows())}>Excel ↓</button>
                <button className="btn red" onClick={printMonthlyClose}>PDF ▧</button>
                <button className="btn blue" onClick={lockMonthlyPeriod}>🔒 قفل الفترة</button>
              </div>
            </Panel>

            <div className="miniGrid monthlyResultCards">
              <Mini title="إيرادات الفترة" value={monthlyCloseStats.revenues} icon="📈" />
              <Mini title="مصروفات الفترة" value={monthlyCloseStats.expenses} icon="📉" />
              <Mini title="نقاط البيع" value={monthlyCloseStats.pos} icon="💳" />
              <Mini title="الإيداعات البنكية" value={monthlyCloseStats.bank} icon="🏦" />
              <Mini title="إقفال الصندوق نهاية الشهر" value={monthlyCloseStats.cashClose} icon="📘" />
            </div>

            <Panel title="نتيجة الإقفال الشهري">
              <Table>
                <thead>
                  <tr>
                    <th>الفرع</th>
                    <th>من تاريخ</th>
                    <th>إلى تاريخ</th>
                    <th>الإيرادات</th>
                    <th>المصروفات</th>
                    <th>نقاط البيع</th>
                    <th>الإيداعات البنكية</th>
                    <th>إقفال الصندوق</th>
                    <th>صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bold">{branchName(monthlyCloseResultBranchId)}</td>
                    <td>{monthlyCloseResultFrom}</td>
                    <td>{monthlyCloseResultTo}</td>
                    <td className="greenText">{fmt(monthlyCloseStats.revenues)}</td>
                    <td className="redText">{fmt(monthlyCloseStats.expenses)}</td>
                    <td>{fmt(monthlyCloseStats.pos)}</td>
                    <td>{fmt(monthlyCloseStats.bank)}</td>
                    <td className="greenText bold">{fmt(monthlyCloseStats.cashClose)}</td>
                    <td className="greenText bold">{fmt(monthlyCloseStats.profit)}</td>
                  </tr>
                </tbody>
              </Table>
            </Panel>
          </>
        )}


        {page === "annualBudget" && (
          <>
            <Header title="الميزانية السنوية" subtitle="ميزانية نهاية السنة حتى 31/12 مع مقارنة بين السنة الحالية والسنة السابقة" />

            <Panel title="بحث الميزانية السنوية">
              <div className="monthlyCloseSearch">
                <label>اختر الفرع
                  <SelectBranch branches={branches} value={annualBranchId} onChange={setAnnualBranchId} />
                </label>

                <label>السنة الحالية
                  <input type="number" value={annualYear} onChange={(e) => { setAnnualYear(e.target.value); setAnnualCompareYear(String(Number(e.target.value || 0) - 1)); }} />
                </label>

                <label>مقارنة مع سنة
                  <input type="number" value={annualCompareYear} onChange={(e) => setAnnualCompareYear(e.target.value)} />
                </label>

                <label>تاريخ القفل
                  <input type="date" value={`${annualYear}-12-31`} readOnly />
                </label>

                <button className="btn dark" onClick={searchAnnualBudget}>بحث</button>
                <button className="btn green" onClick={() => exportCsv(`الميزانية_السنوية_${branchName(annualResultBranchId)}_${annualResultYear}`, annualBudgetRows())}>Excel ↓</button>
                <button className="btn red" onClick={printAnnualBudget}>PDF ▧</button>
              </div>
            </Panel>

            <div className="miniGrid monthlyResultCards">
              <Mini title="أصول السنة" value={annualBudgetStats.current.assets} icon="🏢" />
              <Mini title="الالتزامات" value={annualBudgetStats.current.liabilities} icon="📌" />
              <Mini title="حقوق الملكية" value={annualBudgetStats.current.equity} icon="💼" />
              <Mini title="صافي الربح" value={annualBudgetStats.current.profit} icon="💰" />
              <Mini title="إقفال الصندوق 31/12" value={annualBudgetStats.current.cashClose} icon="📘" />
            </div>

            <Panel title={`الميزانية السنوية - ${branchName(annualResultBranchId)} - قفل 31/12/${annualResultYear}`}>
              <Table>
                <thead>
                  <tr>
                    <th>البند</th>
                    <th>{annualResultYear}</th>
                    <th>{annualResultCompareYear}</th>
                    <th>الفرق</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="bold">الإيرادات</td><td className="greenText">{fmt(annualBudgetStats.current.revenues)}</td><td>{fmt(annualBudgetStats.previous.revenues)}</td><td>{fmt(annualBudgetStats.diff.revenues)}</td></tr>
                  <tr><td className="bold">المصروفات</td><td className="redText">{fmt(annualBudgetStats.current.expenses)}</td><td>{fmt(annualBudgetStats.previous.expenses)}</td><td>{fmt(annualBudgetStats.diff.expenses)}</td></tr>
                  <tr><td className="bold">نقاط البيع</td><td>{fmt(annualBudgetStats.current.pos)}</td><td>{fmt(annualBudgetStats.previous.pos)}</td><td>{fmt(annualBudgetStats.diff.pos)}</td></tr>
                  <tr><td className="bold">الإيداعات البنكية</td><td>{fmt(annualBudgetStats.current.bank)}</td><td>{fmt(annualBudgetStats.previous.bank)}</td><td>{fmt(annualBudgetStats.diff.bank)}</td></tr>
                  <tr><td className="bold">إقفال الصندوق</td><td className="greenText bold">{fmt(annualBudgetStats.current.cashClose)}</td><td>{fmt(annualBudgetStats.previous.cashClose)}</td><td>{fmt(annualBudgetStats.diff.cashClose)}</td></tr>
                  <tr><td className="bold">صافي الربح</td><td className="greenText bold">{fmt(annualBudgetStats.current.profit)}</td><td>{fmt(annualBudgetStats.previous.profit)}</td><td>{fmt(annualBudgetStats.diff.profit)}</td></tr>
                </tbody>
              </Table>
            </Panel>

            <Panel title="قائمة المركز المالي نهاية السنة">
              <Table>
                <thead><tr><th>البند</th><th>31/12/{annualResultYear}</th><th>31/12/{annualResultCompareYear}</th><th>الفرق</th></tr></thead>
                <tbody>
                  <tr><td className="bold">الأصول</td><td>{fmt(annualBudgetStats.current.assets)}</td><td>{fmt(annualBudgetStats.previous.assets)}</td><td>{fmt(annualBudgetStats.diff.assets)}</td></tr>
                  <tr><td className="bold">الالتزامات</td><td>{fmt(annualBudgetStats.current.liabilities)}</td><td>{fmt(annualBudgetStats.previous.liabilities)}</td><td>{fmt(annualBudgetStats.diff.liabilities)}</td></tr>
                  <tr><td className="bold">حقوق الملكية</td><td className="greenText bold">{fmt(annualBudgetStats.current.equity)}</td><td>{fmt(annualBudgetStats.previous.equity)}</td><td>{fmt(annualBudgetStats.diff.equity)}</td></tr>
                </tbody>
              </Table>
            </Panel>
          </>
        )}


        {page === "approvals" && (
          <>
            <Header title="اعتماد العمليات" subtitle="مركز مراجعة المصروفات والإيرادات والقيود قبل الترحيل النهائي - متاح للمدير العام فقط" />

            {currentRole !== "مدير عام" ? (
              <Panel title="صلاحية غير كافية">
                <div className="accessDenied">هذه الصفحة مخصصة للمدير العام فقط. يمكنك تغيير المستخدم الحالي من الشريط الجانبي إذا كانت لديك صلاحية المدير.</div>
              </Panel>
            ) : (
              <>

            <div className="miniGrid monthlyResultCards">
              <Mini title="مصروفات بانتظار الاعتماد" value={pendingExpenses.reduce((s, e) => s + e.amount, 0)} icon="⚠️" />
              <Mini title="إيرادات معلقة" value={pendingRevenues.reduce((s, r) => s + r.roomRevenue + r.monthlyRent + r.otherRevenue, 0)} icon="📈" />
              <Mini title="قيود مسودة" value={draftJournal.reduce((s, j) => s + j.amount, 0)} icon="🧾" />
              <Mini title="مصروفات عالية" value={highExpenses.reduce((s, e) => s + e.amount, 0)} icon="🚨" />
            </div>

            <Panel title="مصروفات في انتظار الاعتماد">
              <Table>
                <thead><tr><th>رقم السند</th><th>التاريخ</th><th>الفرع</th><th>البند</th><th>البيان</th><th>طريقة الدفع</th><th>المبلغ</th><th>الفاتورة</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {pendingExpenses.length === 0 && <tr><td colSpan={10} className="bold">لا توجد مصروفات معلقة</td></tr>}
                  {pendingExpenses.map((e) => (
                    <tr key={e.id}>
                      <td className="bold">{e.docNo || `EXP-${e.id}`}</td><td>{e.date}</td><td className="bold">{branchName(e.branchId)}</td><td>{e.category}</td><td>{e.statement}</td><td>{e.paymentMethod}</td><td className="redText">{fmt(e.amount)}</td><td><label className="fileMini">{e.attachmentName || "رفع"}<input type="file" accept="image/*,.pdf" onChange={(x) => attachExpenseFile(e.id, x.target.files?.[0])} /></label></td><td><span className="badge orangeBadge">{e.status}</span></td>
                      <td className="rowActions"><button className="iconBtn view" onClick={() => editExpenseFromApproval(e.id)}>تعديل</button><button className="iconBtn edit" onClick={() => approveExpenseById(e.id)}>اعتماد</button><button className="iconBtn reject" onClick={() => rejectExpenseById(e.id)}>رفض</button><button className="iconBtn del" onClick={() => deleteExpenseById(e.id)}>حذف</button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>

            <Panel title="إيرادات معلقة">
              <Table>
                <thead><tr><th>التاريخ</th><th>الفرع</th><th>البيان</th><th>إيراد يومي</th><th>إيجار شهري</th><th>أخرى</th><th>الإجمالي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {pendingRevenues.length === 0 && <tr><td colSpan={9} className="bold">لا توجد إيرادات معلقة</td></tr>}
                  {pendingRevenues.map((r) => {
                    const total = r.roomRevenue + r.monthlyRent + r.otherRevenue;
                    return <tr key={r.id}><td>{r.date}</td><td className="bold">{branchName(r.branchId)}</td><td>{r.statement}</td><td>{fmt(r.roomRevenue)}</td><td>{fmt(r.monthlyRent)}</td><td>{fmt(r.otherRevenue)}</td><td className="greenText">{fmt(total)}</td><td><span className="badge orangeBadge">{r.status}</span></td><td className="rowActions"><button className="iconBtn view" onClick={() => editRevenueFromApproval(r.id)}>تعديل</button><button className="iconBtn edit" onClick={() => approveRevenueById(r.id)}>اعتماد</button><button className="iconBtn reject" onClick={() => rejectRevenueById(r.id)}>رفض</button><button className="iconBtn del" onClick={() => deleteRevenueById(r.id)}>حذف</button></td></tr>;
                  })}
                </tbody>
              </Table>
            </Panel>

            <Panel title="قيود مسودة">
              <Table>
                <thead><tr><th>التاريخ</th><th>الفرع</th><th>النوع</th><th>مدين</th><th>دائن</th><th>البيان</th><th>المبلغ</th><th>الحالة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {draftJournal.length === 0 && <tr><td colSpan={9} className="bold">لا توجد قيود مسودة</td></tr>}
                  {draftJournal.map((j) => <tr key={j.id}><td>{j.date}</td><td className="bold">{branchName(j.branchId)}</td><td>{j.type}</td><td>{j.debit}</td><td>{j.credit}</td><td>{j.statement}</td><td>{fmt(j.amount)}</td><td><span className="badge blueBadge">{j.status}</span></td><td className="rowActions"><button className="iconBtn view" onClick={() => editJournalFromApproval(j.id)}>تعديل</button><button className="iconBtn edit" onClick={() => approveJournalById(j.id)}>ترحيل</button><button className="iconBtn reject" onClick={() => rejectJournalById(j.id)}>رفض</button><button className="iconBtn del" onClick={() => deleteJournalById(j.id)}>حذف</button></td></tr>)}
                </tbody>
              </Table>
            </Panel>

            <Panel title={`تنبيه مصروفات عالية أكبر من ${fmt(highExpenseLimit)}`}>
              <Table>
                <thead><tr><th>التاريخ</th><th>الفرع</th><th>البند</th><th>البيان</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  {highExpenses.length === 0 && <tr><td colSpan={6} className="bold">لا توجد مصروفات عالية</td></tr>}
                  {highExpenses.map((e) => <tr key={e.id}><td>{e.date}</td><td className="bold">{branchName(e.branchId)}</td><td>{e.category}</td><td>{e.statement}</td><td className="redText bold">{fmt(e.amount)}</td><td>{e.status}</td></tr>)}
                </tbody>
              </Table>
            </Panel>
              </>
            )}
          </>
        )}


        {page === "auditLog" && (
          <>
            <Header title="سجل التدقيق" subtitle="يعرض كل الإضافات والتعديلات والاعتمادات والرفض والحذف وقفل الفترات" />

            <div className="miniGrid monthlyResultCards">
              <Mini title="إجمالي الحركات" value={auditLogs.length} icon="◷" />
              <Mini title="فترات مقفلة" value={lockedPeriods.length} icon="🔒" />
              <Mini title="مصروفات عالية" value={highExpenses.length} icon="🚨" />
              <Mini title="عمليات معلقة" value={pendingExpenses.length + pendingRevenues.length + draftJournal.length} icon="⚠️" />
            </div>

            <Panel title="الفترات المالية المقفلة">
              <Table>
                <thead><tr><th>الفرع</th><th>من تاريخ</th><th>إلى تاريخ</th><th>قفل بواسطة</th><th>تاريخ القفل</th></tr></thead>
                <tbody>
                  {lockedPeriods.length === 0 && <tr><td colSpan={5} className="bold">لا توجد فترات مقفلة</td></tr>}
                  {lockedPeriods.map((p) => <tr key={p.id}><td className="bold">{branchName(p.branchId)}</td><td>{p.from}</td><td>{p.to}</td><td>{p.lockedBy}</td><td>{p.lockedAt}</td></tr>)}
                </tbody>
              </Table>
            </Panel>

            <Panel title="حركة سجل التدقيق">
              <Table>
                <thead><tr><th>التاريخ</th><th>الوقت</th><th>المستخدم</th><th>الصلاحية</th><th>الإجراء</th><th>الموقع</th><th>الفرع</th><th>رقم المستند</th><th>المبلغ</th><th>ملاحظات</th></tr></thead>
                <tbody>
                  {auditLogs.map((x) => (
                    <tr key={x.id}>
                      <td>{x.date}</td><td>{x.time}</td><td className="bold">{x.user}</td><td>{x.role}</td><td><span className="badge blueBadge">{x.action}</span></td><td>{x.target}</td><td>{x.branchId ? branchName(x.branchId) : "-"}</td><td>{x.docNo || "-"}</td><td>{x.amount ? fmt(x.amount) : "-"}</td><td>{x.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
          </>
        )}

        {page === "reports" && (
          <>
            <Header title="التقارير" subtitle="تقارير تحليلية للإدارة والمقارنة والإقفال والمصروفات" />

            <div className="branchTabs reportTabs">
              <button className={reportTab === "summary" ? "tab active" : "tab"} onClick={() => setReportTab("summary")}>ملخص الإدارة</button>
              <button className={reportTab === "branches" ? "tab active" : "tab"} onClick={() => setReportTab("branches")}>مقارنة الفروع</button>
              <button className={reportTab === "close" ? "tab active" : "tab"} onClick={() => setReportTab("close")}>تقرير الإقفال</button>
              <button className={reportTab === "expenseCategories" ? "tab active" : "tab"} onClick={() => setReportTab("expenseCategories")}>المصروفات حسب البند</button>
              <button className={reportTab === "annual" ? "tab active" : "tab"} onClick={() => setReportTab("annual")}>التقرير السنوي</button>
            </div>

            <div className="actions">
              <button className="btn green" onClick={() => exportCsv(`تقرير_${reportTab}`, reportExportRows())}>⬇ Excel</button>
              <button className="btn red" onClick={() => window.print()}>▧ PDF</button>
            </div>

            {reportTab === "summary" && (
              <>
                <div className="miniGrid">
                  <Mini title="إجمالي الإيرادات" value={totals.revenue} icon="📈" />
                  <Mini title="إجمالي المصروفات" value={totals.expense} icon="📉" />
                  <Mini title="صافي الربح" value={totals.net} icon="💰" />
                  <Mini title="الإيداعات البنكية" value={totals.bank} icon="🏦" />
                  <Mini title="نقاط البيع" value={totals.pos} icon="💳" />
                  <Mini title="إقفال الخزينة" value={totals.cashClose} icon="📘" />
                </div>

                <Panel title="ملخص الإدارة">
                  <Table>
                    <thead>
                      <tr><th>المؤشر</th><th>القيمة</th><th>قراءة إدارية</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="bold">الإيرادات</td><td className="greenText">{fmt(totals.revenue)}</td><td>إجمالي دخل جميع الفروع</td></tr>
                      <tr><td className="bold">المصروفات</td><td className="redText">{fmt(totals.expense)}</td><td>إجمالي تكلفة التشغيل</td></tr>
                      <tr><td className="bold">صافي الربح</td><td className="greenText bold">{fmt(totals.net)}</td><td>{totals.net >= 0 ? "الوضع ربح" : "يوجد عجز يحتاج مراجعة"}</td></tr>
                      <tr><td className="bold">إقفال الخزينة</td><td className="greenText bold">{fmt(totals.cashClose)}</td><td>الإيرادات ناقص المصروفات ونقاط البيع والإيداعات</td></tr>
                    </tbody>
                  </Table>
                </Panel>
              </>
            )}

            {reportTab === "branches" && (
              <Panel title="تقرير مقارنة الفروع">
                <Table>
                  <thead>
                    <tr><th>الفرع</th><th>الإيرادات</th><th>المصروفات</th><th>صافي الربح</th><th>نسبة الربح</th><th>حالة الفرع</th></tr>
                  </thead>
                  <tbody>
                    {branches.map((b) => {
                      const s = branchStats(b.id);
                      const margin = s.revenues ? (s.profit / s.revenues) * 100 : 0;
                      return (
                        <tr key={b.id}>
                          <td className="bold">{b.name}</td>
                          <td className="greenText">{fmt(s.revenues)}</td>
                          <td className="redText">{fmt(s.expenses)}</td>
                          <td className={s.profit >= 0 ? "greenText bold" : "redText bold"}>{fmt(s.profit)}</td>
                          <td>{margin.toFixed(1)}%</td>
                          <td><span className={s.profit >= 0 ? "badge greenBadge" : "badge redBadge"}>{s.profit >= 0 ? "جيد" : "يحتاج متابعة"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Panel>
            )}

            {reportTab === "close" && (
              <>
                <div className="miniGrid">
                  <Mini title="إيرادات الفترة" value={totals.revenue} icon="📈" />
                  <Mini title="مصروفات الفترة" value={totals.expense} icon="📉" />
                  <Mini title="نقاط البيع" value={totals.pos} icon="💳" />
                  <Mini title="الإيداعات البنكية" value={totals.bank} icon="🏦" />
                  <Mini title="إقفال الخزينة" value={totals.cashClose} icon="📘" />
                </div>

                <Panel title="تقرير الإقفال حسب الفروع">
                  <Table>
                    <thead><tr><th>الفرع</th><th>الإيرادات</th><th>المصروفات</th><th>نقاط البيع</th><th>الإيداعات البنكية</th><th>إقفال الخزينة</th><th>صافي الربح</th></tr></thead>
                    <tbody>
                      {branches.map((b) => {
                        const s = branchStats(b.id);
                        return <tr key={b.id}><td className="bold">{b.name}</td><td>{fmt(s.revenues)}</td><td>{fmt(s.expenses)}</td><td>{fmt(s.pos)}</td><td>{fmt(s.bank)}</td><td className="greenText bold">{fmt(s.cashClose)}</td><td className={s.profit >= 0 ? "greenText bold" : "redText bold"}>{fmt(s.profit)}</td></tr>;
                      })}
                    </tbody>
                  </Table>
                </Panel>
              </>
            )}

            {reportTab === "expenseCategories" && (
              <>
                <Panel title="تقرير المصروفات حسب البند">
                  <Table>
                    <thead><tr><th>بند المصروف</th><th>الإجمالي</th><th>النسبة من إجمالي المصروفات</th></tr></thead>
                    <tbody>
                      {expenseCategorySummary.map((x) => (
                        <tr key={x.category}>
                          <td className="bold">{x.category}</td>
                          <td className="redText">{fmt(x.amount)}</td>
                          <td>{x.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Panel>

                <Panel title="رسم مبسط للمصروفات">
                  <div className="bars">
                    {expenseCategorySummary.map((x) => (
                      <div className="barRow" key={x.category}>
                        <span>{x.category}</span>
                        <div><i style={{ width: `${Math.min(x.percentage, 100)}%` }} /></div>
                        <b>{fmt(x.amount)}</b>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {reportTab === "annual" && (
              <>
                <Panel title="التقرير السنوي والمقارنة">
                  <Table>
                    <thead>
                      <tr><th>البند</th><th>{annualResultYear}</th><th>{annualResultCompareYear}</th><th>الفرق</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="bold">الإيرادات</td><td className="greenText">{fmt(annualBudgetStats.current.revenues)}</td><td>{fmt(annualBudgetStats.previous.revenues)}</td><td>{fmt(annualBudgetStats.diff.revenues)}</td></tr>
                      <tr><td className="bold">المصروفات</td><td className="redText">{fmt(annualBudgetStats.current.expenses)}</td><td>{fmt(annualBudgetStats.previous.expenses)}</td><td>{fmt(annualBudgetStats.diff.expenses)}</td></tr>
                      <tr><td className="bold">صافي الربح</td><td className="greenText bold">{fmt(annualBudgetStats.current.profit)}</td><td>{fmt(annualBudgetStats.previous.profit)}</td><td>{fmt(annualBudgetStats.diff.profit)}</td></tr>
                      <tr><td className="bold">الأصول</td><td>{fmt(annualBudgetStats.current.assets)}</td><td>{fmt(annualBudgetStats.previous.assets)}</td><td>{fmt(annualBudgetStats.diff.assets)}</td></tr>
                      <tr><td className="bold">الالتزامات</td><td>{fmt(annualBudgetStats.current.liabilities)}</td><td>{fmt(annualBudgetStats.previous.liabilities)}</td><td>{fmt(annualBudgetStats.diff.liabilities)}</td></tr>
                      <tr><td className="bold">حقوق الملكية</td><td className="greenText bold">{fmt(annualBudgetStats.current.equity)}</td><td>{fmt(annualBudgetStats.previous.equity)}</td><td>{fmt(annualBudgetStats.diff.equity)}</td></tr>
                    </tbody>
                  </Table>
                </Panel>

                <div className="actions">
                  <button className="btn dark" onClick={() => setPage("annualBudget")}>فتح صفحة الميزانية السنوية</button>
                </div>
              </>
            )}
          </>
        )}

        {page === "settings" && (
          <>
            <Header title="الإعدادات" subtitle="مركز التحكم الكامل للنظام والبيانات والصلاحيات والتقارير" />

            <div className="settingsCards">
              <div className="settingCard"><span>🏢</span><b>بيانات الشركة</b><small>الاسم والسجل والضريبة</small></div>
              <div className="settingCard"><span>🏨</span><b>إعدادات الفروع</b><small>مدير الفرع وحدود المصروف</small></div>
              <div className="settingCard"><span>📘</span><b>إعدادات المحاسبة</b><small>الإقفال والسنة المالية</small></div>
              <div className="settingCard"><span>👥</span><b>الصلاحيات</b><small>مدير ومحاسب ومشرف</small></div>
            </div>

            <Panel title="بيانات الشركة">
              <div className="settingsGrid proSettingsGrid">
                <label>اسم المؤسسة<input defaultValue="نظام مدثر نظام تشغيل مالي للفروع" /></label>
                <label>السجل التجاري<input placeholder="أدخل رقم السجل التجاري" /></label>
                <label>الرقم الضريبي<input placeholder="أدخل الرقم الضريبي" /></label>
                <label>المدينة<input defaultValue="الرياض" /></label>
                <label className="span2">العنوان<input placeholder="اكتب عنوان المؤسسة" /></label>
                <label>العملة<input defaultValue="SAR" /></label>
              </div>
            </Panel>

            <Panel title="إعدادات الفروع والتشغيل">
              <div className="settingsGrid proSettingsGrid">
                <label>نسبة الإشغال المستهدفة<input defaultValue="85%" /></label>
                <label>حد المصروف اليومي<input defaultValue="5000" /></label>
                <label>حد المصروف الشهري<input defaultValue="50000" /></label>
                <label>تنبيه انخفاض الإيراد<input defaultValue="أقل من 70%" /></label>
                <label>اعتماد المصروفات<select defaultValue="manager"><option value="manager">اعتماد المدير</option><option value="accountant">اعتماد المحاسب</option><option value="auto">اعتماد تلقائي</option></select></label>
                <label>حالة الفروع<select defaultValue="active"><option value="active">نشطة</option><option value="all">كل الفروع</option></select></label>
              </div>
            </Panel>

            <Panel title="إعدادات المحاسبة والإقفال">
              <div className="settingsGrid proSettingsGrid">
                <label>الفترة المالية<input defaultValue="2026-05" /></label>
                <label>بداية السنة المالية<input type="date" defaultValue="2026-01-01" /></label>
                <label>نهاية السنة المالية<input type="date" defaultValue="2026-12-31" /></label>
                <label>طريقة الإقفال<input defaultValue="إيرادات - مصروفات - شبكات - إيداعات" /></label>
                <label>مركز التكلفة الافتراضي<input defaultValue="الفروع" /></label>
                <label>ترحيل القيود<select defaultValue="manual"><option value="manual">يدوي بعد المراجعة</option><option value="auto">تلقائي</option></select></label>
              </div>
            </Panel>

            <Panel title="إدارة المستخدمين والصلاحيات">
              <div className="userAddBox">
                <label>اسم المستخدم
                  <input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="مثال: أحمد المحاسب" />
                </label>
                <label>رقم الجوال للواتساب
                  <input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="مثال: 05xxxxxxxx" />
                </label>
                <label>الدور
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                    <option>مدير عام</option>
                    <option>محاسب</option>
                    <option>مشرف فرع</option>
                    <option>موظف استقبال</option>
                    <option>مشاهدة فقط</option>
                  </select>
                </label>
                <label>الفرع المرتبط
                  <SelectBranch branches={branches} value={newUser.branchId} onChange={(id) => setNewUser({ ...newUser, branchId: id })} />
                </label>
                <button className="btn dark" onClick={addSystemUser}>＋ إضافة مستخدم</button>
              </div>

              <div className="permissionGrid enhancedPermissions">
                {systemUsers.map((user) => (
                  <div className="permissionRow permissionRowPro" key={user.id}>
                    <div className="userIdentity">
                      <input value={user.name} onChange={(e) => updateSystemUser(user.id, "name", e.target.value)} />
                      <input value={user.phone || ""} onChange={(e) => updateSystemUser(user.id, "phone", e.target.value)} placeholder="رقم الجوال" />
                      <input value={user.username || ""} readOnly placeholder="اسم الدخول" />
                      <select value={user.role} onChange={(e) => updateSystemUser(user.id, "role", e.target.value as UserRole)}>
                        <option>مدير عام</option>
                        <option>محاسب</option>
                        <option>مشرف فرع</option>
                        <option>موظف استقبال</option>
                        <option>مشاهدة فقط</option>
                      </select>
                    </div>
                    <div className="permissionChips">
                      {allPermissions.map((permission) => (
                        <label key={permission} className={user.permissions.includes(permission) ? "permChip active" : "permChip"}>
                          <input type="checkbox" checked={user.permissions.includes(permission)} onChange={() => toggleUserPermission(user.id, permission)} />
                          {permissionLabel(permission)}
                        </label>
                      ))}
                    </div>
                    <div className="userControls">
                      <span className="whatsappStatus">{user.whatsappStatus || "واتساب جاهز"}</span>
                      <label className="switchLine"><input type="checkbox" checked={user.active} onChange={(e) => updateSystemUser(user.id, "active", e.target.checked)} /> نشط</label>
                      <button className="iconBtn del" onClick={() => deleteSystemUser(user.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="noteBox">ملاحظة: المدير العام يستطيع منح أو إلغاء صلاحية الاعتماد لأي مستخدم، وبيانات الدخول ترسل تلقائياً عبر واتساب عند إضافة المستخدم.</div>
            </Panel>

            <Panel title="إعدادات التقارير والطباعة والنسخ الاحتياطي">
              <div className="settingsGrid proSettingsGrid">
                <label>شعار التقرير<input type="file" /></label>
                <label>توقيع المحاسب<input placeholder="اسم المحاسب" /></label>
                <label>توقيع المدير<input placeholder="اسم المدير" /></label>
                <label>تنسيق الطباعة<select defaultValue="a4"><option value="a4">A4</option><option value="wide">عرضي</option></select></label>
              </div>
              <div className="actions settingsActions">
                <button className="btn green" onClick={() => exportCsv("نسخة_احتياطية_كاملة", reportRows(branches, branchStats))}>⬇ تصدير نسخة Excel</button>
                <button className="btn dark" onClick={() => alert("سيتم ربط الاستيراد لاحقاً مع قاعدة البيانات")}>⬆ استيراد بيانات</button>
                <button className="btn red" onClick={() => window.print()}>▧ طباعة الإعدادات</button>
              </div>
            </Panel>
          </>
        )}


        <BottomActions
          onExcel={() => exportCsv(currentExportTitle(), currentExportRows())}
          onPdf={() => window.print()}
          onPrint={() => window.print()}
        />
      </section>
    </main>
  );
}


function BottomActions({ onExcel, onPdf, onPrint }: { onExcel: () => void; onPdf: () => void; onPrint: () => void }) {
  return (
    <div className="bottomActions noPrint">
      <button className="bottomBtn green" onClick={onExcel}>Excel ↓</button>
      <button className="bottomBtn red" onClick={onPdf}>PDF ▧</button>
      <button className="bottomBtn blue" onClick={onPrint}>طباعة 🖨</button>
    </div>
  );
}

function reportRows(branches: Branch[], branchStats: (id:number)=>any) {
  return [["الفرع", "الإيرادات", "المصروفات", "نقاط البيع", "الإيداعات", "إقفال الخزينة", "صافي الربح"], ...branches.map((b) => {
    const s = branchStats(b.id);
    return [b.name, s.revenues, s.expenses, s.pos, s.bank, s.cashClose, s.profit];
  })];
}

function Nav({ page, setPage, id, icon, label }: { page: Page; setPage: (p: Page) => void; id: Page; icon: string; label: string }) {
  return <button className={page === id ? "nav active" : "nav"} onClick={() => setPage(id)}><span>{icon}</span><span>{label}</span></button>;
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="header"><h1>{title}</h1><p>{subtitle}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panelTitle">{title}</div>{children}</section>;
}

function Table({ children }: { children: React.ReactNode }) {
  return <div className="tableWrap"><table>{children}</table></div>;
}

function StatCard({ title, value, icon, c1, c2 }: { title: string; value: number; icon: string; c1: string; c2: string }) {
  return <div className="stat" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}><div className="statIcon">{icon}</div><div><p>{title}</p><h2>{sar(value)}</h2></div></div>;
}

function Mini({ title, value, icon }: { title: string; value: number; icon: string }) {
  return <div className="mini"><div>{icon}</div><h3>{title}</h3><b>{fmt(value)}</b></div>;
}

function ChartBox({ title, branches, getValue }: { title: string; branches: Branch[]; getValue: (id: number) => number }) {
  const max = Math.max(...branches.map((b) => getValue(b.id)), 1);
  return <Panel title={title}><div className="bars">{branches.map((b) => <div className="barRow" key={b.id}><span>{b.name}</span><div><i style={{ width: `${(getValue(b.id) / max) * 100}%` }} /></div><b>{getValue(b.id).toLocaleString()}</b></div>)}</div></Panel>;
}

function BranchDetails(props: any) {
  const {
    branch,
    stats,
    expenses,
    revenues,
    deposits,
    pos,
    journal,
    tab,
    allExpenses,
    setExpenses,
    allRevenues,
    setDailyRevenues,
    allDeposits,
    setDeposits,
    allPos,
    setPosTxns,
    allJournal,
    setJournal,
    canDelete,
    requireDeleteReason,
    logAction,
    blockIfLocked,
    setBranches,
    currentRole,
  } = props;

  const isManager = currentRole === "مدير عام";
  const lockOldDate = (value: string) => isManager ? value : today;
  const updateBranchCount = (key: "emptyApartments" | "doubles", value: string) => {
    const numeric = Math.max(0, Number(value || 0));
    setBranches?.((prev: Branch[]) => prev.map((b) => b.id === branch.id ? { ...b, [key]: numeric } : b));
  };

  const exportBranchExpenses = () => {
    const rows = [["التاريخ", "البند", "البيان", "طريقة الدفع", "المبلغ", "الحالة"], ...expenses.map((e:any)=>[e.date,e.category,e.statement,e.paymentMethod,e.amount,e.status])];
    const csv = "\uFEFF" + rows.map((r:any[]) => r.map((v:any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `مصروفات_${branch.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteExpense = (id:number) => {
    const item = allExpenses.find((x:any)=>x.id===id);
    const reason = requireDeleteReason ? requireDeleteReason("المصروف") : "";
    if(!reason) return;
    setExpenses(allExpenses.filter((x:any)=>x.id!==id));
    logAction?.("حذف مصروف", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: reason });
  };

  const approveExpense = (id:number) => {
    setExpenses(allExpenses.map((x:any)=>x.id===id?{...x,status:"تم التدقيق والترحيل",notes:"معتمد من المدير"}:x));
  };

  const updateExpense = (id:number, key:string, value:any) => {
    const item = allExpenses.find((x:any)=>x.id===id);
    const nextDate = key === "date" ? String(value) : item?.date;
    if (item && blockIfLocked?.(item.branchId, nextDate)) return;
    setExpenses(allExpenses.map((x:any)=>x.id===id?{...x,[key]:key==="amount"?Number(value):value}:x));
    logAction?.("تعديل مصروف", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: key==="amount"?Number(value):item?.amount, notes: key });
  };

  const deleteRevenue = (id:number) => {
    const item = allRevenues.find((x:any)=>x.id===id);
    const reason = requireDeleteReason ? requireDeleteReason("الإيراد") : "";
    if(!reason) return;
    setDailyRevenues(allRevenues.filter((x:any)=>x.id!==id));
    logAction?.("حذف إيراد", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: (item?.roomRevenue||0)+(item?.monthlyRent||0)+(item?.otherRevenue||0), notes: reason });
  };

  const updateRevenue = (id:number, key:string, value:any) => {
    const item = allRevenues.find((x:any)=>x.id===id);
    const nextDate = key === "date" ? String(value) : item?.date;
    if (item && blockIfLocked?.(item.branchId, nextDate)) return;
    setDailyRevenues(allRevenues.map((x:any)=>x.id===id?{...x,[key]:["roomRevenue","monthlyRent","otherRevenue"].includes(key)?Number(value):value}:x));
    logAction?.("تعديل إيراد", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, notes: key });
  };

  const deleteDeposit = (id:number) => {
    const item = allDeposits.find((x:any)=>x.id===id);
    const reason = requireDeleteReason ? requireDeleteReason("الإيداع") : "";
    if(!reason) return;
    setDeposits(allDeposits.filter((x:any)=>x.id!==id));
    logAction?.("حذف إيداع", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: reason });
  };

  const updateDeposit = (id:number, key:string, value:any) => {
    const item = allDeposits.find((x:any)=>x.id===id);
    const nextDate = key === "date" ? String(value) : item?.date;
    if (item && blockIfLocked?.(item.branchId, nextDate)) return;
    setDeposits(allDeposits.map((x:any)=>x.id===id?{...x,[key]:key==="amount"?Number(value):value}:x));
    logAction?.("تعديل إيداع", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: key==="amount"?Number(value):item?.amount, notes: key });
  };

  const deletePos = (id:number) => {
    const item = allPos.find((x:any)=>x.id===id);
    const reason = requireDeleteReason ? requireDeleteReason("عملية نقاط البيع") : "";
    if(!reason) return;
    setPosTxns(allPos.filter((x:any)=>x.id!==id));
    logAction?.("حذف نقاط بيع", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: item?.amount, notes: reason });
  };

  const updatePos = (id:number, key:string, value:any) => {
    const item = allPos.find((x:any)=>x.id===id);
    const nextDate = key === "date" ? String(value) : item?.date;
    if (item && blockIfLocked?.(item.branchId, nextDate)) return;
    setPosTxns(allPos.map((x:any)=>x.id===id?{...x,[key]:key==="amount"?Number(value):value}:x));
    logAction?.("تعديل نقاط بيع", "تفاصيل الفرع", { branchId: item?.branchId, docNo: item?.docNo, amount: key==="amount"?Number(value):item?.amount, notes: key });
  };

  const [expenseDraft, setExpenseDraft] = useState({
    date: today,
    category: "صيانة وتشغيل",
    statement: "",
    paymentMethod: "نقداً",
    amount: "",
    notes: "",
  });

  const [revenueDraft, setRevenueDraft] = useState({
    date: today,
    statement: "",
    roomRevenue: "",
    monthlyRent: "",
    otherRevenue: "",
    notes: "",
  });

  const [journalDraft, setJournalDraft] = useState({
    date: today,
    type: "إيراد" as JournalEntry["type"],
    movementMethod: "الصندوق",
    statement: "",
    amount: "",
    status: "مسودة" as JournalEntry["status"],
  });

  const [posDraft, setPosDraft] = useState({
    date: today,
    device: "مدى 1",
    amount: "",
    reference: "",
    notes: "",
  });

  const [depositDraft, setDepositDraft] = useState({
    date: today,
    bankName: "الراجحي",
    amount: "",
    reference: "",
    notes: "",
  });



  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});

  const setBranchField = (section: string, key: string, value: string, setter: any, draft: any) => {
    setter({ ...draft, [key]: value });
    setBranchErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${section}_${key}`];
      return copy;
    });
  };

  const requireBranchFields = (fields: Record<string, any>) => {
    const nextErrors: Record<string, string> = {};
    Object.entries(fields).forEach(([key, value]) => {
      const isAmount = key.toLowerCase().includes("amount") || key.includes("Revenue") || key.includes("Rent");
      if (value === undefined || value === null || String(value).trim() === "") {
        nextErrors[key] = "هذا الحقل مطلوب";
      } else if (isAmount && Number(value) <= 0) {
        nextErrors[key] = "أدخل مبلغ أكبر من صفر";
      }
    });
    setBranchErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      alert("أكمل الحقول المطلوبة قبل الحفظ");
      return false;
    }
    return true;
  };

    const localDocNo = (prefix: string, id = uid()) => `${prefix}-${String(id).slice(-6)}`;

  const expenseCategories = [
    "صيانة وتشغيل",
    "كهرباء ومياه",
    "رواتب وأجور",
    "مستلزمات ونظافة",
    "ضيافة واستهلاكات",
    "إنترنت واتصالات",
    "إيجارات",
    "أخرى",
  ];

  const addBranchRevenue = () => {
    const roomRevenue = Number(revenueDraft.roomRevenue || 0);
    const monthlyRent = Number(revenueDraft.monthlyRent || 0);
    const otherRevenue = Number(revenueDraft.otherRevenue || 0);
    const amount = roomRevenue + monthlyRent + otherRevenue;
    if (!requireBranchFields({ revenue_date: revenueDraft.date, revenue_statement: revenueDraft.statement, revenue_amount: String(amount) })) return;
    if (blockIfLocked?.(branch.id, revenueDraft.date)) return;

    const id = uid();
    const docNo = localDocNo("REV", id);
    const statement = revenueDraft.statement.trim();

    setDailyRevenues([
      { id, docNo, date: revenueDraft.date, month: revenueDraft.date.slice(0, 7), branchId: branch.id, roomRevenue, monthlyRent, otherRevenue, statement, status: "مرحل" },
      ...allRevenues,
    ]);
    setJournal([
      { id: uid(), docNo: localDocNo("JRN"), date: revenueDraft.date, branchId: branch.id, type: "إيراد", debit: "الصندوق", credit: "إيرادات", amount, statement, status: "مرحل" },
      ...allJournal,
    ]);
    logAction?.("إضافة إيراد", "تفاصيل الفرع", { branchId: branch.id, docNo, amount, notes: statement });
    setRevenueDraft({ date: revenueDraft.date || today, statement: "", roomRevenue: "", monthlyRent: "", otherRevenue: "", notes: "" });
  };

  const addBranchExpense = () => {
    const amount = Number(expenseDraft.amount);
    if (!requireBranchFields({ expense_date: expenseDraft.date, expense_category: expenseDraft.category, expense_statement: expenseDraft.statement, expense_paymentMethod: expenseDraft.paymentMethod, expense_amount: expenseDraft.amount })) return;
    if (blockIfLocked?.(branch.id, expenseDraft.date)) return;

    const id = uid();
    const docNo = localDocNo("EXP", id);
    const statement = expenseDraft.statement.trim();

    setExpenses([
      {
        id,
        docNo,
        date: expenseDraft.date || today,
        month: (expenseDraft.date || today).slice(0, 7),
        branchId: branch.id,
        category: expenseDraft.category,
        statement,
        paymentMethod: expenseDraft.paymentMethod,
        amount,
        status: "في انتظار الاعتماد",
        notes: expenseDraft.notes,
      },
      ...allExpenses,
    ]);

    setJournal([
      {
        id: uid(),
        docNo: localDocNo("JRN"),
        date: expenseDraft.date || today,
        branchId: branch.id,
        type: "مصروف",
        debit: expenseDraft.category,
        credit: expenseDraft.paymentMethod,
        amount,
        statement,
        status: "مسودة",
      },
      ...allJournal,
    ]);
    logAction?.("إضافة مصروف", "تفاصيل الفرع", { branchId: branch.id, docNo, amount, notes: statement });

    setExpenseDraft({
      date: expenseDraft.date || today,
      category: expenseDraft.category,
      statement: "",
      paymentMethod: expenseDraft.paymentMethod,
      amount: "",
      notes: "",
    });
  };

  const addBranchDeposit = () => {
    const amount = Number(depositDraft.amount);
    if (!requireBranchFields({ deposit_date: depositDraft.date, deposit_bankName: depositDraft.bankName, deposit_amount: depositDraft.amount, deposit_reference: depositDraft.reference, deposit_notes: depositDraft.notes })) return;
    if (blockIfLocked?.(branch.id, depositDraft.date)) return;

    const id = uid();
    const docNo = localDocNo("DEP", id);
    const notes = depositDraft.notes.trim() || "إيداع بنكي داخل الفرع";
    const reference = depositDraft.reference.trim() || docNo;

    setDeposits([
      { id, docNo, date: depositDraft.date, month: depositDraft.date.slice(0, 7), branchId: branch.id, bankName: depositDraft.bankName, amount, reference, notes },
      ...allDeposits,
    ]);
    setJournal([
      { id: uid(), docNo: localDocNo("JRN"), date: depositDraft.date, branchId: branch.id, type: "إيداع بنكي", debit: "البنك", credit: "الصندوق", amount, statement: notes, status: "مرحل" },
      ...allJournal,
    ]);
    logAction?.("إضافة إيداع بنكي", "تفاصيل الفرع", { branchId: branch.id, docNo, amount, notes });
    setDepositDraft({ date: depositDraft.date || today, bankName: depositDraft.bankName || "الراجحي", amount: "", reference: "", notes: "" });
  };

  const addBranchPos = () => {
    const amount = Number(posDraft.amount);
    if (!requireBranchFields({ pos_date: posDraft.date, pos_device: posDraft.device, pos_amount: posDraft.amount, pos_reference: posDraft.reference, pos_notes: posDraft.notes })) return;
    if (blockIfLocked?.(branch.id, posDraft.date)) return;

    const id = uid();
    const docNo = localDocNo("POS", id);
    const notes = posDraft.notes.trim() || "نقاط بيع داخل الفرع";
    const reference = posDraft.reference.trim() || docNo;

    setPosTxns([
      { id, docNo, date: posDraft.date, month: posDraft.date.slice(0, 7), branchId: branch.id, device: posDraft.device, amount, reference, notes },
      ...allPos,
    ]);
    setJournal([
      { id: uid(), docNo: localDocNo("JRN"), date: posDraft.date, branchId: branch.id, type: "نقاط بيع", debit: "ذمم نقاط البيع", credit: "الصندوق", amount, statement: notes, status: "مرحل" },
      ...allJournal,
    ]);
    logAction?.("إضافة نقاط بيع", "تفاصيل الفرع", { branchId: branch.id, docNo, amount, notes });
    setPosDraft({ date: posDraft.date || today, device: posDraft.device || "مدى 1", amount: "", reference: "", notes: "" });
  };

  const addBranchJournal = () => {
    const amount = Number(journalDraft.amount);
    if (!journalDraft.date) return alert("التاريخ مطلوب");
    if (!journalDraft.statement.trim()) return alert("التفصيل مطلوب");
    if (!journalDraft.type) return alert("نوع العملية مطلوب");
    if (!amount || amount <= 0) return alert("أدخل مبلغ العملية");

    const id = uid();
    const docNo = localDocNo("JRN", id);
    const statement = journalDraft.statement.trim();

    setJournal([
      { id, docNo, date: journalDraft.date, branchId: branch.id, type: journalDraft.type, debit: journalDraft.movementMethod, credit: journalDraft.type, amount, statement, status: journalDraft.status },
      ...allJournal,
    ]);
    logAction?.("إضافة عملية يومية", "تفاصيل الفرع", { branchId: branch.id, docNo, amount, notes: statement });
    setJournalDraft({ date: journalDraft.date || today, type: journalDraft.type, movementMethod: journalDraft.movementMethod, statement: "", amount: "", status: "مسودة" });
  };

  return (
    <>
      <div className="statGrid">
        <StatCard title="إيرادات الفرع" value={stats.revenues} icon="📈" c1="#1e40af" c2="#3b82f6" />
        <StatCard title="مصروفات الفرع" value={stats.expenses} icon="📉" c1="#991b1b" c2="#ef4444" />
        <StatCard title="نقاط البيع" value={stats.pos} icon="💳" c1="#5b21b6" c2="#8b5cf6" />
        <StatCard title="إقفال الخزينة" value={stats.cashClose} icon="📘" c1="#047857" c2="#10b981" />
      </div>

      {tab === "summary" && (
        <Panel title="معلومات الفرع">
          <div className="infoGrid">
            <div>اسم الفرع: <b>{branch.name}</b></div>
            <div>مؤشر التشغيل: <b>{branch.rooms}</b></div>
            <div>النشط: <b>{branch.occupied}</b></div>
            <div>الشقق الفارغة: <input className="branchMiniInput" type="number" min="0" value={branch.emptyApartments} onChange={(e)=>updateBranchCount("emptyApartments", e.target.value)} /></div>
            <div>الدبل: <input className="branchMiniInput" type="number" min="0" value={branch.doubles} onChange={(e)=>updateBranchCount("doubles", e.target.value)} /></div>
            <div>المسؤول: <b>{branch.manager}</b></div>
            <div>الحالة: <b>{branch.status}</b></div>
            <div>صافي الربح: <b>{fmt(stats.profit)}</b></div>
          </div>
        </Panel>
      )}

      {tab === "daily" && (
        <Panel title="اليومية والإيرادات داخل الفرع">
          <div className="expenseSheetEntry noPrint">
            <div className="expenseSheetTitle">إدخال بنود الإيرادات</div>
            <div className="dailyBranchInfo noPrint">
              <label>الشقق الفارغة: <input className="branchMiniInput" type="number" min="0" value={branch.emptyApartments} onChange={(e)=>updateBranchCount("emptyApartments", e.target.value)} /></label>
              <label>الدبل: <input className="branchMiniInput" type="number" min="0" value={branch.doubles} onChange={(e)=>updateBranchCount("doubles", e.target.value)} /></label>
            </div>
            <div className="expenseSheetGrid">
              <label>التاريخ
                <input type="date" min={today} max={isManager ? undefined : today} value={isManager ? revenueDraft.date : today} onChange={(e)=>setRevenueDraft({...revenueDraft,date:lockOldDate(e.target.value)})} />
              </label>
              <label>التفصيل
                <input value={revenueDraft.statement} onChange={(e)=>setRevenueDraft({...revenueDraft,statement:e.target.value})} placeholder="مثال: إيراد يومي غرف" />
              </label>
              <label>إيراد يومي
                <input type="number" value={revenueDraft.roomRevenue} onChange={(e)=>setRevenueDraft({...revenueDraft,roomRevenue:e.target.value})} placeholder="0" />
              </label>
              <label>إيراد شهري
                <input type="number" value={revenueDraft.monthlyRent} onChange={(e)=>setRevenueDraft({...revenueDraft,monthlyRent:e.target.value})} placeholder="0" />
              </label>
              <label>إيرادات أخرى
                <input type="number" value={revenueDraft.otherRevenue} onChange={(e)=>setRevenueDraft({...revenueDraft,otherRevenue:e.target.value})} placeholder="0" />
              </label>
              <label>ملاحظات
                <input value={revenueDraft.notes} onChange={(e)=>setRevenueDraft({...revenueDraft,notes:e.target.value})} placeholder="اختياري" />
              </label>
              <button className="btn dark expenseAddBtn" onClick={addBranchRevenue}>حفظ</button>
            </div>
          </div>
          <div className="expenseExcelWrap">
            <table className="expenseExcelTable">
              <thead>
                <tr><th>م</th><th>التاريخ</th><th>الشقق الفارغة</th><th>الدبل</th><th>التفصيل</th><th>إيراد يومي</th><th>إيراد شهري</th><th>إيرادات أخرى</th><th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr>
              </thead>
              <tbody>
                {revenues.map((r:any, idx:number)=>(
                  <tr key={r.id} className="expenseDetailRow">
                    <td>{idx+1}</td>
                    <td><input type="date" min={today} max={isManager ? undefined : today} value={isManager ? r.date : today} readOnly={!isManager} onChange={(e)=>updateRevenue(r.id,"date",lockOldDate(e.target.value))} /></td>
                    <td><input className="branchMiniInput" type="number" min="0" value={branch.emptyApartments} onChange={(e)=>updateBranchCount("emptyApartments", e.target.value)} /></td>
                    <td><input className="branchMiniInput" type="number" min="0" value={branch.doubles} onChange={(e)=>updateBranchCount("doubles", e.target.value)} /></td>
                    <td><input value={r.statement} onChange={(e)=>updateRevenue(r.id,"statement",e.target.value)} /></td>
                    <td><input type="number" value={r.roomRevenue} onChange={(e)=>updateRevenue(r.id,"roomRevenue",e.target.value)} /></td>
                    <td><input type="number" value={r.monthlyRent} onChange={(e)=>updateRevenue(r.id,"monthlyRent",e.target.value)} /></td>
                    <td><input type="number" value={r.otherRevenue} onChange={(e)=>updateRevenue(r.id,"otherRevenue",e.target.value)} /></td>
                    <td className="greenText bold">{fmt(r.roomRevenue+r.monthlyRent+r.otherRevenue)}</td>
                    <td><select value={r.status} onChange={(e)=>updateRevenue(r.id,"status",e.target.value)}><option>مرحل</option><option>معلق</option><option>مرفوض</option></select></td>
                    <td><button className="iconBtn del" onClick={()=>deleteRevenue(r.id)}>حذف</button></td>
                  </tr>
                ))}
                <tr className="expenseTotalRow"><td colSpan={8}>الإجمالي العام</td><td>{fmt(revenues.reduce((s:any,r:any)=>s+r.roomRevenue+r.monthlyRent+r.otherRevenue,0))}</td><td colSpan={2}></td></tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "expenses" && (
        <>
          <div className="actions">
            <button className="btn green" onClick={exportBranchExpenses}>⬇ Excel</button>
            <button className="btn red" onClick={()=>window.print()}>▧ طباعة A4</button>
          </div>
          <Panel title={`مصروفات ${branch.name} - كشف A4`}>
            <div className="printHeader">
              <h2>كشف مصروفات {branch.name}</h2>
              <p>الفترة: {currentMonth} | تاريخ الطباعة: {today}</p>
            </div>

            <div className="expenseSheetEntry noPrint">
              <div className="expenseSheetTitle">إدخال بنود المصروفات</div>
              <div className="expenseSheetGrid">
                <label>التاريخ
                  <input
                    type="date"
                    value={expenseDraft.date}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, date: e.target.value })}
                  />
                </label>

                <label>بند المصروف
                  <select
                    value={expenseDraft.category}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, category: e.target.value })}
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>

                <label>البيان / التفاصيل
                  <input
                    value={expenseDraft.statement}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, statement: e.target.value })}
                    placeholder="مثال: صيانة مكيفات الدور الثاني"
                  />
                </label>

                <label>طريقة الدفع
                  <select
                    value={expenseDraft.paymentMethod}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, paymentMethod: e.target.value })}
                  >
                    <option>نقداً</option>
                    <option>تحويل بنكي</option>
                    <option>نقاط بيع</option>
                    <option>شهري</option>
                  </select>
                </label>

                <label>المبلغ
                  <input
                    type="number"
                    value={expenseDraft.amount}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: e.target.value })}
                    placeholder="0"
                  />
                </label>

                <label>ملاحظات
                  <input
                    value={expenseDraft.notes}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, notes: e.target.value })}
                    placeholder="اختياري"
                  />
                </label>

                <button className="btn dark expenseAddBtn" onClick={addBranchExpense}>
                  حفظ
                </button>
              </div>
            </div>

            <div className="expenseExcelWrap">
              <table className="expenseExcelTable">
                <thead>
                  <tr>
                    <th>م</th>
                    <th>التاريخ</th>
                    <th>بند المصروف</th>
                    <th>البيان / التفاصيل</th>
                    <th>طريقة الدفع</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th className="noPrint">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    expenses.reduce((groups:any, item:any) => {
                      const key = item.category || "مصروفات أخرى";
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(item);
                      return groups;
                    }, {})
                  ).map(([category, items]: any, groupIndex: number) => {
                    const groupTotal = items.reduce((sum:number, item:any) => sum + Number(item.amount || 0), 0);
                    return (
                      <Fragment key={category}>
                        <tr className="expenseGroupRow" key={`group-${category}`}>
                          <td colSpan={5}>بند رقم {groupIndex + 1}: {category}</td>
                          <td>{fmt(groupTotal)}</td>
                          <td colSpan={2}>عدد البنود: {items.length}</td>
                        </tr>

                        {items.map((e:any, idx:number)=>(
                          <tr key={e.id} className="expenseDetailRow">
                            <td>{idx+1}</td>
                            <td><input value={e.date} onChange={(x)=>updateExpense(e.id,"date",x.target.value)} /></td>
                            <td><input value={e.category} onChange={(x)=>updateExpense(e.id,"category",x.target.value)} /></td>
                            <td><input value={e.statement} onChange={(x)=>updateExpense(e.id,"statement",x.target.value)} /></td>
                            <td><input value={e.paymentMethod} onChange={(x)=>updateExpense(e.id,"paymentMethod",x.target.value)} /></td>
                            <td><input type="number" value={e.amount} onChange={(x)=>updateExpense(e.id,"amount",x.target.value)} /></td>
                            <td><select value={e.status} onChange={(x)=>updateExpense(e.id,"status",x.target.value)}><option>تم التدقيق والترحيل</option><option>في انتظار الاعتماد</option><option>مرفوض</option></select></td>
                            <td className="rowActions noPrint">
                              <button className="iconBtn edit" onClick={()=>approveExpense(e.id)}>اعتماد</button>
                              <button className="iconBtn del" onClick={()=>deleteExpense(e.id)}>حذف</button>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                  <tr className="expenseTotalRow"><td colSpan={5}>الإجمالي العام</td><td>{fmt(expenses.reduce((s:any,e:any)=>s+e.amount,0))}</td><td colSpan={2}></td></tr>
                </tbody>
              </table>
            </div>
            <div className="printFooter">
              <span>توقيع المحاسب: ______________</span>
              <span>اعتماد المدير: ______________</span>
            </div>
          </Panel>
        </>
      )}

      {tab === "operations" && (
        <Panel title="عمليات الفرع اليومية">
          <div className="expenseSheetEntry noPrint">
            <div className="expenseSheetTitle">إدخال بنود العمليات اليومية</div>
            <div className="expenseSheetGrid">
              <label>التاريخ
                <input type="date" value={journalDraft.date} onChange={(e)=>setJournalDraft({...journalDraft,date:e.target.value})} />
              </label>
              <label>نوع العملية
                <select value={journalDraft.type} onChange={(e)=>setJournalDraft({...journalDraft,type:e.target.value as JournalEntry["type"]})}>
                  <option>إيراد</option><option>مصروف</option><option>إيداع بنكي</option><option>نقاط بيع</option><option>تسوية</option>
                </select>
              </label>
              <label>طريقة الحركة
                <input value={journalDraft.movementMethod} onChange={(e)=>setJournalDraft({...journalDraft,movementMethod:e.target.value})} placeholder="مثال: الصندوق" />
              </label>
              <label>التفصيل
                <input value={journalDraft.statement} onChange={(e)=>setJournalDraft({...journalDraft,statement:e.target.value})} placeholder="اكتب بيان العملية" />
              </label>
              <label>المبلغ
                <input type="number" value={journalDraft.amount} onChange={(e)=>setJournalDraft({...journalDraft,amount:e.target.value})} placeholder="0" />
              </label>
              <label>الحالة
                <select value={journalDraft.status} onChange={(e)=>setJournalDraft({...journalDraft,status:e.target.value as JournalEntry["status"]})}>
                  <option>مسودة</option><option>مرحل</option>
                </select>
              </label>
              <button className="btn dark expenseAddBtn" onClick={addBranchJournal}>حفظ</button>
            </div>
          </div>
          <div className="expenseExcelWrap">
            <table className="expenseExcelTable">
              <thead><tr><th>م</th><th>التاريخ</th><th>نوع العملية</th><th>طريقة الحركة</th><th>التفصيل</th><th>المبلغ</th><th>الحالة</th></tr></thead>
              <tbody>
                {journal.map((j:any, idx:number)=>(
                  <tr key={j.id} className="expenseDetailRow"><td>{idx+1}</td><td>{j.date}</td><td>{j.type}</td><td>{j.credit}</td><td>{j.statement}</td><td>{fmt(j.amount)}</td><td>{j.status}</td></tr>
                ))}
                <tr className="expenseTotalRow"><td colSpan={5}>الإجمالي العام</td><td>{fmt(journal.reduce((s:any,j:any)=>s+j.amount,0))}</td><td></td></tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "pos" && (
        <Panel title="نقاط البيع داخل الفرع">
          <div className="expenseSheetEntry noPrint">
            <div className="expenseSheetTitle">إدخال بنود نقاط البيع</div>
            <div className="expenseSheetGrid">
              <label>التاريخ
                <input type="date" value={posDraft.date} onChange={(e)=>setPosDraft({...posDraft,date:e.target.value})} />
              </label>
              <label>الجهاز
                <input value={posDraft.device} onChange={(e)=>setPosDraft({...posDraft,device:e.target.value})} placeholder="مثال: مدى 1" />
              </label>
              <label>المبلغ
                <input type="number" value={posDraft.amount} onChange={(e)=>setPosDraft({...posDraft,amount:e.target.value})} placeholder="0" />
              </label>
              <label>المرجع
                <input value={posDraft.reference} onChange={(e)=>setPosDraft({...posDraft,reference:e.target.value})} placeholder="اختياري" />
              </label>
              <label className="span2">التفصيل / ملاحظات
                <input value={posDraft.notes} onChange={(e)=>setPosDraft({...posDraft,notes:e.target.value})} placeholder="مثال: تحصيل شبكة فترة المساء" />
              </label>
              <button className="btn dark expenseAddBtn" onClick={addBranchPos}>حفظ</button>
            </div>
          </div>
          <div className="expenseExcelWrap">
            <table className="expenseExcelTable">
              <thead><tr><th>م</th><th>التاريخ</th><th>الجهاز</th><th>المبلغ</th><th>المرجع</th><th>التفصيل</th><th>إجراء</th></tr></thead>
              <tbody>
                {pos.map((p:any,idx:number)=>(
                  <tr key={p.id} className="expenseDetailRow"><td>{idx+1}</td><td><input value={p.date} onChange={(e)=>updatePos(p.id,"date",e.target.value)} /></td><td><input value={p.device} onChange={(e)=>updatePos(p.id,"device",e.target.value)} /></td><td><input type="number" value={p.amount} onChange={(e)=>updatePos(p.id,"amount",e.target.value)} /></td><td><input value={p.reference} onChange={(e)=>updatePos(p.id,"reference",e.target.value)} /></td><td><input value={p.notes} onChange={(e)=>updatePos(p.id,"notes",e.target.value)} /></td><td><button className="iconBtn del" onClick={()=>deletePos(p.id)}>حذف</button></td></tr>
                ))}
                <tr className="expenseTotalRow"><td colSpan={3}>الإجمالي العام</td><td>{fmt(pos.reduce((s:any,p:any)=>s+p.amount,0))}</td><td colSpan={3}></td></tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "bank" && (
        <Panel title="الإيداعات البنكية داخل الفرع">
          <div className="expenseSheetEntry noPrint">
            <div className="expenseSheetTitle">إدخال بنود الإيداعات البنكية</div>
            <div className="expenseSheetGrid">
              <label>التاريخ
                <input type="date" value={depositDraft.date} onChange={(e)=>setDepositDraft({...depositDraft,date:e.target.value})} />
              </label>
              <label>البنك
                <input value={depositDraft.bankName} onChange={(e)=>setDepositDraft({...depositDraft,bankName:e.target.value})} placeholder="مثال: الراجحي" />
              </label>
              <label>المبلغ
                <input type="number" value={depositDraft.amount} onChange={(e)=>setDepositDraft({...depositDraft,amount:e.target.value})} placeholder="0" />
              </label>
              <label>المرجع
                <input value={depositDraft.reference} onChange={(e)=>setDepositDraft({...depositDraft,reference:e.target.value})} placeholder="اختياري" />
              </label>
              <label className="span2">التفصيل / ملاحظات
                <input value={depositDraft.notes} onChange={(e)=>setDepositDraft({...depositDraft,notes:e.target.value})} placeholder="مثال: إيداع خزينة الفرع" />
              </label>
              <button className="btn dark expenseAddBtn" onClick={addBranchDeposit}>حفظ</button>
            </div>
          </div>
          <div className="expenseExcelWrap">
            <table className="expenseExcelTable">
              <thead><tr><th>م</th><th>التاريخ</th><th>البنك</th><th>المبلغ</th><th>المرجع</th><th>التفصيل</th><th>إجراء</th></tr></thead>
              <tbody>
                {deposits.map((d:any,idx:number)=>(
                  <tr key={d.id} className="expenseDetailRow"><td>{idx+1}</td><td><input value={d.date} onChange={(e)=>updateDeposit(d.id,"date",e.target.value)} /></td><td><input value={d.bankName} onChange={(e)=>updateDeposit(d.id,"bankName",e.target.value)} /></td><td><input type="number" value={d.amount} onChange={(e)=>updateDeposit(d.id,"amount",e.target.value)} /></td><td><input value={d.reference} onChange={(e)=>updateDeposit(d.id,"reference",e.target.value)} /></td><td><input value={d.notes} onChange={(e)=>updateDeposit(d.id,"notes",e.target.value)} /></td><td><button className="iconBtn del" onClick={()=>deleteDeposit(d.id)}>حذف</button></td></tr>
                ))}
                <tr className="expenseTotalRow"><td colSpan={3}>الإجمالي العام</td><td>{fmt(deposits.reduce((s:any,d:any)=>s+d.amount,0))}</td><td colSpan={3}></td></tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}


function SimpleTable({ title, headers, rows }: { title: string; headers: string[]; rows: any[][] }) {
  return <Panel title={title}><Table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></Table></Panel>;
}

function SelectBranch({ branches, value, onChange }: { branches: Branch[]; value: number; onChange: (id: number) => void }) {
  return <select value={value} onChange={(e) => onChange(Number(e.target.value))}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="errorText">{message}</span> : null;
}

function AddExpense({ branches, data, setData, onAdd, errors = {}, clearError = () => {} }: any) {
  const update = (key:string, value:any) => { clearError(`expense_${key}`); setData({...data,[key]:value}); };
  return <Panel title="إضافة مصروف"><div className="formGrid"><label>الفرع<SelectBranch branches={branches} value={data.branchId} onChange={(id)=>update("branchId",id)}/><FieldError message={errors.expense_branchId}/></label><label>البند<input className={errors.expense_category?"errorInput":""} value={data.category} onChange={(e)=>update("category",e.target.value)} placeholder="مثال: صيانة وتشغيل"/><FieldError message={errors.expense_category}/></label><label>طريقة الدفع<select className={errors.expense_paymentMethod?"errorInput":""} value={data.paymentMethod} onChange={(e)=>update("paymentMethod",e.target.value)}><option>تحويل بنكي</option><option>نقداً</option><option>نقاط بيع</option><option>شهري</option></select><FieldError message={errors.expense_paymentMethod}/></label><label>المبلغ<input className={errors.expense_amount?"errorInput":""} type="number" value={data.amount} onChange={(e)=>update("amount",e.target.value)} placeholder="0"/><FieldError message={errors.expense_amount}/></label><label className="span2">البيان<input className={errors.expense_statement?"errorInput":""} value={data.statement} onChange={(e)=>update("statement",e.target.value)} placeholder="اكتب تفاصيل المصروف"/><FieldError message={errors.expense_statement}/></label><button className="btn dark" onClick={onAdd}>حفظ المصروف</button></div></Panel>;
}

function AddRevenue({ branches, data, setData, onAdd, errors = {}, clearError = () => {} }: any) {
  const update = (key:string, value:any) => { clearError(`revenue_${key}`); setData({...data,[key]:value}); };
  return <Panel title="إضافة إيراد يومي / شهري"><div className="formGrid"><label>الفرع<SelectBranch branches={branches} value={data.branchId} onChange={(id)=>update("branchId",id)}/><FieldError message={errors.revenue_branchId}/></label><label>إيراد يومي<input className={errors.revenue_roomRevenue?"errorInput":""} type="number" value={data.roomRevenue} onChange={(e)=>update("roomRevenue",e.target.value)} placeholder="0"/><FieldError message={errors.revenue_roomRevenue}/></label><label>إيجارات شهرية<input type="number" value={data.monthlyRent} onChange={(e)=>update("monthlyRent",e.target.value)} placeholder="0"/></label><label>إيرادات أخرى<input type="number" value={data.otherRevenue} onChange={(e)=>update("otherRevenue",e.target.value)} placeholder="0"/></label><label className="span2">البيان<input className={errors.revenue_statement?"errorInput":""} value={data.statement} onChange={(e)=>update("statement",e.target.value)} placeholder="اكتب بيان الإيراد"/><FieldError message={errors.revenue_statement}/></label><button className="btn dark" onClick={onAdd}>حفظ الإيراد</button></div></Panel>;
}

function AddDeposit({ branches, data, setData, onAdd, errors = {}, clearError = () => {} }: any) {
  const update = (key:string, value:any) => { clearError(`deposit_${key}`); setData({...data,[key]:value}); };
  return <Panel title="إضافة إيداع بنكي"><div className="formGrid"><label>الفرع<SelectBranch branches={branches} value={data.branchId} onChange={(id)=>update("branchId",id)}/><FieldError message={errors.deposit_branchId}/></label><label>البنك<input className={errors.deposit_bankName?"errorInput":""} value={data.bankName} onChange={(e)=>update("bankName",e.target.value)} placeholder="اسم البنك"/><FieldError message={errors.deposit_bankName}/></label><label>المبلغ<input className={errors.deposit_amount?"errorInput":""} type="number" value={data.amount} onChange={(e)=>update("amount",e.target.value)} placeholder="0"/><FieldError message={errors.deposit_amount}/></label><label>المرجع<input className={errors.deposit_reference?"errorInput":""} value={data.reference} onChange={(e)=>update("reference",e.target.value)} placeholder="رقم المرجع"/><FieldError message={errors.deposit_reference}/></label><label className="span2">ملاحظات<input className={errors.deposit_notes?"errorInput":""} value={data.notes} onChange={(e)=>update("notes",e.target.value)} placeholder="ملاحظات الإيداع"/><FieldError message={errors.deposit_notes}/></label><button className="btn dark" onClick={onAdd}>حفظ الإيداع</button></div></Panel>;
}

function AddPos({ branches, data, setData, onAdd, errors = {}, clearError = () => {} }: any) {
  const update = (key:string, value:any) => { clearError(`pos_${key}`); setData({...data,[key]:value}); };
  return <Panel title="إضافة نقاط بيع"><div className="formGrid"><label>الفرع<SelectBranch branches={branches} value={data.branchId} onChange={(id)=>update("branchId",id)}/><FieldError message={errors.pos_branchId}/></label><label>الجهاز<input className={errors.pos_device?"errorInput":""} value={data.device} onChange={(e)=>update("device",e.target.value)} placeholder="اسم الجهاز"/><FieldError message={errors.pos_device}/></label><label>المبلغ<input className={errors.pos_amount?"errorInput":""} type="number" value={data.amount} onChange={(e)=>update("amount",e.target.value)} placeholder="0"/><FieldError message={errors.pos_amount}/></label><label>المرجع<input className={errors.pos_reference?"errorInput":""} value={data.reference} onChange={(e)=>update("reference",e.target.value)} placeholder="رقم المرجع"/><FieldError message={errors.pos_reference}/></label><label className="span2">ملاحظات<input className={errors.pos_notes?"errorInput":""} value={data.notes} onChange={(e)=>update("notes",e.target.value)} placeholder="ملاحظات نقاط البيع"/><FieldError message={errors.pos_notes}/></label><button className="btn dark" onClick={onAdd}>حفظ نقاط البيع</button></div></Panel>;
}

function AddJournal({ branches, data, setData, onAdd }: any) {
  return <Panel title="إضافة قيد يومية"><div className="formGrid"><label>الفرع<SelectBranch branches={branches} value={data.branchId} onChange={(id)=>setData({...data,branchId:id})}/></label><label>نوع القيد<select value={data.type} onChange={(e)=>setData({...data,type:e.target.value})}><option>إيراد</option><option>مصروف</option><option>إيداع بنكي</option><option>نقاط بيع</option><option>تسوية</option></select></label><label>مدين<input value={data.debit} onChange={(e)=>setData({...data,debit:e.target.value})}/></label><label>دائن<input value={data.credit} onChange={(e)=>setData({...data,credit:e.target.value})}/></label><label>المبلغ<input type="number" value={data.amount} onChange={(e)=>setData({...data,amount:e.target.value})}/></label><label className="span2">البيان<input value={data.statement} onChange={(e)=>setData({...data,statement:e.target.value})}/></label><button className="btn dark" onClick={onAdd}>حفظ القيد</button></div></Panel>;
}

function EditableExpenseTable({ rows, setRows, branches, branchName }: any) {
  const update = (id:number, k:string, v:any)=>setRows(rows.map((r:any)=>r.id===id?{...r,[k]:k==="amount"?Number(v):v}:r));
  return <Table><thead><tr><th>الفرع</th><th>التاريخ</th><th>البند</th><th>البيان</th><th>الدفع</th><th>المبلغ</th><th>الحالة</th><th>حذف</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><SelectBranch branches={branches} value={r.branchId} onChange={(id)=>update(r.id,"branchId",id)}/></td><td><input value={r.date} onChange={e=>update(r.id,"date",e.target.value)}/></td><td><input value={r.category} onChange={e=>update(r.id,"category",e.target.value)}/></td><td><input value={r.statement} onChange={e=>update(r.id,"statement",e.target.value)}/></td><td><input value={r.paymentMethod} onChange={e=>update(r.id,"paymentMethod",e.target.value)}/></td><td><input type="number" value={r.amount} onChange={e=>update(r.id,"amount",e.target.value)}/></td><td><select value={r.status} onChange={e=>update(r.id,"status",e.target.value)}><option>تم التدقيق والترحيل</option><option>في انتظار الاعتماد</option><option>مرفوض</option></select></td><td><button className="iconBtn del" onClick={()=>setRows(rows.filter((x:any)=>x.id!==r.id))}>حذف</button></td></tr>)}</tbody></Table>;
}

function EditableRevenueTable({ rows, setRows, branches }: any) {
  const update = (id:number, k:string, v:any)=>setRows(rows.map((r:any)=>r.id===id?{...r,[k]:["roomRevenue","monthlyRent","otherRevenue"].includes(k)?Number(v):v}:r));
  return <Table><thead><tr><th>الفرع</th><th>التاريخ</th><th>إيراد يومي</th><th>إيجار شهري</th><th>أخرى</th><th>الإجمالي</th><th>البيان</th><th>حذف</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><SelectBranch branches={branches} value={r.branchId} onChange={(id)=>update(r.id,"branchId",id)}/></td><td><input value={r.date} onChange={e=>update(r.id,"date",e.target.value)}/></td><td><input type="number" value={r.roomRevenue} onChange={e=>update(r.id,"roomRevenue",e.target.value)}/></td><td><input type="number" value={r.monthlyRent} onChange={e=>update(r.id,"monthlyRent",e.target.value)}/></td><td><input type="number" value={r.otherRevenue} onChange={e=>update(r.id,"otherRevenue",e.target.value)}/></td><td>{fmt(r.roomRevenue+r.monthlyRent+r.otherRevenue)}</td><td><input value={r.statement} onChange={e=>update(r.id,"statement",e.target.value)}/></td><td><button className="iconBtn del" onClick={()=>setRows(rows.filter((x:any)=>x.id!==r.id))}>حذف</button></td></tr>)}</tbody></Table>;
}

function EditableDepositTable({ rows, setRows, branches }: any) {
  const update = (id:number, k:string, v:any)=>setRows(rows.map((r:any)=>r.id===id?{...r,[k]:k==="amount"?Number(v):v}:r));
  return <Table><thead><tr><th>الفرع</th><th>التاريخ</th><th>البنك</th><th>المبلغ</th><th>المرجع</th><th>ملاحظات</th><th>حذف</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><SelectBranch branches={branches} value={r.branchId} onChange={(id)=>update(r.id,"branchId",id)}/></td><td><input value={r.date} onChange={e=>update(r.id,"date",e.target.value)}/></td><td><input value={r.bankName} onChange={e=>update(r.id,"bankName",e.target.value)}/></td><td><input type="number" value={r.amount} onChange={e=>update(r.id,"amount",e.target.value)}/></td><td><input value={r.reference} onChange={e=>update(r.id,"reference",e.target.value)}/></td><td><input value={r.notes} onChange={e=>update(r.id,"notes",e.target.value)}/></td><td><button className="iconBtn del" onClick={()=>setRows(rows.filter((x:any)=>x.id!==r.id))}>حذف</button></td></tr>)}</tbody></Table>;
}

function EditablePosTable({ rows, setRows, branches }: any) {
  const update = (id:number, k:string, v:any)=>setRows(rows.map((r:any)=>r.id===id?{...r,[k]:k==="amount"?Number(v):v}:r));
  return <Table><thead><tr><th>الفرع</th><th>التاريخ</th><th>الجهاز</th><th>المبلغ</th><th>المرجع</th><th>ملاحظات</th><th>حذف</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><SelectBranch branches={branches} value={r.branchId} onChange={(id)=>update(r.id,"branchId",id)}/></td><td><input value={r.date} onChange={e=>update(r.id,"date",e.target.value)}/></td><td><input value={r.device} onChange={e=>update(r.id,"device",e.target.value)}/></td><td><input type="number" value={r.amount} onChange={e=>update(r.id,"amount",e.target.value)}/></td><td><input value={r.reference} onChange={e=>update(r.id,"reference",e.target.value)}/></td><td><input value={r.notes} onChange={e=>update(r.id,"notes",e.target.value)}/></td><td><button className="iconBtn del" onClick={()=>setRows(rows.filter((x:any)=>x.id!==r.id))}>حذف</button></td></tr>)}</tbody></Table>;
}

function EditableJournalTable({ rows, setRows, branches }: any) {
  const update = (id:number, k:string, v:any)=>setRows(rows.map((r:any)=>r.id===id?{...r,[k]:k==="amount"?Number(v):v}:r));
  return <Table><thead><tr><th>الفرع</th><th>التاريخ</th><th>النوع</th><th>مدين</th><th>دائن</th><th>المبلغ</th><th>البيان</th><th>الحالة</th><th>حذف</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><SelectBranch branches={branches} value={r.branchId} onChange={(id)=>update(r.id,"branchId",id)}/></td><td><input value={r.date} onChange={e=>update(r.id,"date",e.target.value)}/></td><td><select value={r.type} onChange={e=>update(r.id,"type",e.target.value)}><option>إيراد</option><option>مصروف</option><option>إيداع بنكي</option><option>نقاط بيع</option><option>تسوية</option></select></td><td><input value={r.debit} onChange={e=>update(r.id,"debit",e.target.value)}/></td><td><input value={r.credit} onChange={e=>update(r.id,"credit",e.target.value)}/></td><td><input type="number" value={r.amount} onChange={e=>update(r.id,"amount",e.target.value)}/></td><td><input value={r.statement} onChange={e=>update(r.id,"statement",e.target.value)}/></td><td><select value={r.status} onChange={e=>update(r.id,"status",e.target.value)}><option>مرحل</option><option>مسودة</option><option>مرفوض</option></select></td><td><button className="iconBtn del" onClick={()=>setRows(rows.filter((x:any)=>x.id!==r.id))}>حذف</button></td></tr>)}</tbody></Table>;
}

function MonthlyClose({ branches, branchStats }: any) {
  return <Panel title="إقفال الخزينة الشهري بعد طرح المصروفات والشبكات والإيداعات البنكية"><Table><thead><tr><th>الفرع</th><th>الإيرادات</th><th>المصروفات</th><th>الشبكات</th><th>الإيداعات</th><th>رصيد الصندوق نهاية الشهر</th></tr></thead><tbody>{branches.map((b:any)=>{const s=branchStats(b.id); return <tr key={b.id}><td>{b.name}</td><td>{fmt(s.revenues)}</td><td>{fmt(s.expenses)}</td><td>{fmt(s.pos)}</td><td>{fmt(s.bank)}</td><td className="greenText">{fmt(s.cashClose)}</td></tr>})}</tbody></Table></Panel>
}

const styles = `
*{box-sizing:border-box}
body{margin:0}
.app{min-height:100vh;display:flex;direction:rtl;background:#f3f6fb;color:#0f172a;font-family:Tahoma,Arial,sans-serif}
.sidebar{width:270px;background:linear-gradient(180deg,#08223d,#061b31);color:#fff;padding:22px 16px;position:sticky;top:0;height:100vh;box-shadow:-8px 0 30px rgba(2,8,23,.2)}
.brand{text-align:center;border-bottom:1px solid rgba(255,255,255,.14);padding:16px 0 24px;margin-bottom:22px;display:flex;flex-direction:column;align-items:center;gap:10px}
.brandLogo{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#f8c76b,#b9892f);color:#08223d;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 12px 28px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.28)}
.brandLogoBuilding{font-size:28px;font-weight:900;line-height:1}
.brandLogoChart{position:absolute;left:9px;bottom:8px;font-size:17px;font-weight:900;background:#08223d;color:#f8c76b;border-radius:999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
.brandTextBox{display:flex;flex-direction:column;align-items:center}
.brandTitle{font-size:21px;font-weight:900;color:#f8c76b}
.brandSub{font-size:13px;margin-top:6px;color:#e2e8f0}
.nav{width:100%;height:52px;border:0;border-radius:10px;background:transparent;color:#dbeafe;display:flex;align-items:center;gap:12px;padding:0 16px;margin-bottom:8px;font-size:16px;font-weight:800;cursor:pointer}
.nav.active{background:#2d4358;color:white;outline:1px solid rgba(255,255,255,.8)}
.content{flex:1;padding:28px 34px 60px;overflow:auto}
.header{text-align:right;background:white;border-radius:18px;padding:24px 28px;margin-bottom:18px;box-shadow:0 10px 28px rgba(15,23,42,.07)}
.header h1{font-size:32px;margin:0 0 10px;font-weight:900;color:#0b1635}
.header p{margin:0;color:#334155;font-weight:700}
.actions{display:flex;gap:14px;margin:0 0 22px;flex-wrap:wrap}
.btn{border:0;border-radius:8px;color:#fff;font-weight:900;padding:13px 22px;font-size:15px;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.12)}
.btn.small{padding:10px 16px;margin-bottom:12px}
.btn.dark{background:#0b2845}.btn.green{background:#22a566}.btn.red{background:#d9534f}
.statGrid{display:grid;grid-template-columns:repeat(4,minmax(190px,1fr));gap:20px;margin:22px 0}
.stat{height:116px;border-radius:12px;color:white;display:flex;align-items:center;gap:18px;padding:18px 22px;box-shadow:0 12px 25px rgba(15,23,42,.16)}
.statIcon{font-size:46px}
.stat p{margin:0;font-size:17px;font-weight:900}
.stat h2{margin:10px 0 0;font-size:26px;font-weight:900}
.panel{background:#fff;border-radius:14px;margin:24px 0;padding:18px;box-shadow:0 6px 20px rgba(15,23,42,.09);border:1px solid #dbe4ef}
.panelTitle{font-size:22px;font-weight:900;margin-bottom:14px;color:#0b1635}
.tableWrap{overflow:auto;border-radius:10px;border:1px solid #dbe4ef}
table{width:100%;border-collapse:collapse;min-width:1000px}
th{background:#0b3155;color:white;padding:14px 12px;font-size:14px;white-space:nowrap}
td{padding:12px;border-bottom:1px solid #e5e7eb;background:white;text-align:center;font-size:14px}
tbody tr:nth-child(even) td{background:#f8fafc}
.bold{font-weight:900}.greenText{color:#059669;font-weight:900}.redText{color:#dc2626;font-weight:900}
.badge{padding:7px 12px;border-radius:9px;font-weight:900;display:inline-block}.greenBadge{background:#d1fae5;color:#166534}.blueBadge{background:#dbeafe;color:#1d4ed8}
.rowActions{display:flex;gap:7px;justify-content:center;align-items:center}
.iconBtn{border:0;border-radius:7px;padding:8px 10px;color:white;cursor:pointer;font-weight:900}.view{background:#0b3155}.edit{background:#3b82f6}.del{background:#ef4444}
.twoCols{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.bars{display:flex;flex-direction:column;gap:12px}.barRow{display:grid;grid-template-columns:140px 1fr 90px;gap:12px;align-items:center}.barRow div{height:12px;background:#e5e7eb;border-radius:30px;overflow:hidden}.barRow i{display:block;height:100%;background:#2563eb;border-radius:30px}
.miniGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px} .monthlyResultCards{margin-bottom:18px}.mini{background:white;border-radius:12px;padding:18px;text-align:center;box-shadow:0 5px 16px rgba(15,23,42,.08)}.mini div{font-size:34px}.mini h3{font-size:15px}.mini b{font-size:20px;color:#0f766e}
.branchCards{display:flex;flex-direction:column;gap:12px}.branchCard{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}.branchCard:hover{background:#eff6ff}.branchCard h3{margin:0 0 8px}.branchCard p{margin:5px 0;color:#475569;font-weight:700}
.branchTabs{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.tab{border:0;border-radius:9px;padding:11px 16px;font-weight:900;background:#e2e8f0;cursor:pointer}.tab.active{background:#2563eb;color:white}
.infoGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.infoGrid div{background:#f8fafc;padding:16px;border-radius:12px}
.closeControls{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;align-items:end;margin-bottom:18px}.closeControls label{display:flex;flex-direction:column;gap:7px;font-weight:900}
.formGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:end}.formGrid label,.settingsGrid label{display:flex;flex-direction:column;gap:7px;font-weight:900}.span2{grid-column:span 2}
input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;background:white;font-family:inherit}
.settingsGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}

.sidebarCloseBox{
background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.10);
padding:13px;
border-radius:14px;
margin:10px 0 16px;
display:flex;
flex-direction:column;
gap:9px;
}
.sidebarCloseBox label{
display:flex;
flex-direction:column;
gap:6px;
font-size:12px;
font-weight:900;
color:#e2e8f0;
}
.sidebarTitle{
color:#f8c76b;
font-size:15px;
font-weight:900;
text-align:center;
margin-bottom:3px;
}
.sidebarCloseBox input,.sidebarCloseBox select{
height:38px;
border-radius:9px;
border:0;
padding:0 9px;
font-family:inherit;
font-weight:800;
background:white;
color:#0f172a;
width:100%;
}
.sidebarBtn{
height:40px;
border:0;
border-radius:9px;
background:#0f3b63;
color:white;
font-weight:900;
cursor:pointer;
font-family:inherit;
}
.sidebarExportBtns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sidebarExportBtns button{
height:36px;
border:0;
border-radius:9px;
background:#2d4358;
color:white;
font-weight:900;
cursor:pointer;
font-family:inherit;
}
.sidebarExportBtns button:first-child{background:#16a34a}
.sidebarExportBtns button:last-child{background:#dc2626}


.expenseExcelWrap{
width:100%;
overflow:auto;
border:1px solid #dbe4ef;
border-radius:12px;
background:white;
}
.expenseExcelTable{
width:100%;
border-collapse:collapse;
min-width:980px;
font-size:14px;
}
.expenseExcelTable th{
background:#0f3b63;
color:white;
font-weight:900;
padding:12px 10px;
border:1px solid #0b3154;
text-align:center;
white-space:nowrap;
}
.expenseExcelTable td{
border:1px solid #dbe4ef;
padding:0;
text-align:center;
font-weight:800;
height:44px;
background:white;
}
.expenseExcelTable input,.expenseExcelTable select{
width:100%;
height:44px;
border:0!important;
outline:none;
background:transparent!important;
box-shadow:none!important;
border-radius:0!important;
text-align:center;
font-family:inherit;
font-weight:800;
padding:0 8px;
}
.expenseExcelTable input:focus,.expenseExcelTable select:focus{
background:#eef6ff!important;
}
.expenseGroupRow td{
background:#eaf2fb!important;
color:#0b3154;
font-weight:900;
height:42px;
text-align:right;
padding:0 14px;
}
.expenseDetailRow td:first-child{
background:#f8fafc;
color:#0f3b63;
}
.expenseTotalRow td{
background:#fff7ed!important;
font-size:16px;
font-weight:900;
color:#dc2626;
padding:12px;
}

.expenseSheetEntry{
background:#f8fafc;
border:1px solid #dbe4ef;
border-radius:14px;
padding:14px;
margin:0 0 16px;
}
.expenseSheetTitle{
font-size:18px;
font-weight:900;
color:#0b1635;
margin-bottom:12px;
}
.expenseSheetGrid{
display:grid;
grid-template-columns:150px 180px 1.4fr 150px 140px 1fr 180px;
gap:10px;
align-items:end;
}
.expenseSheetGrid label{
display:flex;
flex-direction:column;
gap:7px;
font-weight:900;
font-size:13px;
color:#0f172a;
}
.expenseSheetGrid input,.expenseSheetGrid select{
height:42px;
border-radius:8px;
font-weight:800;
}
.expenseAddBtn{height:42px;padding:0 14px;white-space:nowrap}



.bottomActions{
display:flex;
gap:14px;
justify-content:center;
align-items:center;
margin-top:28px;
padding-top:18px;
border-top:1px solid #dbe2ea;
flex-wrap:wrap;
}
.bottomBtn{
height:48px;
min-width:170px;
border:none;
border-radius:12px;
font-weight:900;
font-size:16px;
cursor:pointer;
color:white;
font-family:inherit;
box-shadow:0 10px 22px rgba(15,23,42,.08);
}
.bottomBtn.green{background:#16a34a}
.bottomBtn.red{background:#dc2626}
.bottomBtn.blue{background:#2563eb}
.iconBtn.reject{background:#f97316;color:white}
.orangeBadge{background:#ffedd5;color:#9a3412}

.settingsCards{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:16px;
margin-bottom:18px;
}
.settingCard{
background:white;
border:1px solid #e2e8f0;
border-radius:18px;
padding:22px;
box-shadow:0 10px 25px rgba(15,23,42,.06);
display:flex;
flex-direction:column;
gap:8px;
}
.settingCard span{font-size:32px}
.settingCard b{font-size:18px;color:#0b1635}
.settingCard small{font-weight:800;color:#64748b}
.proSettingsGrid{grid-template-columns:repeat(3,1fr)}
.proSettingsGrid .span2{grid-column:span 2}
.proSettingsGrid select,.proSettingsGrid input{height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-family:inherit;font-weight:700;background:white}
.permissionGrid{display:flex;flex-direction:column;gap:12px}
.permissionRow{display:grid;grid-template-columns:170px 1fr 100px 100px 100px;gap:12px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;font-weight:800}
.permissionRow b{color:#0b3154}
.permissionRow span{color:#64748b}
.permissionRow label{display:flex;align-items:center;gap:6px}
.settingsActions{margin-top:18px}
@media(max-width:1100px){.settingsCards,.proSettingsGrid,.permissionRow{grid-template-columns:1fr}.proSettingsGrid .span2{grid-column:auto}}

@media(max-width:1100px){.statGrid,.twoCols,.miniGrid,.formGrid,.infoGrid,.closeControls,.expenseSheetGrid{grid-template-columns:1fr}.sidebar{width:230px}.content{padding:18px}}
 .printHeader{display:none}.printFooter{display:none}
.fileMini{display:inline-flex;align-items:center;justify-content:center;min-width:70px;height:32px;border-radius:8px;background:#eef2ff;color:#1e40af;font-weight:900;cursor:pointer}.fileMini input{display:none}


/* ===== Professional UI refinement ===== */
:root{--navy:#0f2742;--navy2:#173b5c;--slate:#334155;--line:#e2e8f0;--soft:#f8fafc;--emerald:#059669;--danger:#b91c1c;--amber:#b45309}
.app{background:linear-gradient(180deg,#f8fafc,#eef3f8);color:#162033}
.sidebar{background:linear-gradient(180deg,#0f2742,#132f4a);box-shadow:-10px 0 28px rgba(15,39,66,.16)}
.brandTitle{color:#f4c56a;letter-spacing:.2px}.brandSub{color:#cbd5e1}
.nav{color:#d8e6f3;border:1px solid transparent}.nav:hover{background:rgba(255,255,255,.07)}.nav.active{background:#244761;outline:0;border-color:rgba(255,255,255,.18)}
.header,.panel,.mini,.settingCard{border:1px solid var(--line);box-shadow:0 14px 30px rgba(15,39,66,.07)}
.header h1,.panelTitle{color:#10243a;letter-spacing:.1px}.header p{color:#64748b;font-size:14px}
.btn{border-radius:11px;box-shadow:none}.btn.dark{background:#173b5c}.btn.green{background:#0f8f63}.btn.red{background:#b91c1c}
th{background:#173b5c;color:#fff;font-weight:800}td{color:#243244}.tableWrap{border-color:var(--line)}tbody tr:hover td{background:#f1f5f9}
.stat{box-shadow:0 14px 28px rgba(15,39,66,.10);border-radius:16px}.greenText{color:#047857}.redText{color:#b91c1c}
.iconBtn{border-radius:9px;box-shadow:none}.view{background:#475569}.edit{background:#0f766e}.del{background:#b91c1c}.iconBtn.reject{background:#b45309}
.badge{border-radius:999px;padding:7px 13px}.orangeBadge{background:#fef3c7;color:#92400e}.blueBadge{background:#dbeafe;color:#1e3a8a}.greenBadge{background:#dcfce7;color:#166534}
.userContextCard{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px;margin:-8px 0 16px;display:flex;flex-direction:column;gap:8px}
.userContextCard span{font-size:12px;font-weight:900;color:#cbd5e1}.userContextCard select{height:38px;border:0;border-radius:10px;font-weight:800;color:#0f172a;padding:0 10px}
.accessDenied{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:18px;font-weight:900;text-align:center}
.userAddBox{display:grid;grid-template-columns:1.2fr 1fr 1fr auto;gap:14px;align-items:end;background:#f8fafc;border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:16px}
.userAddBox label{display:flex;flex-direction:column;gap:7px;font-weight:900;color:#334155}.userAddBox input,.userAddBox select{height:44px;border-radius:10px;border:1px solid #cbd5e1;font-weight:800}
.enhancedPermissions{gap:14px}.permissionRowPro{display:grid;grid-template-columns:240px 1fr 120px;gap:16px;align-items:start;background:#ffffff;border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 8px 22px rgba(15,39,66,.05)}
.userIdentity{display:flex;flex-direction:column;gap:10px}.userIdentity input,.userIdentity select{height:42px;border-radius:10px;border:1px solid #cbd5e1;font-weight:800}
.permissionChips{display:flex;gap:8px;flex-wrap:wrap}.permChip{display:inline-flex;align-items:center;gap:6px;padding:9px 12px;border-radius:999px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;font-weight:900;cursor:pointer}.permChip input{width:auto}.permChip.active{background:#e6f4ef;border-color:#b7e4d4;color:#047857}
.userControls{display:flex;flex-direction:column;gap:10px;align-items:stretch}.switchLine{display:flex;gap:7px;align-items:center;font-weight:900}.switchLine input{width:auto}.noteBox{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:14px;padding:14px;font-weight:900;margin-top:14px}
.rowActions{flex-wrap:wrap}.rowActions .iconBtn{min-width:58px}
@media(max-width:1100px){.userAddBox,.permissionRowPro{grid-template-columns:1fr}.userControls{flex-direction:row}}


/* ===== Data protection, required fields, and clear messages ===== */
.errorInput{border:1px solid #dc2626!important;background:#fff7f7!important;box-shadow:0 0 0 3px rgba(220,38,38,.08)!important}
.errorText{color:#dc2626;font-size:12.5px;font-weight:900;margin-top:4px;display:block;line-height:1.5}
.toastMessage{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;background:#991b1b;color:#fff;padding:12px 22px;border-radius:999px;font-weight:900;box-shadow:0 18px 36px rgba(15,23,42,.25)}
input::placeholder{color:#94a3b8;font-weight:700}

@media print{
.sidebar,.actions,.btn,.nav,.iconBtn,.noPrint{display:none!important}
.content{padding:0}.panel,.header{box-shadow:none;border:0}
.printHeader,.printFooter{display:flex!important;justify-content:space-between;align-items:center;margin:10px 0 18px;color:#111}
.printHeader{border-bottom:1px solid #ddd;padding-bottom:10px}
.printFooter{border-top:1px solid #ddd;padding-top:14px;margin-top:25px}
.tableWrap{border:0;overflow:visible}
table{min-width:auto;font-size:12px;page-break-inside:auto}
tr{page-break-inside:avoid;page-break-after:auto}
th{background:#fff!important;color:#111!important;border-bottom:1px solid #999}
td{border-bottom:1px solid #e5e7eb}
input,select{border:0!important;padding:0!important}
@page{size:A4;margin:12mm}
}

/* ===== Final Arabic typography and clean settings polish ===== */
body,
.app{
font-family:"Segoe UI",Tahoma,Arial,sans-serif;
letter-spacing:0;
}
.header{
padding:30px 32px;
}
.header h1{
font-size:34px;
line-height:1.35;
font-weight:900;
margin-bottom:8px;
}
.header p{
font-size:15px;
line-height:1.8;
font-weight:700;
color:#64748b;
}
.panelTitle{
font-size:24px;
font-weight:900;
line-height:1.4;
margin-bottom:18px;
position:relative;
padding-bottom:10px;
}
.panelTitle:after{
content:"";
position:absolute;
right:0;
bottom:0;
width:58px;
height:3px;
border-radius:999px;
background:#2563eb;
}
.settingsCards{
gap:18px;
}
.settingCard{
padding:24px;
border-radius:20px;
background:linear-gradient(180deg,#ffffff,#fbfdff);
transition:.18s ease;
}
.settingCard:hover{
transform:translateY(-2px);
box-shadow:0 18px 36px rgba(15,39,66,.10);
}
.settingCard span{
width:54px;
height:54px;
display:flex;
align-items:center;
justify-content:center;
border-radius:16px;
background:#eff6ff;
font-size:27px;
}
.settingCard b{
font-size:20px;
line-height:1.5;
font-weight:900;
color:#10243a;
}
.settingCard small{
font-size:14px;
line-height:1.7;
font-weight:700;
color:#64748b;
}
.settingsGrid label,
.proSettingsGrid label,
.userAddBox label{
font-size:15px;
line-height:1.6;
font-weight:900;
color:#26364a;
}
input,select,textarea,
.proSettingsGrid select,
.proSettingsGrid input,
.userAddBox input,
.userAddBox select{
border-color:#d8e1ec;
background:#fff;
color:#0f172a;
font-size:14px;
font-weight:750;
box-shadow:inset 0 1px 0 rgba(15,23,42,.02);
}
input:focus,select:focus,textarea:focus{
outline:none;
border-color:#3b82f6;
box-shadow:0 0 0 3px rgba(59,130,246,.12);
}
.sidebar{
padding-top:26px;
transition:width .22s ease,padding .22s ease;
}
.brand{
padding-bottom:26px;
margin-bottom:24px;
}
.brandTitle{
font-size:22px;
line-height:1.5;
font-weight:900;
}
.brandSub{
font-size:13px;
line-height:1.8;
font-weight:700;
}
.nav{
height:54px;
font-size:15px;
line-height:1.4;
font-weight:850;
margin-bottom:9px;
}
.nav span:last-child{
white-space:nowrap;
}
.btn,
.iconBtn,
.bottomBtn{
font-weight:900;
letter-spacing:0;
}
.tableWrap table th{
font-size:14px;
line-height:1.5;
}
.tableWrap table td{
font-size:14px;
line-height:1.6;
}
.badge{
font-size:13px;
font-weight:850;
}

.topUserBar{
position:fixed;
top:0;
right:270px;
left:0;
height:64px;
z-index:50;
background:rgba(255,255,255,.96);
backdrop-filter:blur(10px);
border-bottom:1px solid #dbe5ef;
display:flex;
align-items:center;
justify-content:flex-start;
gap:14px;
padding:10px 28px;
box-shadow:0 10px 26px rgba(15,23,42,.06);
direction:ltr;
}
.userMenuWrap{position:relative;margin-left:0;margin-right:auto;direction:rtl}
.userMenuButton{
height:44px;
border:1px solid #dbe5ef;
border-radius:14px;
background:#fff;
color:#10243a;
font-family:inherit;
font-weight:900;
padding:0 10px 0 12px;
display:flex;
align-items:center;
gap:10px;
cursor:pointer;
box-shadow:0 8px 20px rgba(15,23,42,.06);
min-width:190px;
}
.userMenuButton:hover{background:#f8fafc;border-color:#cbd5e1}
.userAvatar{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#0b2d4d,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;box-shadow:0 10px 20px rgba(29,78,216,.16);flex:none}
.userMenuText{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2;min-width:0}
.userMenuText b{font-size:14px;font-weight:900;color:#0f172a;white-space:nowrap;max-width:115px;overflow:hidden;text-overflow:ellipsis}
.userMenuText small{font-size:11px;font-weight:800;color:#64748b;margin-top:3px;white-space:nowrap}
.userChevron{font-size:18px;color:#64748b;margin-right:auto;line-height:1}
.userDropdown{
position:absolute;
top:52px;
left:0;
width:190px;
background:#fff;
border:1px solid #dbe5ef;
border-radius:14px;
box-shadow:0 18px 42px rgba(15,23,42,.16);
padding:8px;
z-index:90;
display:flex;
flex-direction:column;
gap:6px;
}
.userDropdown button{
height:40px;
border:0;
border-radius:10px;
background:#fff;
color:#10243a;
font-family:inherit;
font-weight:900;
cursor:pointer;
text-align:right;
padding:0 12px;
}
.userDropdown button:hover{background:#f1f5f9}
.userDropdown .logoutBtn{background:#fff1f2;color:#be123c}
.userDropdown .logoutBtn:hover{background:#ffe4e6}
.content{padding-top:92px!important}

.sidebarToggle{
position:absolute;
bottom:18px;
left:50%;
transform:translateX(-50%);
width:42px;
height:42px;
border:1px solid rgba(255,255,255,.18);
border-radius:14px;
background:rgba(255,255,255,.08);
color:#fff;
font-size:26px;
font-weight:900;
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
transition:.2s ease;
}
.sidebarToggle:hover{background:rgba(255,255,255,.16)}
.sidebar.collapsed{width:74px;padding:18px 10px}
.sidebar.collapsed .brandTitle,.sidebar.collapsed .brandSub{display:none}
.sidebar.collapsed .brand{height:50px;padding:0;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,.12)}
.sidebar.collapsed .brand:after{content:"م";width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#f8c76b,#f59e0b);color:#08223d;display:flex;align-items:center;justify-content:center;font-weight:900;margin:0 auto}
.sidebar.collapsed .nav{justify-content:center;padding:0;gap:0}
.sidebar.collapsed .nav span:last-child{display:none}
.sidebar.collapsed .nav span:first-child{font-size:18px}
.sidebar.collapsed ~ .content{padding-right:34px}
.app.sidebarCollapsed .topUserBar{right:74px}

@media(max-width:900px){
.topUserBar{right:0;height:64px;padding:10px 14px}
.userMenuWrap{margin-left:0;margin-right:auto}
.content{padding-top:92px!important}
}



.dailyBranchInfo{
display:flex;
gap:14px;
align-items:center;
flex-wrap:wrap;
margin:10px 0 14px;
padding:12px 14px;
border:1px solid #dbeafe;
background:#f8fbff;
border-radius:14px;
font-weight:800;
color:#0f2f52;
}
.dailyBranchInfo span{
background:white;
border:1px solid #e2e8f0;
border-radius:12px;
padding:9px 14px;
min-width:150px;
text-align:center;
}


.branchMiniInput{
  width:80px;
  min-height:34px;
  border:1px solid #dbe2ea;
  border-radius:12px;
  background:#fff;
  text-align:center;
  font-weight:900;
  color:#08223d;
  outline:none;
  padding:6px 8px;
}
.branchMiniInput:focus{
  border-color:#2563eb;
  box-shadow:0 0 0 3px rgba(37,99,235,.12);
}

.whatsappStatus{
display:inline-flex;
align-items:center;
justify-content:center;
padding:8px 12px;
border-radius:999px;
background:#ecfdf5;
color:#047857;
font-weight:800;
font-size:12px;
border:1px solid #bbf7d0;
}
.userIdentity input[readonly]{
background:#f8fafc;
color:#334155;
}
`;