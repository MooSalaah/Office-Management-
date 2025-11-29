# Comprehensive Engineering Office Management System - AI Development Prompt

## Project Overview

Create a comprehensive **Engineering Office Management System** specifically designed for engineering firms in Saudi Arabia. This is a full-stack web application that manages all aspects of engineering office operations including projects, clients, tasks, finances, attendance, and user management.

## 🎯 Core Requirements

### Primary Features
- **Interactive Dashboard** with real-time statistics
- **Project Management** with progress tracking
- **Client Management** with comprehensive information
- **Task Management** with priority system
- **Financial Management** with detailed reports
- **Employee Attendance System**
- **Real-time Updates** between all users
- **Fully Arabic Interface** with RTL support
- **Responsive Design** for all devices

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
- **Zustand/Context API** - State management

### Backend Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Cloud Services
- **MongoDB Atlas** - Cloud database
- **Render** - Backend hosting
- **Netlify** - Frontend hosting
- **Firebase** - Authentication and real-time features

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  avatar: String,
  role: String (enum: ['admin', 'engineer', 'accountant', 'employee']),
  isActive: Boolean (default: true),
  permissions: [String],
  monthlySalary: Number (default: 5000),
  workingHours: {
    morningStart: String (default: '08:00'),
    morningEnd: String (default: '12:00'),
    eveningStart: String (default: '13:00'),
    eveningEnd: String (default: '17:00')
  },
  createdAt: Date
}
```

### Project Model
```javascript
{
  name: String (required),
  client: String (required),
  clientId: String,
  type: String,
  status: String (enum: ['in-progress', 'completed', 'on-hold']),
  team: [String],
  startDate: String,
  startDateHijri: String,
  price: Number (default: 0),
  downPayment: Number (default: 0),
  remainingBalance: Number (default: 0),
  assignedEngineerId: String,
  assignedEngineerName: String,
  importance: String (enum: ['low', 'medium', 'high']),
  description: String,
  progress: Number (default: 0),
  createdBy: String,
  createdAt: String,
  updatedAt: String,
  endDate: String,
  notes: String
}
```

### Task Model
```javascript
{
  title: String (required),
  description: String,
  assigneeId: String,
  assigneeName: String,
  projectId: String,
  projectName: String,
  priority: String (enum: ['low', 'medium', 'high']),
  status: String (enum: ['todo', 'in-progress', 'completed']),
  dueDate: String,
  createdBy: String,
  createdByName: String,
  createdAt: String,
  updatedAt: String
}
```

### Attendance Model
```javascript
{
  userId: String (required),
  userName: String (required),
  checkIn: String,
  checkOut: String,
  session: String (enum: ['morning', 'evening']),
  regularHours: Number (default: 0),
  lateHours: Number (default: 0),
  overtimeHours: Number (default: 0),
  totalHours: Number (default: 0),
  date: String (required),
  status: String (enum: ['present', 'absent', 'late', 'overtime']),
  notes: String,
  overtimePay: Number (default: 0),
  location: String,
  device: String,
  ipAddress: String,
  createdBy: String,
  createdAt: String,
  updatedAt: String,
  isManualEntry: Boolean (default: false),
  manualEntryBy: String,
  approvedBy: String,
  approvedAt: String,
  rejectionReason: String
}
```

### Transaction Model
```javascript
{
  type: String (enum: ['income', 'expense'], required),
  amount: Number (required),
  description: String,
  clientId: String,
  clientName: String,
  projectId: String,
  projectName: String,
  category: String,
  transactionType: String,
  importance: String (enum: ['low', 'medium', 'high']),
  paymentMethod: String (enum: ['cash', 'transfer', 'pos', 'check', 'credit']),
  date: String,
  status: String (enum: ['completed', 'pending', 'draft', 'canceled']),
  createdBy: String,
  createdAt: String,
  remainingAmount: Number,
  payerName: String
}
```

### Client Model
```javascript
{
  name: String (required),
  phone: String,
  email: String,
  address: String,
  projects: [String],
  totalProjects: Number (default: 0),
  totalRevenue: Number (default: 0),
  createdBy: String,
  createdAt: String,
  updatedAt: String
}
```

### Notification Model
```javascript
{
  userId: String (required),
  title: String (required),
  message: String (required),
  type: String (enum: ['info', 'success', 'warning', 'error']),
  isRead: Boolean (default: false),
  relatedId: String,
  relatedType: String,
  createdAt: String,
  expiresAt: String
}
```

## 🎨 UI/UX Requirements

### Design System
- **Arabic RTL Support** - Full right-to-left layout
- **Cairo Font** - Arabic typography
- **Dark/Light Theme** - Theme switching
- **Responsive Design** - Mobile-first approach
- **Saudi Riyal Symbol** - Local currency display
- **Hijri Calendar** - Islamic calendar support

### Color Palette
- Primary: Blue tones (#3B82F6)
- Secondary: Gray tones (#6B7280)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Background: White/Dark gray

### Component Library
- **Cards** - Information display
- **Tables** - Data presentation
- **Forms** - Data input
- **Charts** - Data visualization
- **Modals** - Overlay content
- **Navigation** - Menu systems
- **Buttons** - Action triggers
- **Badges** - Status indicators

## 📱 Frontend Pages & Components

### 1. Authentication Pages
#### Login Page (`/app/page.tsx`)
- **Features**: Email/password login form
- **Components**: Login form, validation, error handling
- **Functionality**: JWT authentication, redirect to dashboard
- **Design**: Clean, centered form with company logo

#### Register Page (Optional)
- **Features**: User registration form
- **Components**: Registration form, role selection
- **Functionality**: Admin-only user creation

### 2. Dashboard Page (`/app/dashboard/page.tsx`)
#### Main Dashboard Layout
- **Header**: Company logo, user menu, notifications
- **Sidebar**: Navigation menu with role-based access
- **Main Content**: Statistics cards, charts, recent activities
- **Quick Actions**: Add project, task, client, transaction

#### Dashboard Components
```typescript
// Statistics Cards
- Total Projects (with status breakdown)
- Total Clients
- Pending Tasks
- Monthly Revenue
- Attendance Today
- Upcoming Payments

// Charts & Visualizations
- Revenue Trends (Line Chart)
- Project Distribution (Pie Chart)
- Task Completion (Bar Chart)
- Attendance Patterns (Bar Chart)

// Recent Activities Feed
- Latest projects created
- Recent task updates
- Financial transactions
- Attendance records

// Quick Actions Panel
- Add New Project
- Create Task
- Add Client
- Record Transaction
- Check In/Out
```

### 3. Projects Page (`/app/projects/page.tsx`)
#### Project Management Interface
- **Project List**: Table/grid view with filters
- **Project Cards**: Visual project representation
- **Search & Filter**: By status, client, engineer, date
- **Add/Edit Forms**: Modal forms for project management

#### Project Components
```typescript
// Project List View
- Project name, client, status
- Progress bar, assigned engineer
- Start/end dates, price
- Action buttons (edit, delete, view)

// Project Detail Modal
- Full project information
- Team members
- Financial details
- Progress tracking
- Notes and comments

// Project Form Components
- Basic info (name, client, type)
- Financial details (price, payments)
- Team assignment
- Timeline and milestones
- Description and notes
```

### 4. Tasks Page (`/app/tasks/page.tsx`)
#### Task Management Interface
- **Kanban Board**: Drag & drop task management
- **List View**: Traditional table view
- **Task Cards**: Visual task representation
- **Filters**: By status, priority, assignee, project

#### Task Components
```typescript
// Kanban Board
- Todo Column
- In Progress Column
- Completed Column
- Drag & drop functionality

// Task Card
- Title and description
- Priority badge
- Assignee avatar
- Due date
- Project link
- Status indicator

// Task Form
- Title and description
- Assignee selection
- Project association
- Priority setting
- Due date picker
```

### 5. Clients Page (`/app/clients/page.tsx`)
#### Client Management Interface
- **Client List**: Table with client information
- **Client Cards**: Visual client representation
- **Client Detail**: Full client profile
- **Project History**: Client's project timeline

#### Client Components
```typescript
// Client List
- Name, phone, email
- Total projects
- Total revenue
- Last contact date
- Action buttons

// Client Detail Modal
- Contact information
- Project history
- Financial summary
- Notes and comments
- Communication log

// Client Form
- Basic contact info
- Address details
- Additional notes
- Tags/categories
```

### 6. Finance Page (`/app/finance/page.tsx`)
#### Financial Management Interface
- **Transaction List**: All financial records
- **Income/Expense Summary**: Financial overview
- **Charts**: Revenue trends, expense breakdown
- **Reports**: Financial reports and exports

#### Finance Components
```typescript
// Financial Overview
- Total income/expense
- Net profit/loss
- Monthly trends
- Outstanding payments

// Transaction List
- Date, type, amount
- Description, category
- Payment method
- Status indicator
- Related project/client

// Transaction Form
- Type selection (income/expense)
- Amount input
- Category selection
- Payment method
- Date picker
- Description
- Related entities
```

### 7. Attendance Page (`/app/attendance/page.tsx`)
#### Attendance Management Interface
- **Attendance Calendar**: Monthly view
- **Daily Records**: Today's attendance
- **Employee List**: All employees with status
- **Reports**: Attendance reports and analytics

#### Attendance Components
```typescript
// Attendance Calendar
- Monthly calendar view
- Color-coded attendance status
- Click to view details
- Export functionality

// Daily Attendance
- Employee list with status
- Check-in/out times
- Hours worked
- Late/overtime indicators

// Attendance Form
- Manual entry option
- Time input
- Status selection
- Notes field
- Approval workflow
```

### 8. Settings Page (`/app/settings/page.tsx`)
#### System Settings Interface
- **Company Settings**: Company information
- **User Management**: User list and roles
- **System Configuration**: App settings
- **Backup & Export**: Data management

#### Settings Components
```typescript
// Company Settings
- Company name and logo
- Contact information
- Business hours
- Currency settings
- Tax configuration

// User Management
- User list with roles
- Add/edit users
- Permission management
- Password reset
- User activity logs

// System Settings
- Theme preferences
- Language settings
- Notification preferences
- Security settings
```

## 🔧 Backend Routes & Controllers

### Authentication Routes (`/backend/routes/auth.js`)
```javascript
// POST /api/auth/login
- Validate credentials
- Generate JWT token
- Return user data

// POST /api/auth/register (Admin only)
- Create new user
- Hash password
- Assign role

// GET /api/auth/me
- Verify token
- Return current user

// POST /api/auth/logout
- Invalidate token
- Clear session
```

### Project Routes (`/backend/routes/projects.js`)
```javascript
// GET /api/projects
- Fetch all projects
- Apply filters
- Pagination support

// POST /api/projects
- Validate project data
- Create new project
- Assign engineer
- Send notifications

// GET /api/projects/:id
- Fetch project details
- Include team members
- Financial summary

// PUT /api/projects/:id
- Update project data
- Track changes
- Update progress

// DELETE /api/projects/:id
- Soft delete project
- Archive data
- Update related records
```

### Task Routes (`/backend/routes/tasks.js`)
```javascript
// GET /api/tasks
- Fetch tasks with filters
- Support for Kanban view
- Include assignee details

// POST /api/tasks
- Create new task
- Assign to user
- Send notifications
- Update project progress

// PUT /api/tasks/:id
- Update task status
- Track progress
- Update project timeline

// DELETE /api/tasks/:id
- Remove task
- Update project progress
```

### Client Routes (`/backend/routes/clients.js`)
```javascript
// GET /api/clients
- Fetch all clients
- Include project count
- Revenue summary

// POST /api/clients
- Create new client
- Validate contact info
- Generate client ID

// GET /api/clients/:id
- Client details
- Project history
- Financial summary

// PUT /api/clients/:id
- Update client info
- Track changes
```

### Finance Routes (`/backend/routes/transactions.js`)
```javascript
// GET /api/transactions
- Fetch transactions
- Apply filters
- Calculate totals

// POST /api/transactions
- Create transaction
- Update project balance
- Send notifications

// GET /api/transactions/reports
- Generate financial reports
- Export to PDF/Excel
- Monthly summaries
```

### Attendance Routes (`/backend/routes/attendance.js`)
```javascript
// GET /api/attendance
- Fetch attendance records
- Filter by date/user
- Calculate statistics

// POST /api/attendance/checkin
- Record check-in
- Calculate late time
- Send notifications

// POST /api/attendance/checkout
- Record check-out
- Calculate total hours
- Overtime calculation

// PUT /api/attendance/:id
- Manual entry
- Approval workflow
- Update records
```

### User Routes (`/backend/routes/users.js`)
```javascript
// GET /api/users
- Fetch all users
- Role-based filtering
- Activity status

// POST /api/users
- Create new user
- Assign permissions
- Send welcome email

// PUT /api/users/:id
- Update user info
- Change role/permissions
- Update working hours

// DELETE /api/users/:id
- Deactivate user
- Archive data
```

### Notification Routes (`/backend/routes/notifications.js`)
```javascript
// GET /api/notifications
- User's notifications
- Unread count
- Filter by type

// POST /api/notifications
- Create notification
- Send to users
- Real-time delivery

// PUT /api/notifications/:id/read
- Mark as read
- Update unread count
```

## 🔄 Real-time Features

### Implementation
- **Server-Sent Events (SSE)** for real-time updates
- **WebSocket fallback** when needed
- **Polling mode** as backup
- **Connection monitoring** with auto-reconnect

### Real-time Updates Include
- New project creation
- Task status changes
- Financial transactions
- Attendance records
- Notification delivery
- User status changes

## 🔒 Security & Authentication

### Authentication System
- **JWT-based authentication**
- **Role-based access control (RBAC)**
- **Module-based permissions**
- **Session management**
- **Password hashing with bcrypt**

### Permission Levels
- **Admin**: Full access to all modules
- **Engineer**: Project and task management
- **Accountant**: Financial management
- **Employee**: Limited access, attendance only

### Security Measures
- **CORS protection**
- **Input validation**
- **SQL injection prevention**
- **XSS protection**
- **Environment variables** for sensitive data

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile Features
- **Touch-friendly interfaces**
- **Swipe gestures**
- **Mobile-optimized forms**
- **Responsive tables**
- **Collapsible navigation**

## 🚀 Performance Optimization

### Frontend Optimization
- **Code splitting** with dynamic imports
- **Lazy loading** for components
- **Image optimization** with Next.js
- **Bundle optimization** with webpack
- **Caching strategies**
- **Service worker** for offline support

### Backend Optimization
- **Database indexing**
- **Query optimization**
- **Connection pooling**
- **Response caching**
- **Rate limiting**
- **Error handling**

## 📊 Dashboard Features

### Main Dashboard
- **Project statistics** (total, active, completed)
- **Financial overview** (revenue, expenses, profit)
- **Task management** (pending, in-progress, completed)
- **Attendance summary** (present, absent, late)
- **Recent activities** feed
- **Quick actions** panel
- **Upcoming payments** reminder
- **Performance metrics**

### Charts and Visualizations
- **Revenue trends** (line chart)
- **Project distribution** (pie chart)
- **Attendance patterns** (bar chart)
- **Task completion rates** (progress bars)
- **Financial breakdown** (doughnut chart)

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
```

### Projects
```
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
```

### Tasks
```
GET /api/tasks
POST /api/tasks
GET /api/tasks/:id
PUT /api/tasks/:id
DELETE /api/tasks/:id
```

### Clients
```
GET /api/clients
POST /api/clients
GET /api/clients/:id
PUT /api/clients/:id
DELETE /api/clients/:id
```

### Finance
```
GET /api/transactions
POST /api/transactions
GET /api/transactions/:id
PUT /api/transactions/:id
DELETE /api/transactions/:id
```

### Attendance
```
GET /api/attendance
POST /api/attendance/checkin
POST /api/attendance/checkout
GET /api/attendance/:id
PUT /api/attendance/:id
```

### Users
```
GET /api/users
POST /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
```

### Notifications
```
GET /api/notifications
POST /api/notifications
PUT /api/notifications/:id/read
DELETE /api/notifications/:id
```

## 🌍 Localization Features

### Arabic Support
- **RTL layout** implementation
- **Arabic number formatting**
- **Hijri date conversion**
- **Arabic currency symbols**
- **Local timezone handling**

### Cultural Adaptations
- **Saudi work week** (Sunday-Thursday)
- **Prayer time considerations**
- **Local business practices**
- **Arabic business terminology**

## 📈 Reporting System

### Available Reports
- **Project reports** (progress, timeline, budget)
- **Financial reports** (income, expenses, profit/loss)
- **Attendance reports** (daily, weekly, monthly)
- **Performance reports** (employee, team, company)
- **Client reports** (projects, revenue, satisfaction)

### Export Features
- **PDF generation**
- **Excel export**
- **CSV download**
- **Email reports**
- **Scheduled reports**

## 🔔 Notification System

### Notification Types
- **Task assignments**
- **Project updates**
- **Payment reminders**
- **Attendance alerts**
- **System notifications**

### Delivery Methods
- **In-app notifications**
- **Email notifications**
- **SMS notifications** (optional)
- **Push notifications** (browser)

## 🛠️ Development Guidelines

### Code Standards
- **ESLint** configuration
- **Prettier** formatting
- **TypeScript** strict mode
- **Component documentation**
- **API documentation**

### Testing Strategy
- **Unit tests** for utilities
- **Integration tests** for API
- **E2E tests** for critical flows
- **Performance testing**
- **Security testing**

### Deployment Pipeline
- **GitHub Actions** for CI/CD
- **Environment management**
- **Database migrations**
- **Backup strategies**
- **Monitoring setup**

## 📋 Implementation Phases

### Phase 1: Core Setup
1. Project initialization
2. Database setup
3. Basic authentication
4. User management
5. Basic UI components

### Phase 2: Core Features
1. Project management
2. Task management
3. Client management
4. Basic dashboard
5. Real-time updates

### Phase 3: Advanced Features
1. Financial management
2. Attendance system
3. Reporting system
4. Advanced analytics
5. Mobile optimization

### Phase 4: Polish & Deploy
1. Performance optimization
2. Security hardening
3. Testing & bug fixes
4. Documentation
5. Deployment

## 🎯 Success Criteria

### Functional Requirements
- ✅ All CRUD operations work correctly
- ✅ Real-time updates function properly
- ✅ User permissions are enforced
- ✅ Data is properly validated
- ✅ Reports generate accurately

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

## 📚 Additional Resources

### Documentation Needed
- **API documentation** (Swagger/OpenAPI)
- **User manual** (Arabic)
- **Admin guide** (Arabic)
- **Technical documentation**
- **Deployment guide**

### Third-party Integrations
- **Payment gateways** (optional)
- **Email services** (SendGrid/AWS SES)
- **SMS services** (optional)
- **File storage** (AWS S3/Cloudinary)
- **Analytics** (Google Analytics)

---

## 🚀 Final Notes

This system should be built with **scalability** in mind, allowing for future enhancements such as:
- Multi-tenant architecture
- Mobile app development
- Advanced AI features
- Integration with external systems
- Advanced reporting and analytics

The focus should be on creating a **user-friendly**, **efficient**, and **reliable** system that meets the specific needs of engineering offices in Saudi Arabia while maintaining high standards of code quality and performance.

**Remember**: This is a production system that will handle real business data, so prioritize **security**, **reliability**, and **user experience** throughout the development process. 