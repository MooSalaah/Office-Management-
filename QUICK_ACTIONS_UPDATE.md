# تحديث الإجراءات السريعة في الصفحة الرئيسية

## التغييرات المطلوبة

تم تحديث الإجراءات السريعة في الصفحة الرئيسية (`app/dashboard/page.tsx`) لتستخدم نفس الكروت الموجودة في صفحات المشاريع والمالية بدلاً من الكروت المحلية.

### التغييرات المطبقة:

1. **زر "إضافة مشروع جديد"**:
   - تم تغيير `onClick` من `setIsProjectDialogOpen(true)` إلى `router.push("/projects?action=create")`
   - سيتم توجيه المستخدم إلى صفحة المشاريع مع فتح كارت إنشاء المشروع تلقائياً

2. **زر "تسجيل معاملة مالية"**:
   - تم تغيير `onClick` من `setIsTransactionDialogOpen(true)` إلى `router.push("/finance?action=create")`
   - سيتم توجيه المستخدم إلى صفحة المالية مع فتح كارت إضافة معاملة جديدة تلقائياً

3. **إزالة الكروت غير المستخدمة**:
   - تم حذف `ProjectDialog` من الصفحة الرئيسية
   - تم حذف `TransactionDialog` من الصفحة الرئيسية
   - تم إزالة المتغيرات المرتبطة بها

### التحديثات في الصفحات المستهدفة:

#### صفحة المشاريع (`app/projects/page.tsx`):
- تم إضافة منطق لفتح كارت إنشاء المشروع تلقائياً عند الوصول للصفحة مع معامل `action=create`
- تم إضافة `const actionParam = searchParams.get("action")`
- تم تغيير `const [isDialogOpen, setIsDialogOpen] = useState(false)` إلى `const [isDialogOpen, setIsDialogOpen] = useState(actionParam === "create")`

#### صفحة المالية (`app/finance/page.tsx`):
- تم إضافة منطق لفتح كارت إضافة معاملة جديدة تلقائياً عند الوصول للصفحة مع معامل `action=create`
- تم إضافة `import { useSearchParams } from "next/navigation"`
- تم إضافة `const actionParam = useSearchParams().get("action")`
- تم تغيير `const [isDialogOpen, setIsDialogOpen] = useState(false)` إلى `const [isDialogOpen, setIsDialogOpen] = useState(actionParam === "create")`

## النتيجة:

الآن عندما يضغط المستخدم على:
- **"إضافة مشروع جديد"** في الإجراءات السريعة → سيتم توجيهه إلى صفحة المشاريع مع فتح كارت إنشاء المشروع تلقائياً
- **"تسجيل معاملة مالية"** في الإجراءات السريعة → سيتم توجيهه إلى صفحة المالية مع فتح كارت إضافة معاملة جديدة تلقائياً

هذا يضمن استخدام نفس الكروت المتقدمة الموجودة في الصفحات المخصصة بدلاً من الكروت المبسطة في الصفحة الرئيسية. 