# 🔐 متغيرات البيئة - Environment Variables

## ⚠️ تحذير أمني
**لا تشارك هذه القيم مع أي شخص ولا ترفعها على GitHub!**

## 🛠️ متغيرات Render (Backend)

### متغيرات مطلوبة:
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/engineering-office
JWT_SECRET=6e68ea4186e1c4f9be3043dcf6bab77678e8aa18373a00d0af3ae5ba96368974d5c5256c9d587aa362c6a42d66452eb585ed4c45a1e87baca7d1178bf2378cfd
```

### متغيرات اختيارية:
```bash
CORS_ORIGIN=https://theofficemanagemet.netlify.app
LOG_LEVEL=info
```

## 🌐 متغيرات Netlify (Frontend)

### متغيرات مطلوبة:
```bash
NEXT_PUBLIC_API_URL=https://office-management-fsy7.onrender.com
NODE_ENV=production
NODE_VERSION=18
NPM_VERSION=9
```

## 🔧 كيفية إضافة المتغيرات

### في Render:
1. اذهب إلى [Render Dashboard](https://dashboard.render.com/)
2. اختر مشروع Backend
3. اذهب إلى "Environment" tab
4. أضف كل متغير على حدة

### في Netlify:
1. اذهب إلى [Netlify Dashboard](https://app.netlify.com/)
2. اختر مشروع Frontend
3. اذهب إلى "Site settings" → "Environment variables"
4. أضف كل متغير على حدة

## 🔑 شرح المتغيرات

### JWT_SECRET
- **الغرض:** مفتاح تشفير لـ JSON Web Tokens
- **القيمة:** تم إنشاؤها باستخدام `crypto.randomBytes(64)`
- **الأمان:** 128 حرف عشوائي (64 bytes)
- **مثال:** `6e68ea4186e1c4f9be3043dcf6bab77678e8aa18373a00d0af3ae5ba96368974d5c5256c9d587aa362c6a42d66452eb585ed4c45a1e87baca7d1178bf2378cfd`

### MONGODB_URI
- **الغرض:** رابط الاتصال بقاعدة البيانات
- **التنسيق:** `mongodb+srv://username:password@cluster.mongodb.net/database_name`
- **مثال:** `mongodb+srv://admin:mypassword123@cluster0.abc123.mongodb.net/engineering-office`

### NEXT_PUBLIC_API_URL
- **الغرض:** رابط Backend API
- **القيمة:** `https://office-management-fsy7.onrender.com`
- **ملاحظة:** يجب أن يبدأ بـ `NEXT_PUBLIC_` ليكون متاحاً في Frontend

## 🚨 نصائح أمنية

1. **لا تشارك JWT_SECRET** مع أي شخص
2. **استخدم كلمات مرور قوية** لـ MongoDB
3. **حدث المتغيرات بانتظام** للأمان
4. **احتفظ بنسخة احتياطية** من المتغيرات في مكان آمن
5. **لا ترفع ملفات .env** على GitHub

## 🔄 إنشاء JWT_SECRET جديد

إذا أردت إنشاء JWT_SECRET جديد:

```bash
# في Terminal
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# أو في PowerShell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## 📞 في حالة المشاكل

إذا واجهت مشاكل في الاتصال:
1. تحقق من صحة MONGODB_URI
2. تأكد من أن JWT_SECRET تم إضافته بشكل صحيح
3. تحقق من Network Access في MongoDB Atlas
4. تأكد من أن جميع المتغيرات مكتوبة بشكل صحيح

---

**آخر تحديث:** 26 يوليو 2025  
**مستوى الأمان:** 🔒 عالي 