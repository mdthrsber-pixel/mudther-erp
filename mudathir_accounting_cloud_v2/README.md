# منصة مدثر المحاسبية السحابية V2

نسخة مطورة تعمل على الجوال والكمبيوتر وتشمل:
- شاشة دخول
- Dashboard متجاوب
- CRUD للفروع والإيرادات والمصروفات
- صلاحيات مبدئية
- قاعدة بيانات PostgreSQL عبر Supabase
- تصدير Excel
- PWA قابلة للتثبيت على الجوال
- ملف SQL كامل

## التشغيل
1. افتح Supabase وأنشئ مشروع جديد.
2. نفّذ ملف: `database/schema.sql`
3. انسخ `.env.example` إلى `.env.local`
4. ضع:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
5. شغل:
```bash
npm install
npm run dev
```

## النشر
- Vercel للواجهة
- Supabase للقاعدة
- لاحقاً يمكن نقله إلى VPS كامل
