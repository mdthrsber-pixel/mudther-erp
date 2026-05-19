import { NextRequest, NextResponse } from "next/server";

const ULTRAMSG_INSTANCE_ID = "instance176346";
const ULTRAMSG_TOKEN = "rml2zlkz0lt2e2vy";

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: "رقم الجوال ونص الرسالة مطلوبان" }, { status: 400 });
    }

    const cleanPhone = String(to).replace(/[^0-9]/g, "");
    const whatsappNumber = cleanPhone.startsWith("966") ? cleanPhone : cleanPhone.startsWith("0") ? `966${cleanPhone.slice(1)}` : cleanPhone;

    const response = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: ULTRAMSG_TOKEN,
        to: whatsappNumber,
        body,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: "فشل إرسال رسالة واتساب", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "خطأ غير معروف أثناء إرسال واتساب" },
      { status: 500 }
    );
  }
}
