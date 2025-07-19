# نظام إدارة المكاتب الهندسية - Engineering Office Management System

نظام إدارة متكامل للمكاتب الهندسية مبني بـ Next.js و React و TypeScript مع قاعدة بيانات MongoDB.

## 🚀 الميزات الرئيسية

- **لوحة تحكم تفاعلية** مع إحصائيات مباشرة
- **إدارة المشاريع** مع تتبع التقدم
- **إدارة العملاء** مع معلومات شاملة
- **إدارة المهام** مع نظام أولويات
- **إدارة مالية** مع تقارير مفصلة
- **نظام حضور** للموظفين
- **تحديثات مباشرة** بين جميع المستخدمين
- **واجهة عربية** بالكامل
- **تصميم متجاوب** لجميع الأجهزة

## 🛠️ التقنيات المستخدمة

### Frontend

- **Next.js 14** - إطار العمل الرئيسي
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - لكتابة كود آمن
- **Tailwind CSS** - للتصميم
- **Radix UI** - مكونات واجهة المستخدم
- **Lucide React** - الأيقونات

### Backend

- **Node.js** - بيئة التشغيل
- **Express.js** - إطار العمل
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM لـ MongoDB
- **JWT** - للمصادقة
- **bcryptjs** - لتشفير كلمات المرور

### الخدمات السحابية

- **MongoDB Atlas** - قاعدة البيانات السحابية
- **Render** - استضافة الخادم الخلفي
- **Netlify** - استضافة الواجهة الأمامية
- **GitHub** - إدارة الكود

## 📋 متطلبات النظام

- Node.js 18 أو أحدث
- npm أو pnpm
- حساب MongoDB Atlas
- حساب Render
- حساب Netlify

## 🚀 التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone https://github.com/your-username/engineering-office-system.git
cd engineering-office-system
```

### 2. تثبيت التبعيات

```bash
# تثبيت تبعيات Frontend
npm install

# تثبيت تبعيات Backend
cd backend
npm install
cd ..
```

### 3. إعداد متغيرات البيئة

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### Backend (.env)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.netlify.app
```

### 4. تشغيل التطبيق محلياً

#### Frontend

```bash
npm run dev
```

يتم تشغيل التطبيق على `http://localhost:3000`

#### Backend

```bash
cd backend
npm run dev
```

يتم تشغيل الخادم على `http://localhost:5000`

## 🌐 النشر

### 1. نشر Backend على Render

1. اربط مستودع GitHub بـ Render
2. اختر "Web Service"
3. اضبط الإعدادات:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: أضف متغيرات البيئة المطلوبة

### 2. نشر Frontend على Netlify

1. اربط مستودع GitHub بـ Netlify
2. اضبط الإعدادات:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `out`
   - **Environment Variables**: أضف متغيرات البيئة المطلوبة

### 3. إعداد MongoDB Atlas

1. أنشئ cluster جديد
2. أنشئ مستخدم لقاعدة البيانات
3. احصل على connection string
4. أضف IP addresses المسموح بها

## 🔄 التحديثات المباشرة

النظام يدعم التحديثات المباشرة بين جميع المستخدمين من خلال:

- **Server-Sent Events (SSE)** للتحديثات المباشرة
- **WebSocket fallback** عند الحاجة
- **Polling mode** كحل احتياطي
- **Connection monitoring** مع إعادة الاتصال التلقائي

### كيفية عمل التحديثات:

1. **عند إنشاء/تحديث/حذف أي عنصر** يتم إرسال تحديث للخادم
2. **الخادم يبث التحديث** لجميع العملاء المتصلين
3. **جميع المتصفحات تتلقى التحديث** وتحدث الواجهة تلقائياً
4. **مؤشر الاتصال** يظهر حالة الاتصال في الوقت الفعلي

## 🔧 استكشاف الأخطاء

### مشاكل التحديثات المباشرة:

1. **تأكد من أن Backend يعمل** على Render
2. **تحقق من متغيرات البيئة** في Netlify
3. **تأكد من إعدادات CORS** في Backend
4. **تحقق من logs** في Render و Netlify

### مشاكل قاعدة البيانات:

1. **تأكد من connection string** في Backend
2. **تحقق من إعدادات Network Access** في MongoDB Atlas
3. **تأكد من أن المستخدم لديه صلاحيات** مناسبة

### مشاكل النشر:

1. **تحقق من Build logs** في Netlify
2. **تأكد من أن جميع التبعيات** مثبتة
3. **تحقق من متغيرات البيئة** في كل من Render و Netlify

## 📊 مراقبة الأداء

### مؤشرات الأداء:

- **Connection Status**: حالة الاتصال مع الخادم
- **API Response Time**: وقت استجابة API
- **Database Connection**: حالة الاتصال بقاعدة البيانات
- **Real-time Updates**: عدد التحديثات المباشرة

### Logs:

- **Frontend**: Console logs في المتصفح
- **Backend**: Application logs في Render
- **Database**: MongoDB Atlas logs

## 🔒 الأمان

- **JWT Authentication** للمصادقة
- **bcryptjs** لتشفير كلمات المرور
- **CORS** لحماية الطلبات
- **Environment Variables** للمعلومات الحساسة
- **Input Validation** لجميع المدخلات

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. أنشئ Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للدعم التقني أو الاستفسارات:

- 📧 البريد الإلكتروني: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/engineering-office-system/issues)
- 📖 التوثيق: [Wiki](https://github.com/your-username/engineering-office-system/wiki)

---

**تم التطوير بواسطة مصطفى صلاح** 🚀
