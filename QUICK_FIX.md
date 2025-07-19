;;;;# 🔧 إصلاح سريع - Backend يحتاج متغيرات البيئة

## 🚨 المشكلة الحالية:

- ✅ Backend يعمل على Render
- ❌ **لا توجد متغيرات البيئة** (MONGODB_URI, JWT_SECRET)
- ❌ خطأ 500 عند استدعاء API

## 🎯 الحل السريع:

### 1. اذهب إلى Render Dashboard:

```
https://dashboard.render.com/web/srv-d1tjdtruibrs73fibs7g
```

### 2. أضف متغيرات البيئة:

- اذهب إلى **Environment** tab
- اضغط **Add Environment Variable**

#### أضف هذه المتغيرات:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engineering-office
JWT_SECRET=your-super-secret-jwt-key-here-2024
NODE_ENV=production
PORT=5000
```

### 3. إعادة النشر:

- اضغط **Manual Deploy**
- اختر **Deploy latest commit**

## 🔍 اختبار بعد الإصلاح:

```bash
# اختبار Health
curl https://engineering-office-backend.onrender.com/health

# اختبار API
curl https://engineering-office-backend.onrender.com/api/projects
```

## 📊 مراقبة Logs:

- اذهب إلى **Logs** tab
- راقب الرسائل:
  - ✅ "MongoDB connected successfully"
  - ✅ "Server running on port 5000"

## 🚨 إذا لم تكن لديك MONGODB_URI:

### خيار 1: إنشاء MongoDB Atlas جديد

1. اذهب إلى [mongodb.com](https://mongodb.com)
2. أنشئ حساب جديد
3. أنشئ cluster جديد
4. احصل على connection string

### خيار 2: استخدام MongoDB محلي (للاختبار)

```
MONGODB_URI=mongodb://localhost:27017/engineering-office
```

---

**ملاحظة**: بعد إضافة المتغيرات، سيتم إعادة تشغيل الخدمة تلقائياً.
