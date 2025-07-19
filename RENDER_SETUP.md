# إعداد Render - Render Setup Guide

## ✅ Backend يعمل الآن!

الرابط: `https://engineering-office-backend.onrender.com`

## 🔧 إضافة متغيرات البيئة في Render

### 1. اذهب إلى Render Dashboard

- افتح [dashboard.render.com](https://dashboard.render.com)
- اختر خدمة `engineering-office-backend`

### 2. إضافة متغيرات البيئة

- اذهب إلى **Environment** tab
- اضغط **Add Environment Variable**
- أضف المتغيرات التالية:

#### متغيرات مطلوبة:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engineering-office
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=5000
```

#### متغيرات اختيارية:

```
CORS_ORIGIN=https://your-app-name.netlify.app
```

### 3. إعادة النشر

- بعد إضافة المتغيرات، اضغط **Manual Deploy**
- اختر **Deploy latest commit**

## 🔍 اختبار Backend

### اختبار Health Check:

```bash
curl https://engineering-office-backend.onrender.com/health
```

### اختبار API:

```bash
curl https://engineering-office-backend.onrender.com/api/projects
```

## 📊 مراقبة Logs

- اذهب إلى **Logs** tab في Render
- راقب الرسائل للتأكد من:
  - ✅ MongoDB connected successfully
  - ✅ Server running on port 5000
  - ❌ أي أخطاء في الاتصال

## 🚨 مشاكل شائعة

### 1. MongoDB Connection Failed

**الحل**: تأكد من صحة MONGODB_URI

### 2. JWT_SECRET not found

**الحل**: أضف JWT_SECRET في Environment Variables

### 3. CORS errors

**الحل**: تأكد من إضافة CORS_ORIGIN الصحيح

## 🎯 الخطوة التالية

بعد إعداد Render بنجاح:

1. **نشر Frontend على Netlify**
2. **اختبار التحديثات المباشرة**
3. **مراقبة الأداء**

---

**ملاحظة**: تأكد من تحديث MONGODB_URI بقيم MongoDB Atlas الفعلية.
