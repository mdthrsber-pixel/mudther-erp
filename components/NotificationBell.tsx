
'use client';

import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button className="relative bg-white border rounded-xl p-3 shadow-sm">
      <Bell size={20} />
      <span className="absolute -top-1 -left-1 bg-red-600 text-white text-xs rounded-full px-1">
        3
      </span>
    </button>
  );
}
