# دليل النشر - Deployment Guide

## 📋 المتطلبات المسبقة

### 1. حسابات الخدمات السحابية

- [GitHub](https://github.com) - لإدارة الكود
- [MongoDB Atlas](https://mongodb.com/atlas) - لقاعدة البيانات
- [Render](https://render.com) - لاستضافة الخادم الخلفي
- [Netlify](https://netlify.com) - لاستضافة الواجهة الأمامية

### 2. متطلبات النظام

- Node.js 18 أو أحدث
- Git
- حساب GitHub مع مستودع

## 🚀 خطوات النشر

### الخطوة 1: إعداد MongoDB Atlas

1. **إنشاء حساب MongoDB Atlas**

   - اذهب إلى [mongodb.com/atlas](https://mongodb.com/atlas)
   - أنشئ حساب جديد أو سجل دخول

2. **إنشاء Cluster**

   - اختر "Build a Database"
   - اختر "FREE" tier (M0)
   - اختر Cloud Provider (AWS/Google Cloud/Azure)
   - اختر Region (يفضل الأقرب لمنطقتك)
   - اضغط "Create"

3. **إعداد الأمان**

   - في "Security" → "Database Access"
   - اضغط "Add New Database User"
   - أنشئ مستخدم جديد مع كلمة مرور قوية
   - امنح صلاحيات "Read and write to any database"

4. **إعداد Network Access**

   - في "Security" → "Network Access"
   - اضغط "Add IP Address"
   - اختر "Allow Access from Anywhere" (0.0.0.0/0)
   - أو أضف IP محدد للخادم

5. **الحصول على Connection String**
   - في "Database" → "Connect"
   - اختر "Connect your application"
   - انسخ Connection String
   - استبدل `<password>` بكلمة مرور المستخدم
   - استبدل `<dbname>` باسم قاعدة البيانات (مثل: engineering-office)

### الخطوة 2: نشر Backend على Render

1. **إنشاء حساب Render**

   - اذهب إلى [render.com](https://render.com)
   - سجل دخول بحساب GitHub

2. **ربط المستودع**

   - اضغط "New" → "Web Service"
   - اربط مستودع GitHub
   - اختر المستودع الخاص بالتطبيق

3. **إعداد الخدمة**

   - **Name**: `engineering-office-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **إضافة متغيرات البيئة**

   - في "Environment" tab
   - أضف المتغيرات التالية:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engineering-office
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=production
   PORT=5000
   CORS_ORIGIN=https://your-app-name.netlify.app
   ```

5. **النشر**
   - اضغط "Create Web Service"
   - انتظر حتى يكتمل البناء والنشر
   - احفظ URL الخدمة (مثل: `https://engineering-office-backend.onrender.com`)

### الخطوة 3: نشر Frontend على Netlify

1. **إنشاء حساب Netlify**

   - اذهب إلى [netlify.com](https://netlify.com)
   - سجل دخول بحساب GitHub

2. **ربط المستودع**

   - اضغط "New site from Git"
   - اختر GitHub
   - اختر المستودع الخاص بالتطبيق

3. **إعداد البناء**

   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Base directory**: (اتركه فارغاً)

4. **إضافة متغيرات البيئة**

   - في "Site settings" → "Environment variables"
   - أضف المتغيرات التالية:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   NODE_ENV=production
   ```

5. **النشر**
   - اضغط "Deploy site"
   - انتظر حتى يكتمل البناء والنشر
   - احفظ URL الموقع (مثل: `https://engineering-office-system.netlify.app`)

### الخطوة 4: تحديث CORS في Backend

1. **تحديث CORS Origins**

   - في Render، اذهب إلى Backend service
   - في "Environment" tab
   - حدث `CORS_ORIGIN` ليشمل URL Netlify:

   ```
   CORS_ORIGIN=https://your-app-name.netlify.app
   ```

2. **إعادة النشر**
   - اضغط "Manual Deploy" → "Deploy latest commit"

## 🔧 اختبار النشر

### 1. اختبار Backend

```bash
# اختبار Health Check
curl https://your-backend-url.onrender.com/health

# اختبار API
curl https://your-backend-url.onrender.com/api/projects
```

### 2. اختبار Frontend

- افتح URL Netlify في المتصفح
- تأكد من أن التطبيق يعمل
- اختبر تسجيل الدخول
- اختبر إنشاء مشروع جديد

### 3. اختبار التحديثات المباشرة

- افتح التطبيق في متصفحين مختلفين
- أنشئ مشروع جديد في أحد المتصفحين
- تأكد من ظهوره في المتصفح الآخر فوراً

## 🚨 استكشاف الأخطاء

### مشاكل Backend

1. **خطأ في MongoDB Connection**

   ```
   Error: MongoDB connection failed
   ```

   **الحل**: تأكد من صحة MONGODB_URI وتحديث Network Access

2. **خطأ في CORS**

   ```
   CORS error: No 'Access-Control-Allow-Origin' header
   ```

   **الحل**: تأكد من تحديث CORS_ORIGIN في Render

3. **خطأ في Build**
   ```
   Build failed: npm install error
   ```
   **الحل**: تأكد من وجود package.json في مجلد backend

### مشاكل Frontend

1. **خطأ في Build**

   ```
   Build failed: Next.js build error
   ```

   **الحل**: تأكد من تثبيت جميع التبعيات وتحديث next.config.mjs

2. **خطأ في API Calls**

   ```
   Failed to fetch from API
   ```

   **الحل**: تأكد من صحة NEXT_PUBLIC_API_URL

3. **خطأ في التحديثات المباشرة**
   ```
   Realtime connection failed
   ```
   **الحل**: تأكد من أن Backend يعمل وأن CORS صحيح

### مشاكل عامة

1. **تطبيق لا يعمل**

   - تحقق من logs في Render و Netlify
   - تأكد من صحة متغيرات البيئة
   - تحقق من حالة الخدمات

2. **بيانات لا تظهر**
   - تحقق من اتصال MongoDB
   - تأكد من صحة API endpoints
   - تحقق من CORS settings

## 📊 مراقبة الأداء

### 1. Render Monitoring

- **Logs**: في Render dashboard → Logs tab
- **Metrics**: في Render dashboard → Metrics tab
- **Health Checks**: في Render dashboard → Health tab

### 2. Netlify Monitoring

- **Build Logs**: في Netlify dashboard → Deploys tab
- **Function Logs**: في Netlify dashboard → Functions tab
- **Analytics**: في Netlify dashboard → Analytics tab

### 3. MongoDB Atlas Monitoring

- **Database Metrics**: في MongoDB Atlas → Metrics tab
- **Logs**: في MongoDB Atlas → Logs tab
- **Performance**: في MongoDB Atlas → Performance tab

## 🔄 التحديثات المستمرة

### 1. إعدادات GitHub

- تأكد من أن المستودع public أو أن Render/Netlify لديه access
- استخدم branches منفصلة للتطوير
- استخدم Pull Requests للمراجعة

### 2. النشر التلقائي

- Render و Netlify يدعمان النشر التلقائي
- كل push إلى main branch سيؤدي إلى نشر تلقائي
- يمكن إعداد branches مختلفة لـ staging/production

### 3. Rollback

- في حالة حدوث مشاكل، يمكن العودة لإصدار سابق
- Render: في Deploys tab → Rollback
- Netlify: في Deploys tab → Rollback

## 🔒 الأمان

### 1. متغيرات البيئة

- لا تشارك متغيرات البيئة في الكود
- استخدم قيم قوية لـ JWT_SECRET
- تحديث كلمات المرور بانتظام

### 2. MongoDB Security

- استخدم كلمات مرور قوية
- قلل Network Access قدر الإمكان
- فعّل MongoDB Atlas Security Features

### 3. HTTPS

- Render و Netlify يدعمان HTTPS تلقائياً
- تأكد من استخدام HTTPS في جميع الاتصالات

## 📞 الدعم

### في حالة المشاكل:

1. تحقق من logs في Render و Netlify
2. تأكد من صحة متغيرات البيئة
3. اختبر الاتصال محلياً أولاً
4. راجع هذا الدليل مرة أخرى

### روابط مفيدة:

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

**ملاحظة**: تأكد من تحديث جميع URLs في هذا الدليل لتطابق إعداداتك الفعلية.
