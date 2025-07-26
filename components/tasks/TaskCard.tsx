import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Calendar, Trash2, Edit2, Eye, Move, User, X } from "lucide-react";
import type { Task, User as UserType } from "@/lib/types";
import React from "react";

interface TaskCardProps {
  task: Task;
  users?: UserType[];
  canDelete?: boolean;
  canEdit?: boolean;
  isHighlighted?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onDetails?: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "default";
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case "high":
      return "عالية";
    case "medium":
      return "متوسطة";
    case "low":
      return "منخفضة";
    default:
      return priority;
  }
};

const TaskCard = ({ task, users, canDelete, canEdit, isHighlighted, onDelete, onEdit, onDetails }: TaskCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-button')) {
      e.stopPropagation()
      return
    }
    onDetails?.()
  }

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${
        canEdit ? 'border-l-4 border-l-blue-500 hover:border-l-blue-600' : ''
      } ${
        isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <h4 className="font-medium text-foreground leading-tight">{task.title}</h4>
              {canEdit && (
                <Move className="w-4 h-4 text-blue-500 opacity-70 hover:opacity-100 transition-opacity" />
              )}
            </div>
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {getPriorityText(task.priority)}
            </Badge>
          </div>

          {/* Task Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>

          {/* Project */}
          {task.projectName && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                <span className="font-medium">المشروع:</span> {task.projectName}
              </div>
            </div>
          )}

          {/* Task Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Avatar className="w-6 h-6">
                <AvatarImage src="/placeholder.svg" alt={task.assigneeName} />
                <AvatarFallback className="text-xs">
                  {task.assigneeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
            </div>
            
            {/* Creator Info */}
            {users && task.createdBy && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  أنشأت بواسطة: {task.createdByName || users.find(u => u.id === task.createdBy)?.name || "غير معروف"}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 mr-1" />
                {task.dueDate}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 space-x-reverse">
                {isHighlighted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Remove highlight by refreshing the page without the highlight parameter
                      window.location.href = '/tasks'
                    }}
                    className="action-button h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="إزالة التمييز"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.()
                    }}
                    className="action-button h-6 w-6 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="تعديل المهمة"
                  >
                    <Edit2 className="w-3 h-3 text-blue-600" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.()
                    }}
                    className="action-button h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(TaskCard); 