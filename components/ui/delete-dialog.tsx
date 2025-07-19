"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  type: "project" | "client" | "task"
  isLoading?: boolean
  error?: string
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  type,
  isLoading = false,
  error
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      // إزالة رسالة النجاح وإغلاق الحوار مباشرة
      onOpenChange(false)
    } catch (err) {
      console.error("Error deleting item:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const getIcon = () => {
    switch (type) {
      case "project":
        return "🏗️"
      case "client":
        return "👤"
      case "task":
        return "📋"
      default:
        return "🗑️"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <span className="text-2xl">{getIcon()}</span>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {itemName}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                هذا الإجراء لا يمكن التراجع عنه
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            <X className="w-4 h-4 mr-2" />
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                حذف
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 