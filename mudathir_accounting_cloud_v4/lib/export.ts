import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportExcel(name: string, rows: any[]) {
  const ws = XLSX.utils.json_to_sheet(rows || []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name);
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportPdf(name: string, rows: any[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.text(name, 14, 15);
  const columns = rows?.length ? Object.keys(rows[0]) : [];
  const body = (rows || []).map((r) => columns.map((c) => String(r[c] ?? "")));
  autoTable(doc, { head: [columns], body, startY: 22 });
  doc.save(`${name}.pdf`);
}
