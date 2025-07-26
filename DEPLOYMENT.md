# 🚀 دليل النشر والربط - نظام إدارة المكاتب الهندسية

## 📋 نظرة عامة على النظام

### 🔗 الروابط المباشرة
- **Frontend (Netlify):** https://theofficemanagemet.netlify.app/
- **Backend (Render):** https://office-management-fsy7.onrender.com
- **GitHub Repository:** https://github.com/MooSalaah/Office-Management-

## 🛠️ إعدادات الربط

### 1. متغيرات البيئة (Environment Variables)

#### Netlify Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://office-management-fsy7.onrender.com
NODE_ENV=production
NODE_VERSION=18
NPM_VERSION=9
```

#### Render Environment Variables:
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 2. إعدادات CORS

تم تكوين Backend للسماح بالطلبات من Netlify domain:
```javascript
// في backend/server.js
app.use(cors({
  origin: [
    'https://theofficemanagemet.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

## 🔧 خطوات النشر

### نشر Frontend على Netlify:

1. **ربط GitHub Repository:**
   - اذهب إلى [Netlify Dashboard](https://app.netlify.com/)
   - اختر "New site from Git"
   - اختر GitHub وحدد repository: `MooSalaah/Office-Management-`

2. **إعدادات البناء:**
   ```bash
   Build command: npm run build
   Publish directory: .next
   ```

3. **متغيرات البيئة:**
   - اذهب إلى Site settings > Environment variables
   - أضف المتغيرات المذكورة أعلاه

### نشر Backend على Render:

1. **ربط GitHub Repository:**
   - اذهب إلى [Render Dashboard](https://dashboard.render.com/)
   - اختر "New Web Service"
   - اختر GitHub وحدد repository

2. **إعدادات الخدمة:**
   ```bash
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```

## 🔄 اختبار الربط

### 1. اختبار الاتصال بالـ API:
```bash
curl https://office-management-fsy7.onrender.com/api/health
```

### 2. اختبار Frontend:
- اذهب إلى https://theofficemanagemet.netlify.app/
- تأكد من أن التطبيق يعمل بشكل صحيح
- اختبر تسجيل الدخول والوظائف الأساسية

## 🚨 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ CORS:**
   - تأكد من إضافة Netlify domain في إعدادات CORS
   - تحقق من متغيرات البيئة

2. **خطأ في الاتصال بالـ API:**
   - تحقق من صحة رابط Render
   - تأكد من أن Backend يعمل بشكل صحيح

3. **مشاكل في البناء:**
   - تحقق من إصدار Node.js (يجب أن يكون 18+)
   - تأكد من تثبيت جميع dependencies

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues: https://github.com/MooSalaah/Office-Management-/issues
- Email: support@example.com

---

**آخر تحديث:** 26 يوليو 2025
**الإصدار:** V21.4
