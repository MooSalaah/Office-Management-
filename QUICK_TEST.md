# اختبار سريع للتطبيق - Quick Test Guide

## 🚀 اختبار سريع للتحديثات المباشرة

### 1. اختبار الاتصال

```bash
# اختبار Backend
curl https://engineering-office-backend.onrender.com/health

# اختبار API
curl https://engineering-office-backend.onrender.com/api/projects
```

### 2. اختبار التطبيق

1. افتح التطبيق في متصفحين مختلفين
2. سجل دخول في كلا المتصفحين
3. أنشئ مشروع جديد في المتصفح الأول
4. تأكد من ظهوره في المتصفح الثاني فوراً

### 3. اختبار التحديثات المباشرة

1. افتح صفحة المشاريع في كلا المتصفحين
2. أنشئ مشروع جديد في أحد المتصفحين
3. تأكد من ظهوره في المتصفح الآخر بدون إعادة تحميل

### 4. اختبار الإشعارات

1. أنشئ مهمة جديدة
2. تأكد من ظهور إشعار في المتصفح الآخر
3. اختبر إشعارات المهام المتأخرة

## 🔧 مؤشرات الحالة

### في Header

- **مؤشر الاتصال**: يظهر حالة الاتصال مع الخادم
- **الإشعارات**: تظهر الإشعارات الجديدة

### في صفحة الإعدادات (للمدير)

- **اختبار الاتصال**: يختبر الاتصال مع الخادم وقاعدة البيانات

## 🚨 مشاكل شائعة وحلولها

### التحديثات لا تظهر

1. تحقق من مؤشر الاتصال في Header
2. تأكد من أن Backend يعمل على Render
3. تحقق من متغيرات البيئة في Netlify

### خطأ في الاتصال

1. تحقق من URL Backend في متغيرات البيئة
2. تأكد من إعدادات CORS في Backend
3. تحقق من logs في Render

### البيانات لا تظهر

1. تحقق من اتصال MongoDB Atlas
2. تأكد من صحة connection string
3. تحقق من Network Access في MongoDB

## 📊 مراقبة الأداء

### في المتصفح

- افتح Developer Tools (F12)
- انتقل إلى Console tab
- راقب رسائل الاتصال والتحديثات

### في Render

- اذهب إلى Backend service
- تحقق من Logs tab
- راقب حالة الخدمة

### في Netlify

- اذهب إلى الموقع
- تحقق من Deploys tab
- راقب Build logs

## ✅ قائمة التحقق

- [ ] Backend يعمل على Render
- [ ] Frontend يعمل على Netlify
- [ ] MongoDB Atlas متصل
- [ ] التحديثات المباشرة تعمل
- [ ] الإشعارات تظهر
- [ ] مؤشر الاتصال يعمل
- [ ] اختبار الاتصال ينجح

## 🆘 في حالة المشاكل

1. **تحقق من Logs**

   - Render logs للـ Backend
   - Netlify logs للـ Frontend
   - Browser console للـ Frontend

2. **تحقق من متغيرات البيئة**

   - `NEXT_PUBLIC_API_URL` في Netlify
   - `MONGODB_URI` في Render
   - `CORS_ORIGIN` في Render

3. **تحقق من الاتصال**

   - MongoDB Atlas Network Access
   - Render service status
   - Netlify deployment status

4. **إعادة النشر**
   - Render: Manual Deploy
   - Netlify: Trigger Deploy

---

**ملاحظة**: تأكد من تحديث جميع URLs لتطابق إعداداتك الفعلية.
