# 🧪 اختبار سريع للربط - Render + Netlify

## ✅ حالة الخدمات

### 🔗 الروابط المباشرة:
- **Frontend:** https://theofficemanagemet.netlify.app/
- **Backend:** https://office-management-fsy7.onrender.com

## 🧪 خطوات الاختبار

### 1. اختبار Backend (Render)
```bash
# اختبار Health Check
curl https://office-management-fsy7.onrender.com/health

# اختبار API الرئيسي
curl https://office-management-fsy7.onrender.com/api/projects

# اختبار CORS
curl -H "Origin: https://theofficemanagemet.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://office-management-fsy7.onrender.com/api/projects
```

### 2. اختبار Frontend (Netlify)
1. اذهب إلى: https://theofficemanagemet.netlify.app/
2. تأكد من تحميل الصفحة بدون أخطاء
3. اختبر تسجيل الدخول
4. اختبر إنشاء مشروع جديد
5. اختبر التحديثات المباشرة

### 3. اختبار الربط
1. افتح Developer Tools (F12)
2. اذهب إلى Network tab
3. قم بعمل أي إجراء في التطبيق
4. تأكد من أن الطلبات تذهب إلى Render backend
5. تحقق من عدم وجود أخطاء CORS

## 🔧 إعدادات Netlify

### متغيرات البيئة المطلوبة:
```bash
NEXT_PUBLIC_API_URL=https://office-management-fsy7.onrender.com
NODE_ENV=production
NODE_VERSION=18
NPM_VERSION=9
```

### إعدادات البناء:
```bash
Build command: npm run build
Publish directory: .next
```

## 🔧 إعدادات Render

### متغيرات البيئة المطلوبة:
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### إعدادات الخدمة:
```bash
Build Command: npm install
Start Command: npm start
Environment: Node
```

## 🚨 استكشاف الأخطاء السريع

### إذا كان Backend لا يستجيب:
1. تحقق من Render logs
2. تأكد من أن الخدمة running
3. تحقق من متغيرات البيئة

### إذا كان Frontend لا يتصل بالـ API:
1. تحقق من متغير `NEXT_PUBLIC_API_URL`
2. تأكد من إعدادات CORS
3. تحقق من Network tab في المتصفح

### إذا كانت هناك أخطاء CORS:
1. تأكد من إضافة Netlify domain في CORS settings
2. تحقق من `netlify.toml` configuration
3. أعد نشر Backend إذا لزم الأمر

## 📊 مراقبة الأداء

### Render Monitoring:
- **Logs:** Render Dashboard → Logs tab
- **Metrics:** Render Dashboard → Metrics tab
- **Health:** Render Dashboard → Health tab

### Netlify Monitoring:
- **Build Logs:** Netlify Dashboard → Deploys tab
- **Function Logs:** Netlify Dashboard → Functions tab
- **Analytics:** Netlify Dashboard → Analytics tab

## 🔄 التحديثات التلقائية

- **GitHub Integration:** كل push إلى main branch سيؤدي إلى نشر تلقائي
- **Render:** سيتم إعادة بناء Backend تلقائياً
- **Netlify:** سيتم إعادة بناء Frontend تلقائياً

---

**آخر اختبار:** 26 يوليو 2025  
**الحالة:** ✅ جاهز للاستخدام
