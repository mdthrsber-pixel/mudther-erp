import { NextResponse } from "next/server";

const ULTRAMSG_INSTANCE = "instance176346";
const ULTRAMSG_TOKEN = "rml2zlkz0lt2e2vy";

export async function POST(req: Request) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: "رقم الجوال أو نص الرسالة غير موجود" }, { status: 400 });
    }

    const form = new URLSearchParams();
    form.append("token", ULTRAMSG_TOKEN);
    form.append("to", String(to));
    form.append("body", String(body));

    const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: data?.error || "فشل إرسال واتساب", details: data }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "خطأ غير معروف" }, { status: 500 });
  }
}
