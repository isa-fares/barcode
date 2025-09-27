# 🚀 نشر المشروع

## 📁 الملفات المطلوبة للرفع:

ارفع **محتويات** مجلد `dist` فقط إلى root النطاق:

```
📂 dist/
├── index.html          ← الملف الرئيسي
├── _redirects          ← إعدادات Netlify/Vercel  
├── .htaccess          ← إعدادات Apache/cPanel
├── vite.svg           ← الأيقونة
└── assets/            ← الملفات المبنية
    ├── index-B_sHjw1C.js
    ├── index-Ms5pqIxZ.css
    ├── vendor-CiW5Bwbg.js
    └── zxing-CpGoZ3qU.js
```

## 🌐 خطوات الرفع:

### للاستضافة العادية (cPanel/FTP):
1. اذهب لـ File Manager أو FTP
2. ادخل لمجلد `public_html` أو `www`
3. ارفع **جميع محتويات** مجلد `dist`
4. تأكد أن `index.html` في الـ root

### لـ Netlify:
1. اسحب مجلد `dist` لموقع Netlify
2. أو ربط GitHub repo واضبط Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### لـ Vercel:
1. `vercel --prod`
2. أو ربط GitHub repo

## ✅ التحقق من النجاح:

بعد الرفع، اذهب لـ: https://barcode-scanner.isafares.com/

يجب أن ترى:
- العنوان: "ماسح الباركود والـ QR"
- طلب إذن الكاميرا
- واجهة عربية كاملة
- تصميم responsive

## 🔧 حل المشاكل:

- **404 Error**: تأكد من وجود `.htaccess` أو `_redirects`
- **White Screen**: تحقق من Console للأخطاء
- **Camera Issues**: تأكد من HTTPS (مطلوب للكاميرا)

---

المشروع جاهز للرفع! 🎉