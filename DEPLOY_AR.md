# دليل تشغيل ونشر AI CV Analyzer (نسخة مستقلة تمامًا)

المشروع بقى مستقل 100%: مفيش أي اعتماد على Manus (لا تسجيل دخول، ولا قاعدة بيانات،
ولا سيرفر AI بتاعهم). التحليل بقى بيتم عن طريق Anthropic API مباشرة بمفتاحك انت.
سجل الـ CVs (History) بيتخزن على جهاز المستخدم نفسه (AsyncStorage) — مفيش قاعدة بيانات لازمة خالص.

للتطبيق يشتغل على تليفون حقيقي، محتاج تعمل 3 حاجات بالترتيب:

---

## 1) نشر السيرفر الخلفي (Backend)

التطبيق بيكلم سيرفر Node.js (Express + tRPC) عشان يحلل الـ CV بالذكاء الاصطناعي.
لازم تنشره على استضافة بتديله رابط عام (https://...) عشان التليفون يقدر يوصله.

### أسهل خيار: Render.com (فيه باقة مجانية)
1. اعمل حساب على https://render.com واربطه بحساب GitHub بتاعك (ارفع المشروع ده على GitHub repo أول حاجة).
2. New → Web Service → اختار الـ repo.
3. Build Command: `pnpm install && pnpm build`
4. Start Command: `pnpm start`
5. في Environment Variables ضيف:
   - `ANTHROPIC_API_KEY` = مفتاحك من https://console.anthropic.com/
   - `ANTHROPIC_MODEL` = `claude-sonnet-5` (أو سيبه فاضي هياخد القيمة الافتراضية دي)
   - `NODE_ENV` = `production`
6. بعد ما ينشر، هتاخد رابط زي: `https://ai-cv-analyzer-api.onrender.com`
7. جرب: افتح `https://your-url.onrender.com/api/health` المفروض ترجع `{"ok":true,...}`

### بدائل تانية: Railway.app أو Fly.io — نفس الفكرة بالظبط (build: `pnpm install && pnpm build`, start: `pnpm start`).

> ملاحظة: الباقات المجانية أحيانًا "بتنام" السيرفر لو مفيش طلبات لفترة، وأول طلب بعد النوم بياخد شوية ثواني زيادة — طبيعي.

---

## 2) اربط التطبيق بالسيرفر

في ملف `eas.json` (وأثناء التطوير المحلي في `.env`)، غيّر القيمة:

```
EXPO_PUBLIC_API_BASE_URL=https://your-actual-backend-url.onrender.com
```

(من غير `/` في الآخر). ده اللي بيخلي التطبيق يعرف يكلم مين.

---

## 3) بناء ملف APK قابل للتثبيت (عن طريق EAS Build المجاني)

```bash
npm install -g eas-cli
eas login                      # سجل دخول بحساب Expo (مجاني، اعمل واحد لو مفيش)
eas build:configure            # أول مرة بس - هيربط المشروع بحساب Expo بتاعك
eas build -p android --profile preview
```

- هياخد شوية دقايق (بناء على سيرفرات Expo السحابية، مجاني للاستخدام الشخصي بحد معين شهريًا).
- في الآخر هيديك رابط تحميل مباشر للـ APK.
- **حمّل الرابط من متصفح Chrome على التليفون مباشرة** (مش من الإيميل — الإيميلات بتمنع فتح ملفات APK في أندرويد الحديث).
- لو التليفون رفض التثبيت: فعّل "Install unknown apps" لتطبيق Chrome من إعدادات الأندرويد، واحذف أي نسخة قديمة من التطبيق قبل التثبيت.

---

## تشغيل محلي للتجربة قبل النشر

```bash
cp .env.example .env
# افتح .env وحط ANTHROPIC_API_KEY بتاعك
pnpm install
pnpm dev
```

هيفتح المتصفح على `http://localhost:8081` وتقدر تجرب كل حاجة قبل ما تعمل build نهائي.

---

## اللي اتغيّر في الكود

- **السيرفر بقى بيكلم Anthropic API مباشرة** (`server/_core/llm.ts`) بدل `forge.manus.im`.
- **اتشال تسجيل الدخول والـ OAuth بتاع Manus بالكامل** — التطبيق مفيهوش تسجيل دخول أصلاً (مكونش بيستخدم في أي شاشة).
- **اتشالت قاعدة البيانات (MySQL/Drizzle)** — مكانتش مستخدمة في أي ميزة فعلية غير جدول مستخدمين فاضي.
- اتشالت كل ملفات الـ Manus الداخلية غير المستخدمة (voice transcription, notifications, image generation, storage proxy).
- `pnpm check` (TypeScript) و `pnpm test` (24 اختبار) شغالين 100% نضاف.
