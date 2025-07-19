import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import type { Project, Task, Transaction, User } from './types'
import { formatCurrency } from './utils'
import { ArabicNumber } from '@/components/ui/ArabicNumber'

// مكون محسن لعرض المشاريع
export const OptimizedProjectCard = React.memo(({ project }: { project: Project }) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{project.name}</h4>
        <Badge variant={project.status === "in-progress" ? "default" : "secondary"}>
          {project.status === "in-progress" ? "قيد التنفيذ" : project.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{project.client}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>التقدم</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {project.startDate}
          </span>
          <span>
            ﷼ {project.price.toLocaleString()}
            <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 block dark:hidden" />
            <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 hidden dark:block" />
          </span>
        </div>
      </div>
    </div>
  )
})

// مكون محسن لعرض المهام
export const OptimizedTaskCard = React.memo(({ task }: { task: Task }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
      case "in-progress":
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed"

  return (
    <div className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{task.title}</h4>
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <Badge variant={getPriorityColor(task.priority)}>
            {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : "منخفضة"}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>المسؤول</span>
          <span className="flex items-center gap-1">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="text-xs">{task.assigneeName.charAt(0)}</AvatarFallback>
            </Avatar>
            {task.assigneeName}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {task.dueDate || "لا يوجد موعد"}
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {task.projectName}
          </span>
        </div>
        {isOverdue && (
          <div className="flex items-center gap-1 text-red-600 text-xs">
            <AlertTriangle className="w-3 h-3" />
            متأخرة
          </div>
        )}
      </div>
    </div>
  )
})

// مكون محسن لعرض الإحصائيات
export const OptimizedStatCard = React.memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  bgColor, 
  onClick,
  trendIcon: TrendIcon,
  trendColor 
}: {
  title: string
  value: React.ReactNode
  change: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  onClick?: () => void
  trendIcon?: React.ComponentType<{ className?: string }>
  trendColor?: string
}) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${onClick ? 'hover:scale-105' : ''}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {TrendIcon && (
            <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          )}
          <span>{change}</span>
        </div>
      </CardContent>
    </Card>
  )
})

// مكون محسن لعرض المعاملات المالية
export const OptimizedTransactionCard = React.memo(({ transaction }: { transaction: Transaction }) => {
  const getTypeColor = (type: string) => {
    return type === "income" ? "text-green-600" : "text-red-600"
  }

  const getTypeIcon = (type: string) => {
    return type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{transaction.description}</h4>
        <div className="flex items-center gap-2">
          {getTypeIcon(transaction.type)}
          <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
            {transaction.type === "income" ? "دخل" : "مصروف"}
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>المبلغ</span>
          <span className={`font-semibold ${getTypeColor(transaction.type)}`}>
            ﷼ {transaction.amount.toLocaleString()}
            <img src="/Saudi_Riyal_Symbol.svg" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 block dark:hidden" />
            <img src="/Saudi_Riyal_Symbol_White.png" alt="ريال" width={16} height={16} className="inline align-middle opacity-60 ml-1 hidden dark:block" />
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {transaction.date}
          </span>
          <span>{transaction.clientName || "غير محدد"}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{transaction.transactionType}</span>
          <span>{transaction.paymentMethod}</span>
        </div>
      </div>
    </div>
  )
})

// مكون محسن لعرض المستخدمين
export const OptimizedUserCard = React.memo(({ user }: { user: User }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "engineer":
        return "default"
      case "manager":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير"
      case "engineer":
        return "مهندس"
      case "manager":
        return "مشرف"
      default:
        return role
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">{user.name}</h4>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant={getRoleColor(user.role)}>
          {getRoleText(user.role)}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>الحالة</span>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "نشط" : "غير نشط"}
          </Badge>
        </div>
        {user.phone && (
          <div className="text-xs text-muted-foreground">
            الهاتف: {user.phone}
          </div>
        )}
      </div>
    </div>
  )
}) 