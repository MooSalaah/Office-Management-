# Complete Engineering Office Management System - Comprehensive AI Development Prompt

## 🎯 Project Overview

Create a comprehensive **Engineering Office Management System** specifically designed for engineering firms in Saudi Arabia. This is a full-stack web application that manages all aspects of engineering office operations including projects, clients, tasks, finances, attendance, and user management with real-time updates and role-based access control.

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 14** - Main framework with App Router
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling and design
- **Radix UI** - Advanced UI components
- **Lucide React** - Icons
- **Chart.js** - Data visualization
- **React Hook Form** - Form management
- **Context API** - State management
- **Next-themes** - Dark/Light theme support

### Backend Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Socket.io** - Real-time communication

### Deployment & Cloud Services
- **Netlify** - Frontend hosting and deployment
- **Render** - Backend hosting and deployment
- **MongoDB Atlas** - Cloud database hosting
- **Firebase** - Real-time features and notifications

## 👥 User Roles & Permissions System

### 1. المدير (Admin)
**Full Access to All Modules:**
- إدارة جميع المستخدمين والأدوار
- إدارة المشاريع والمهام
- إدارة العملاء
- إدارة المالية والمعاملات
- إدارة الحضور والانصراف
- إدارة الإعدادات العامة
- عرض جميع التقارير والإحصائيات
- إدارة الإشعارات

### 2. المهندس (Engineer)
**Project & Task Management:**
- عرض المشاريع المخصصة له
- إدارة المهام المخصصة له
- تحديث تقدم المشاريع
- إدارة المهام الفرعية
- عرض تقارير المشاريع
- تسجيل الحضور والانصراف
- عرض الإشعارات المتعلقة به

### 3. المحاسب (Accountant)
**Financial Management:**
- إدارة جميع المعاملات المالية
- إدارة المدفوعات والمقبوضات
- إعداد التقارير المالية
- إدارة الضرائب
- عرض إحصائيات المالية
- إدارة العملاء من الناحية المالية
- تسجيل الحضور والانصراف

### 4. موارد بشرية (HR)
**Employee Management:**
- إدارة الموظفين
- إدارة الحضور والانصراف
- إعداد تقارير الموظفين
- إدارة الإجازات
- إدارة الرواتب
- عرض إحصائيات الموظفين
- إدارة الأدوار والصلاحيات

### 5. مستخدم عادي (Employee)
**Limited Access:**
- عرض المهام المخصصة له
- تسجيل الحضور والانصراف
- عرض معلوماته الشخصية
- عرض الإشعارات المتعلقة به
- عرض التقارير الشخصية

## 🧭 Navigation & Page Structure

### Navigation Bar (`components/layout/navbar.tsx`)
```typescript
// Navigation Items based on User Role
const navigationItems = {
  admin: [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "المشاريع", href: "/projects", icon: FolderOpen },
    { name: "العملاء", href: "/clients", icon: Users },
    { name: "المهام", href: "/tasks", icon: CheckSquare },
    { name: "المالية", href: "/finance", icon: DollarSign },
    { name: "الحضور", href: "/attendance", icon: Clock },
    { name: "الإعدادات", href: "/settings", icon: Settings }
  ],
  engineer: [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "المشاريع", href: "/projects", icon: FolderOpen },
    { name: "المهام", href: "/tasks", icon: CheckSquare },
    { name: "الحضور", href: "/attendance", icon: Clock }
  ],
  accountant: [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "المالية", href: "/finance", icon: DollarSign },
    { name: "العملاء", href: "/clients", icon: Users },
    { name: "الحضور", href: "/attendance", icon: Clock }
  ],
  hr: [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "الموظفين", href: "/employees", icon: Users },
    { name: "الحضور", href: "/attendance", icon: Clock },
    { name: "الإعدادات", href: "/settings", icon: Settings }
  ],
  employee: [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    { name: "المهام", href: "/tasks", icon: CheckSquare },
    { name: "الحضور", href: "/attendance", icon: Clock }
  ]
}
```

### Dashboard Quick Actions
```typescript
// Quick Action Cards that navigate to specific pages
const quickActions = [
  {
    title: "إضافة مشروع جديد",
    description: "إنشاء مشروع جديد",
    icon: FolderPlus,
    href: "/projects/new",
    color: "blue"
  },
  {
    title: "إنشاء مهمة",
    description: "إضافة مهمة جديدة",
    icon: PlusSquare,
    href: "/tasks/new",
    color: "green"
  },
  {
    title: "إضافة عميل",
    description: "إضافة عميل جديد",
    icon: UserPlus,
    href: "/clients/new",
    color: "purple"
  },
  {
    title: "تسجيل معاملة",
    description: "تسجيل معاملة مالية",
    icon: Receipt,
    href: "/finance/new",
    color: "orange"
  },
  {
    title: "تسجيل حضور",
    description: "تسجيل الحضور أو الانصراف",
    icon: Clock,
    href: "/attendance/checkin",
    color: "red"
  }
]
```

## 📊 Database Schema & Relationships

### User Model (Enhanced)
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  avatar: String,
  role: String (enum: ['admin', 'engineer', 'accountant', 'hr', 'employee']),
  isActive: Boolean (default: true),
  permissions: [String], // Dynamic permissions
  monthlySalary: Number (default: 5000),
  workingHours: {
    morningStart: String (default: '08:00'),
    morningEnd: String (default: '12:00'),
    eveningStart: String (default: '13:00'),
    eveningEnd: String (default: '17:00')
  },
  department: String,
  position: String,
  hireDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model (Enhanced)
```javascript
{
  _id: ObjectId,
  name: String (required),
  clientId: ObjectId (ref: 'Client'),
  clientName: String,
  type: String,
  status: String (enum: ['in-progress', 'completed', 'on-hold', 'cancelled']),
  team: [{
    userId: ObjectId (ref: 'User'),
    userName: String,
    role: String
  }],
  assignedEngineerId: ObjectId (ref: 'User'),
  assignedEngineerName: String,
  startDate: Date,
  endDate: Date,
  startDateHijri: String,
  price: Number (default: 0),
  downPayment: Number (default: 0),
  remainingBalance: Number (default: 0),
  importance: String (enum: ['low', 'medium', 'high']),
  description: String,
  progress: Number (default: 0),
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    completed: Boolean
  }],
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  notes: String
}
```

### Task Model (Enhanced)
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  projectId: ObjectId (ref: 'Project'),
  projectName: String,
  assigneeId: ObjectId (ref: 'User'),
  assigneeName: String,
  priority: String (enum: ['low', 'medium', 'high']),
  status: String (enum: ['todo', 'in-progress', 'completed', 'cancelled']),
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  attachments: [String],
  comments: [{
    userId: ObjectId (ref: 'User'),
    userName: String,
    comment: String,
    createdAt: Date
  }],
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Client Model (Enhanced)
```javascript
{
  _id: ObjectId,
  name: String (required),
  phone: String,
  email: String,
  address: String,
  contactPerson: String,
  contactPhone: String,
  contactEmail: String,
  projects: [ObjectId (ref: 'Project')],
  totalProjects: Number (default: 0),
  totalRevenue: Number (default: 0),
  outstandingBalance: Number (default: 0),
  status: String (enum: ['active', 'inactive', 'prospect']),
  notes: String,
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model (Enhanced)
```javascript
{
  _id: ObjectId,
  type: String (enum: ['income', 'expense'], required),
  amount: Number (required),
  description: String,
  clientId: ObjectId (ref: 'Client'),
  clientName: String,
  projectId: ObjectId (ref: 'Project'),
  projectName: String,
  category: String,
  subCategory: String,
  paymentMethod: String (enum: ['cash', 'transfer', 'pos', 'check', 'credit']),
  date: Date,
  dueDate: Date,
  status: String (enum: ['completed', 'pending', 'draft', 'cancelled']),
  invoiceNumber: String,
  receiptNumber: String,
  taxAmount: Number,
  netAmount: Number,
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance Model (Enhanced)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  userName: String (required),
  date: Date (required),
  checkIn: {
    time: Date,
    location: String,
    device: String,
    ipAddress: String
  },
  checkOut: {
    time: Date,
    location: String,
    device: String,
    ipAddress: String
  },
  session: String (enum: ['morning', 'evening']),
  regularHours: Number (default: 0),
  lateHours: Number (default: 0),
  overtimeHours: Number (default: 0),
  totalHours: Number (default: 0),
  status: String (enum: ['present', 'absent', 'late', 'overtime', 'half-day']),
  notes: String,
  overtimePay: Number (default: 0),
  isManualEntry: Boolean (default: false),
  manualEntryBy: ObjectId (ref: 'User'),
  approvedBy: ObjectId (ref: 'User'),
  approvedAt: Date,
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model (Enhanced)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  title: String (required),
  message: String (required),
  type: String (enum: ['info', 'success', 'warning', 'error']),
  category: String (enum: ['task', 'project', 'finance', 'attendance', 'system']),
  isRead: Boolean (default: false),
  relatedId: ObjectId,
  relatedType: String,
  priority: String (enum: ['low', 'medium', 'high']),
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Data Relationships & Business Logic

### 1. Project-Task Relationship
```typescript
// When creating a task
- Task must be associated with a project
- Project progress updates automatically based on task completion
- Task assignee must be a team member of the project
- Task completion affects project timeline

// Business Logic
- Project progress = (completed tasks / total tasks) * 100
- Project status changes based on task completion
- Notifications sent to project team when tasks are created/updated
```

### 2. Project-Client Relationship
```typescript
// When creating a project
- Project must be associated with a client
- Client's total projects count updates automatically
- Client's total revenue updates based on project payments
- Client status affects project visibility

// Business Logic
- Client total projects = count of active projects
- Client total revenue = sum of all project payments
- Client outstanding balance = sum of unpaid project amounts
```

### 3. Project-Finance Relationship
```typescript
// When creating financial transactions
- Transaction can be linked to specific project
- Project balance updates automatically
- Project payment schedule affects cash flow
- Project profitability calculated from transactions

// Business Logic
- Project remaining balance = project price - sum of payments
- Project profitability = income - expenses
- Payment schedule affects project status
```

### 4. Task-User Relationship
```typescript
// When assigning tasks
- Task must have an assignee
- User's workload affects task assignment
- Task completion affects user performance
- User notifications for task updates

// Business Logic
- User workload = sum of active task hours
- User performance = completed tasks / assigned tasks
- Task priority affects user notification priority
```

### 5. Attendance-User Relationship
```typescript
// When recording attendance
- Attendance linked to specific user
- User's working hours affect attendance calculation
- Overtime calculated based on user's schedule
- Monthly reports generated per user

// Business Logic
- Regular hours = standard working hours
- Late hours = actual check-in - scheduled check-in
- Overtime hours = actual check-out - scheduled check-out
- Monthly salary calculation includes overtime
```

## 🔄 Real-time Updates & Notifications

### Real-time Implementation
```typescript
// Server-Sent Events (SSE) for real-time updates
const realtimeUpdates = {
  // Project updates
  projectCreated: (project) => notifyTeamMembers(project.team),
  projectUpdated: (project) => notifyStakeholders(project),
  projectCompleted: (project) => notifyClient(project.clientId),
  
  // Task updates
  taskAssigned: (task) => notifyAssignee(task.assigneeId),
  taskCompleted: (task) => notifyProjectManager(task.projectId),
  taskOverdue: (task) => notifyAssignee(task.assigneeId),
  
  // Financial updates
  paymentReceived: (transaction) => notifyProjectManager(transaction.projectId),
  paymentOverdue: (transaction) => notifyAccountant(),
  
  // Attendance updates
  checkInRecorded: (attendance) => notifyHR(attendance.userId),
  checkOutRecorded: (attendance) => notifyHR(attendance.userId),
  
  // System notifications
  systemMaintenance: () => notifyAllUsers(),
  newAnnouncement: (announcement) => notifyAllUsers()
}
```

### Notification System
```typescript
// Notification types and delivery
const notificationTypes = {
  task: {
    assigned: "تم تعيين مهمة جديدة لك",
    completed: "تم إكمال المهمة",
    overdue: "المهمة متأخرة"
  },
  project: {
    created: "تم إنشاء مشروع جديد",
    updated: "تم تحديث المشروع",
    completed: "تم إكمال المشروع"
  },
  finance: {
    paymentReceived: "تم استلام دفعة",
    paymentOverdue: "دفعة متأخرة",
    invoiceGenerated: "تم إنشاء فاتورة"
  },
  attendance: {
    checkIn: "تم تسجيل الحضور",
    checkOut: "تم تسجيل الانصراف",
    late: "تسجيل حضور متأخر"
  }
}
```

## 🎨 UI/UX Requirements

### Theme System
```typescript
// Dark/Light theme implementation
const themeConfig = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    muted: '#F3F4F6'
  },
  dark: {
    background: '#1F2937',
    foreground: '#F9FAFB',
    primary: '#60A5FA',
    secondary: '#9CA3AF',
    accent: '#34D399',
    muted: '#374151'
  }
}
```

### Responsive Design
```typescript
// Mobile-first responsive design
const breakpoints = {
  mobile: '320px - 768px',
  tablet: '768px - 1024px',
  desktop: '1024px+'
}

// Mobile-specific features
const mobileFeatures = {
  swipeGestures: true,
  touchOptimized: true,
  collapsibleNavigation: true,
  bottomNavigation: true,
  pullToRefresh: true
}
```

## 📱 Page Structure & Components

### 1. Dashboard Page (`/app/dashboard/page.tsx`)
```typescript
// Role-based dashboard content
const dashboardContent = {
  admin: {
    statistics: ['totalProjects', 'totalClients', 'totalRevenue', 'totalEmployees'],
    charts: ['revenueTrend', 'projectStatus', 'employeePerformance', 'attendanceSummary'],
    quickActions: ['addProject', 'addClient', 'addTask', 'addTransaction'],
    recentActivities: ['allActivities']
  },
  engineer: {
    statistics: ['myProjects', 'myTasks', 'completedTasks', 'pendingTasks'],
    charts: ['taskProgress', 'projectTimeline', 'workload'],
    quickActions: ['addTask', 'updateProgress', 'checkIn'],
    recentActivities: ['myActivities']
  },
  accountant: {
    statistics: ['totalIncome', 'totalExpenses', 'netProfit', 'outstandingPayments'],
    charts: ['financialTrend', 'expenseBreakdown', 'paymentStatus'],
    quickActions: ['addTransaction', 'generateInvoice', 'paymentReminder'],
    recentActivities: ['financialActivities']
  }
}
```

### 2. Projects Page (`/app/projects/page.tsx`)
```typescript
// Project management interface
const projectFeatures = {
  listView: {
    filters: ['status', 'client', 'engineer', 'date'],
    search: true,
    pagination: true,
    export: true
  },
  cardView: {
    projectCards: true,
    progressIndicators: true,
    quickActions: true
  },
  detailView: {
    projectInfo: true,
    teamMembers: true,
    tasks: true,
    finances: true,
    timeline: true
  }
}
```

### 3. Tasks Page (`/app/tasks/page.tsx`)
```typescript
// Task management interface
const taskFeatures = {
  kanbanBoard: {
    columns: ['todo', 'in-progress', 'completed'],
    dragAndDrop: true,
    taskCards: true
  },
  listView: {
    filters: ['status', 'priority', 'assignee', 'project'],
    search: true,
    bulkActions: true
  },
  calendarView: {
    monthlyView: true,
    weeklyView: true,
    taskTimeline: true
  }
}
```

### 4. Finance Page (`/app/finance/page.tsx`)
```typescript
// Financial management interface
const financeFeatures = {
  overview: {
    incomeExpense: true,
    profitLoss: true,
    cashFlow: true,
    outstandingPayments: true
  },
  transactions: {
    list: true,
    filters: ['type', 'category', 'date', 'status'],
    search: true,
    bulkActions: true
  },
  reports: {
    monthlyReport: true,
    yearlyReport: true,
    projectReport: true,
    clientReport: true
  }
}
```

### 5. Attendance Page (`/app/attendance/page.tsx`)
```typescript
// Attendance management interface
const attendanceFeatures = {
  calendar: {
    monthlyView: true,
    colorCoded: true,
    clickToView: true,
    export: true
  },
  daily: {
    employeeList: true,
    checkInOut: true,
    hoursCalculation: true,
    overtime: true
  },
  reports: {
    monthlyReport: true,
    employeeReport: true,
    overtimeReport: true,
    lateReport: true
  }
}
```

### 6. Settings Page (`/app/settings/page.tsx`)
```typescript
// System settings interface
const settingsFeatures = {
  company: {
    basicInfo: true,
    logo: true,
    contactInfo: true,
    businessHours: true
  },
  users: {
    userList: true,
    roleManagement: true,
    permissions: true,
    activityLogs: true
  },
  system: {
    theme: true,
    language: true,
    notifications: true,
    security: true
  }
}
```

## 🔧 Backend API Structure

### Authentication APIs
```javascript
// POST /api/auth/login
// POST /api/auth/register (Admin only)
// GET /api/auth/me
// POST /api/auth/logout
// POST /api/auth/refresh-token
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
```

### Project APIs
```javascript
// GET /api/projects - Get all projects with filters
// POST /api/projects - Create new project
// GET /api/projects/:id - Get project details
// PUT /api/projects/:id - Update project
// DELETE /api/projects/:id - Delete project
// GET /api/projects/:id/tasks - Get project tasks
// GET /api/projects/:id/finances - Get project finances
// PUT /api/projects/:id/progress - Update project progress
```

### Task APIs
```javascript
// GET /api/tasks - Get all tasks with filters
// POST /api/tasks - Create new task
// GET /api/tasks/:id - Get task details
// PUT /api/tasks/:id - Update task
// DELETE /api/tasks/:id - Delete task
// PUT /api/tasks/:id/status - Update task status
// PUT /api/tasks/:id/assign - Assign task to user
// POST /api/tasks/:id/comments - Add task comment
```

### Client APIs
```javascript
// GET /api/clients - Get all clients
// POST /api/clients - Create new client
// GET /api/clients/:id - Get client details
// PUT /api/clients/:id - Update client
// DELETE /api/clients/:id - Delete client
// GET /api/clients/:id/projects - Get client projects
// GET /api/clients/:id/finances - Get client finances
```

### Finance APIs
```javascript
// GET /api/transactions - Get all transactions
// POST /api/transactions - Create new transaction
// GET /api/transactions/:id - Get transaction details
// PUT /api/transactions/:id - Update transaction
// DELETE /api/transactions/:id - Delete transaction
// GET /api/finance/reports - Get financial reports
// POST /api/finance/export - Export financial data
```

### Attendance APIs
```javascript
// GET /api/attendance - Get attendance records
// POST /api/attendance/checkin - Record check-in
// POST /api/attendance/checkout - Record check-out
// GET /api/attendance/:id - Get attendance details
// PUT /api/attendance/:id - Update attendance
// GET /api/attendance/reports - Get attendance reports
// POST /api/attendance/export - Export attendance data
```

### User APIs
```javascript
// GET /api/users - Get all users
// POST /api/users - Create new user
// GET /api/users/:id - Get user details
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user
// PUT /api/users/:id/role - Update user role
// PUT /api/users/:id/permissions - Update user permissions
```

### Notification APIs
```javascript
// GET /api/notifications - Get user notifications
// POST /api/notifications - Create notification
// PUT /api/notifications/:id/read - Mark as read
// DELETE /api/notifications/:id - Delete notification
// GET /api/notifications/unread-count - Get unread count
```

## 🔄 Real-time Features Implementation

### Server-Sent Events (SSE)
```javascript
// Real-time updates implementation
app.get('/api/realtime', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial connection
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Store client connection
  clients.push(res);

  // Handle client disconnect
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Broadcast function
function broadcast(data) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}
```

### WebSocket Fallback
```javascript
// WebSocket implementation for real-time updates
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Handle project updates
  socket.on('projectUpdate', (data) => {
    socket.broadcast.to(`project_${data.projectId}`).emit('projectUpdated', data);
  });

  // Handle task updates
  socket.on('taskUpdate', (data) => {
    socket.broadcast.to(`user_${data.assigneeId}`).emit('taskUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

## 🎯 Implementation Requirements

### 1. File Structure
```
project/
├── app/
│   ├── page.tsx (Login)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── layout.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── tasks/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── clients/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── finance/
│   │   ├── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── attendance/
│   │   ├── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── checkin/
│   │       └── page.tsx
│   └── settings/
│       ├── page.tsx
│       ├── users/
│       │   └── page.tsx
│       └── company/
│           └── page.tsx
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── ui/
│   │   ├── cards/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   └── pages/
│       ├── dashboard/
│       ├── projects/
│       ├── tasks/
│       ├── clients/
│       ├── finance/
│       ├── attendance/
│       └── settings/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── realtime.ts
│   ├── utils.ts
│   └── types.ts
└── backend/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── utils/
    └── server.js
```

### 2. Data Flow
```typescript
// Real-time data flow
User Action → Frontend → API → Database → Real-time Update → All Connected Users

// Example: Creating a task
1. User fills task form
2. Frontend validates data
3. API creates task in database
4. Database triggers real-time update
5. All connected users receive notification
6. Dashboard updates automatically
```

### 3. Error Handling
```typescript
// Comprehensive error handling
const errorHandling = {
  frontend: {
    formValidation: true,
    networkErrors: true,
    userFeedback: true,
    fallbackUI: true
  },
  backend: {
    inputValidation: true,
    databaseErrors: true,
    authenticationErrors: true,
    logging: true
  }
}
```

## 🚀 Deployment & Configuration

### Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Backend (.env)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-app.netlify.app
```

### Deployment Commands
```bash
# Frontend (Netlify)
npm run build
npm run export

# Backend (Render)
npm install
npm start
```

## 📋 Success Criteria

### Functional Requirements
- ✅ All CRUD operations work correctly
- ✅ Real-time updates function properly
- ✅ User permissions are enforced
- ✅ Data relationships are maintained
- ✅ Reports generate accurately
- ✅ Dark/Light theme works
- ✅ Mobile responsiveness works

### Performance Requirements
- ✅ Page load time < 3 seconds
- ✅ API response time < 500ms
- ✅ Real-time updates < 1 second delay
- ✅ Mobile responsiveness works
- ✅ Offline functionality available

### Security Requirements
- ✅ Authentication is secure
- ✅ Data is encrypted
- ✅ Input validation prevents attacks
- ✅ User permissions are respected
- ✅ Audit logs are maintained

## 🎯 Final Notes

This system should be built with **scalability** in mind, allowing for future enhancements such as:
- Multi-tenant architecture
- Mobile app development
- Advanced AI features
- Integration with external systems
- Advanced reporting and analytics

**Important Requirements:**
1. All pages must be functional and accessible
2. Real-time updates must work across all users
3. Data relationships must be properly maintained
4. Role-based access control must be strictly enforced
5. Dark/Light theme must work on all pages
6. Mobile responsiveness must be perfect
7. All APIs must be properly implemented
8. Database relationships must be correctly established
9. Notifications must be real-time
10. File uploads and exports must work

**Remember**: This is a production system that will handle real business data, so prioritize **security**, **reliability**, and **user experience** throughout the development process.

The system should be ready for immediate deployment on Netlify (Frontend) and Render (Backend) with MongoDB Atlas as the database. 