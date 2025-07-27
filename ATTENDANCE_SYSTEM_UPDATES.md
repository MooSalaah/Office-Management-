# تحديثات نظام الحضور والانصراف

## ✅ المتطلبات المطبقة

### 1. إرسال إشعارات للمدير عند تسجيل حضور/انصراف الموظفين

#### أ. دالة `notifyManager`:
```typescript
const notifyManager = async (action: 'checkin' | 'checkout', session: string) => {
  if (currentUser?.role === 'admin') return; // المدير لا يرسل إشعار لنفسه
  
  try {
    const sessionText = session === 'morning' ? 'صباحية' : 'مسائية';
    const actionText = action === 'checkin' ? 'حضور' : 'انصراف';
    
    await addNotification({
      userId: "admin", // إرسال لجميع المديرين
      title: `تسجيل ${actionText}`,
      message: `${currentUser?.name} قام بتسجيل ${actionText} في الفترة ${sessionText}`,
      type: "attendance",
      actionUrl: `/attendance`,
      triggeredBy: currentUser?.id || "",
      isRead: false,
    });
  } catch (error) {
    console.error('Error sending notification to manager:', error);
  }
};
```

#### ب. استدعاء الإشعارات في `handleCheckIn` و `handleCheckOut`:
```typescript
// في handleCheckIn
handleCreateAttendance(newRecord);
notifyManager('checkin', session);

// في handleCheckOut
handleUpdateAttendance(existingRecord.id, updatedRecord);
notifyManager('checkout', session);
```

### 2. إضافة سجلات الحضور للمدير

- **للمدير**: يتم عرض جميع سجلات الحضور لجميع الموظفين
- **للموظفين العاديين**: يتم عرض سجلات الحضور الشخصية فقط

```typescript
const filteredRecords = attendanceRecords
  .filter((record) => record.date === selectedDate)
  .filter((record) => 
    // للمدير: عرض جميع السجلات، للموظفين: عرض سجلاتهم فقط
    currentUser?.role === 'admin' ? 
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) :
      record.userId === currentUser?.id
  )
```

### 3. تعديل الكروت الإحصائية بناءً على دور المستخدم

#### أ. دالة `getEmployeeMonthlyStats`:
```typescript
const getEmployeeMonthlyStats = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = monthEnd.getDate();
  
  // سجلات الحضور للموظف الحالي في الشهر الحالي
  const employeeMonthlyRecords = attendanceRecords.filter(r => {
    const recordDate = new Date(r.date);
    return r.userId === currentUser?.id && 
           recordDate.getMonth() === currentMonth && 
           recordDate.getFullYear() === currentYear;
  });

  // أيام الحضور
  const presentDays = employeeMonthlyRecords.reduce((acc, r) => acc.add(r.date), new Set()).size;
  
  // أيام الغياب
  const absentDays = totalDays - presentDays;
  
  // إجمالي الساعات الشهرية
  const totalMonthlyHours = Math.ceil(employeeMonthlyRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0));
  
  // ساعات إضافية
  const overtimeHours = Math.round(employeeMonthlyRecords.reduce((sum, r) => sum + Math.max(0, (r.totalHours || 0) - 9), 0));

  return {
    presentDays,
    absentDays,
    totalMonthlyHours,
    overtimeHours
  };
};
```

#### ب. دالة `renderStatsCards`:
```typescript
const renderStatsCards = () => {
  // للمدير: عرض إحصائيات جميع الموظفين
  if (currentUser?.role === 'admin') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* كروت المدير: الحاضرون، المتأخرون، الغائبون، إجمالي الساعات، ساعات إضافية */}
      </div>
    );
  }
  
  // للموظفين العاديين: عرض إحصائياتهم الشخصية الشهرية
  const employeeStats = getEmployeeMonthlyStats();
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* كروت الموظف: أيام الحضور، أيام الغياب، إجمالي الساعات، ساعات إضافية */}
    </div>
  );
};
```

### 4. الكروت الإحصائية للمدير (5 كروت):
1. **الحاضرون**: عدد الموظفين الحاضرين اليوم
2. **المتأخرون**: عدد الموظفين المتأخرين اليوم
3. **الغائبون**: عدد الموظفين الغائبين اليوم
4. **إجمالي الساعات**: إجمالي ساعات العمل اليوم
5. **ساعات إضافية**: إجمالي الساعات الإضافية اليوم

### 5. الكروت الإحصائية للموظفين العاديين (4 كروت):
1. **أيام الحضور**: عدد أيام الحضور في الشهر الحالي
2. **أيام الغياب**: عدد أيام الغياب في الشهر الحالي
3. **إجمالي الساعات**: إجمالي ساعات العمل الشهرية
4. **ساعات إضافية**: إجمالي الساعات الإضافية الشهرية

### 6. حساب الإحصائيات الشهرية للموظفين

#### أ. حساب أيام الحضور:
- يتم حساب عدد الأيام المختلفة التي سجل فيها الموظف حضور في الشهر الحالي

#### ب. حساب أيام الغياب:
- إجمالي أيام الشهر - أيام الحضور

#### ج. حساب إجمالي الساعات:
- مجموع جميع ساعات العمل المسجلة في الشهر الحالي

#### د. حساب الساعات الإضافية:
- الساعات التي تزيد عن 9 ساعات في اليوم الواحد

### 7. تحديث واجهة المستخدم

#### أ. عنوان الصفحة:
- **للمدير**: "سجل الحضور" - "تفاصيل حضور الموظفين"
- **للموظفين**: "سجل الحضور الشخصي" - "تفاصيل حضورك الشخصي"

#### ب. عرض السجلات:
- **للمدير**: جميع سجلات الحضور مع إمكانية البحث
- **للموظفين**: سجلات الحضور الشخصية فقط

## 🔧 التقنيات المستخدمة

- **React Hooks**: `useState`, `useEffect`
- **TypeScript**: للتحقق من الأنواع
- **Context API**: لإدارة الحالة العامة
- **Notifications System**: لإرسال الإشعارات
- **Date Manipulation**: لحساب الإحصائيات الشهرية
- **Conditional Rendering**: لعرض محتوى مختلف حسب دور المستخدم

## 📋 ملخص التحديثات

### ✅ تم تطبيق جميع المتطلبات:

1. **إشعارات المدير**: يتم إرسال إشعار للمدير عند تسجيل حضور/انصراف أي موظف
2. **سجلات الحضور**: المدير يرى جميع السجلات، الموظفون يرون سجلاتهم فقط
3. **الكروت الإحصائية**: 
   - المدير: 5 كروت (الحاضرون، المتأخرون، الغائبون، إجمالي الساعات، ساعات إضافية)
   - الموظفون: 4 كروت (أيام الحضور، أيام الغياب، إجمالي الساعات، ساعات إضافية)
4. **الإحصائيات الشهرية**: حساب دقيق لأيام الحضور والغياب والساعات للموظفين
5. **واجهة مستخدم محسنة**: عرض محتوى مختلف حسب دور المستخدم

### 🎯 النتائج:

- **للمدير**: رؤية شاملة لجميع الموظفين مع إشعارات فورية
- **للموظفين**: رؤية شخصية لإحصائياتهم الشهرية
- **نظام إشعارات**: تنبيهات فورية للمدير عند تسجيل الحضور/الانصراف
- **إحصائيات دقيقة**: حساب صحيح للأيام والساعات الشهرية

جميع المتطلبات تم تطبيقها بنجاح! 🎉 