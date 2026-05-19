export function FormInput({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <label className="block mb-3">
      <span className="block text-sm text-slate-600 mb-1">{label}</span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-xl p-3 w-full"
      />
    </label>
  );
}

export function FormSelect({ label, value, onChange, options }: any) {
  return (
    <label className="block mb-3">
      <span className="block text-sm text-slate-600 mb-1">{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="border rounded-xl p-3 w-full">
        <option value="">اختر</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
