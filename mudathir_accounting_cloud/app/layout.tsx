import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نظام مدثر المحاسبي",
  description: "منصة محاسبية سحابية للجوال والكمبيوتر",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
