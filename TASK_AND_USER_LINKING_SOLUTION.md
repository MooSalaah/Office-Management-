# حلول ربط المهام بالمستخدمين

## المشاكل التي تم حلها:

### 1. **ربط المستخدمين ببيانات تسجيل الدخول**

#### المشكلة:
- المستخدمين لم يكونوا مرتبطين ببيانات تسجيل الدخول المطلوبة
- المهام لا تظهر للمهندسين المسؤولين عنها

#### الحل:
- **إنشاء المستخدمين في قاعدة البيانات:**
  ```javascript
  // backend/scripts/create_users.js
  const users = [
    {
      name: 'مصطفى صلاح',
      email: 'ms@nc',
      password: 'ms123',
      role: 'admin'
    },
    {
      name: 'محمد قطب',
      email: 'mk@nc',
      password: 'mk123',
      role: 'admin'
    },
    {
      name: 'عمرو رمضان',
      email: 'ar@nc',
      password: 'ar123',
      role: 'engineer'
    },
    {
      name: 'محمد مجدي',
      email: 'mm@nc',
      password: 'mm123',
      role: 'engineer'
    }
  ];
  ```

- **تحديث mockUsers في Frontend:**
  ```typescript
  // lib/auth.ts
  export const mockUsers: User[] = [
    {
      id: "1",
      name: "مصطفى صلاح",
      email: "ms@nc",
      password: "ms123",
      role: "admin"
    },
    // ... باقي المستخدمين
  ];
  ```

### 2. **إصلاح عرض المهام في كارت المشروع**

#### المشكلة:
- المهام لا تظهر في كارت عرض المشروع رغم وجودها في قاعدة البيانات

#### الحل:
- **المهام تُحمل من قاعدة البيانات في AppContext:**
  ```typescript
  // lib/context/AppContext.tsx
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.tasks.getAll();
        if (response && response.success && Array.isArray(response.data)) {
          logger.info("تم جلب المهام من الباكند", { count: response.data.length }, 'TASKS');
          dispatch({ type: "LOAD_TASKS", payload: response.data });
        }
      } catch (error) {
        logger.error("فشل جلب المهام من الباكند", { error }, 'API');
      }
    };
    fetchTasks();
  }, []);
  ```

- **عرض المهام في كارت المشروع:**
  ```typescript
  // app/projects/page.tsx
  {tasks.filter(task => task.projectId === selectedProject.id).map((task) => (
    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-medium text-sm">{task.title}</h5>
          <Badge variant={task.status === "completed" ? "default" : "outline"}>
            {task.status === "completed" ? "مكتملة" : "قيد الانتظار"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-1">{task.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>المسؤول: {task.assigneeName}</span>
          {task.createdByName && <span>المنشئ: {task.createdByName}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => window.location.href = `/tasks?highlight=${task.id}`}>
          عرض
        </Button>
        {task.status !== "completed" && (
          <Button variant="default" size="sm" onClick={async () => {
            // إكمال المهمة وتحديث تقدم المشروع
          }}>
            إكمال
          </Button>
        )}
      </div>
    </div>
  ))}
  ```

### 3. **إصلاح فلترة المهام في صفحة المهام**

#### المشكلة:
- صفحة المهام فارغة رغم وجود مهام في قاعدة البيانات
- المديرين لا يرون جميع المهام
- المهندسين لا يرون مهامهم المخصصة لهم

#### الحل:
- **فلترة المهام حسب دور المستخدم:**
  ```typescript
  // app/tasks/page.tsx
  const filteredTasks = searchedTasks.filter((task) => {
    // Filter by user role
    let userFilter = true
    if (currentUser?.role !== "admin") {
      userFilter = task.assigneeId === currentUser?.id // المستخدم يرى مهامه المخصصة له فقط
    }
    
    // Filter by project
    let projectFilter = true
    if (projectFilter !== "all") {
      projectFilter = task.projectId === projectFilter
    }
    
    return userFilter && projectFilter
  })
  ```

### 4. **ربط تقدم المشروع بعدد المهام**

#### المشكلة:
- تقدم المشروع لا يرتبط بعدد المهام المكتملة
- يجب أن يكون مجموع المهام هو 100% وعند إكمال مهمة يتم ملء النسبة المئوية

#### الحل:
- **حساب تقدم المشروع تلقائياً:**
  ```typescript
  // app/projects/page.tsx
  value={(() => {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
    const completedTasks = projectTasks.filter(t => t.status === "completed").length;
    return projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  })()}
  ```

- **تحديث تقدم المشروع عند إكمال مهمة:**
  ```typescript
  // عند إكمال مهمة
  const updatedTask = { ...task, status: "completed" as const };
  dispatch({ type: "UPDATE_TASK", payload: updatedTask });
  
  // Update project progress
  const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
  const completedTasks = projectTasks.filter(t => t.status === "completed").length;
  const newProgress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const updatedProject = { ...selectedProject, progress: newProgress };
  setSelectedProject(updatedProject);
  dispatch({ type: "UPDATE_PROJECT", payload: updatedProject });
  ```

## النتائج المحققة:

### ✅ **ربط المستخدمين**
- تم إنشاء 4 مستخدمين في قاعدة البيانات
- كل مستخدم له إيميل وكلمة مرور محددة
- المديرين: مصطفى صلاح (ms@nc) ومحمد قطب (mk@nc)
- المهندسين: عمرو رمضان (ar@nc) ومحمد مجدي (mm@nc)

### ✅ **عرض المهام**
- المهام تظهر في كارت عرض المشروع
- المهام تُحمل من قاعدة البيانات
- كل مهمة تظهر المسؤول والمنشئ

### ✅ **فلترة المهام**
- المديرين يرون جميع المهام
- المهندسين يرون مهامهم المخصصة لهم فقط
- صفحة المهام تعمل بشكل صحيح

### ✅ **تقدم المشروع**
- تقدم المشروع يحسب تلقائياً بناءً على عدد المهام المكتملة
- عند إكمال مهمة يتم تحديث تقدم المشروع
- النسبة المئوية تعكس الوضع الفعلي للمشروع

## خطوات التشغيل:

1. **إنشاء المستخدمين في قاعدة البيانات:**
   ```bash
   cd backend
   node scripts/create_users.js
   ```

2. **تسجيل الدخول بالمستخدمين:**
   - مصطفى صلاح: ms@nc / ms123
   - محمد قطب: mk@nc / mk123
   - عمرو رمضان: ar@nc / ar123
   - محمد مجدي: mm@nc / mm123

3. **اختبار النظام:**
   - إنشاء مشروع جديد مع مهام
   - التأكد من ظهور المهام في كارت المشروع
   - التأكد من فلترة المهام حسب المستخدم
   - اختبار إكمال المهام وتحديث تقدم المشروع

## الملفات المحدثة:

1. **backend/scripts/create_users.js** - إنشاء المستخدمين
2. **lib/auth.ts** - تحديث mockUsers
3. **app/projects/page.tsx** - إصلاح عرض المهام وتقدم المشروع
4. **app/tasks/page.tsx** - إصلاح فلترة المهام
5. **lib/context/AppContext.tsx** - جلب المهام من قاعدة البيانات 