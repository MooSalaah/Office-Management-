import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import type { Task, Project, Transaction, User } from './types'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleItemCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length)

  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, startIndex + index)} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Virtualized Task List
export function VirtualizedTaskList({ tasks }: { tasks: Task[] }) {
  const ITEM_HEIGHT = 120
  const CONTAINER_HEIGHT = 600

  const renderTask = (task: Task, index: number) => (
    <Card className="mb-2 mx-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground">{task.title}</h4>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              task.status === 'todo' ? 'bg-gray-400' :
              task.status === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            <Badge variant={
              task.priority === 'high' ? 'destructive' :
              task.priority === 'medium' ? 'default' : 'secondary'
            }>
              {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center">
            <Avatar className="w-4 h-4 mr-1">
              <AvatarFallback className="text-xs">{task.assigneeName.charAt(0)}</AvatarFallback>
            </Avatar>
            {task.assigneeName}
          </span>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {task.dueDate || "لا يوجد موعد"}
          </span>
        </div>
        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
            <AlertTriangle className="w-3 h-3" />
            متأخرة
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <VirtualizedList
      items={tasks}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderTask}
      keyExtractor={(task) => task.id}
    />
  )
}

// Virtualized Project List
export function VirtualizedProjectList({ projects }: { projects: Project[] }) {
  const ITEM_HEIGHT = 140
  const CONTAINER_HEIGHT = 600

  const renderProject = (project: Project, index: number) => (
    <Card className="mb-2 mx-2">
      <CardContent className="p-4">
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {project.startDate}
            </span>
            <span>
              ﷼ {project.price.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <VirtualizedList
      items={projects}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderProject}
      keyExtractor={(project) => project.id}
    />
  )
}

// Virtualized Transaction List
export function VirtualizedTransactionList({ transactions }: { transactions: Transaction[] }) {
  const ITEM_HEIGHT = 120
  const CONTAINER_HEIGHT = 600

  const renderTransaction = (transaction: Transaction, index: number) => (
    <Card className="mb-2 mx-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground">{transaction.description}</h4>
          <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
            {transaction.type === "income" ? "دخل" : "مصروف"}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>المبلغ</span>
            <span className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
              ﷼ {transaction.amount.toLocaleString()}
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
      </CardContent>
    </Card>
  )

  return (
    <VirtualizedList
      items={transactions}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderTransaction}
      keyExtractor={(transaction) => transaction.id}
    />
  )
}

// Virtualized User List
export function VirtualizedUserList({ users }: { users: User[] }) {
  const ITEM_HEIGHT = 100
  const CONTAINER_HEIGHT = 600

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

  const renderUser = (user: User, index: number) => (
    <Card className="mb-2 mx-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{user.name}</h4>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant={getRoleColor(user.role)}>
            {getRoleText(user.role)}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "نشط" : "غير نشط"}
          </Badge>
          {user.phone && (
            <span className="text-xs text-muted-foreground">{user.phone}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <VirtualizedList
      items={users}
      itemHeight={ITEM_HEIGHT}
      containerHeight={CONTAINER_HEIGHT}
      renderItem={renderUser}
      keyExtractor={(user) => user.id}
    />
  )
} 