export default function Modal({ title, open, onClose, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="text-slate-500">إغلاق</button>
        </div>
        {children}
      </div>
    </div>
  );
}
