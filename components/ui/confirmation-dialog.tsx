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
import { AlertTriangle, Trash2, X, DollarSign, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  type: "delete" | "financial" | "sensitive" | "warning"
  actionType?: "delete" | "complete" | "approve" | "reject"
  amount?: number
  currency?: string
  isLoading?: boolean
  error?: string
  warning?: string
  confirmText?: string
  cancelText?: string
  icon?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  type,
  actionType = "delete",
  amount,
  currency = "ريال",
  isLoading = false,
  error,
  warning,
  confirmText,
  cancelText = "إلغاء",
  icon
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      console.error("Error in confirmation action:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const getIcon = () => {
    if (icon) return icon
    
    switch (type) {
      case "delete":
        return <Trash2 className="w-6 h-6 text-red-600" />
      case "financial":
        return <DollarSign className="w-6 h-6 text-green-600" />
      case "sensitive":
        return <AlertCircle className="w-6 h-6 text-orange-600" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />
    }
  }

  const getIconBgColor = () => {
    switch (type) {
      case "delete":
        return "bg-red-100 dark:bg-red-900/20"
      case "financial":
        return "bg-green-100 dark:bg-green-900/20"
      case "sensitive":
        return "bg-orange-100 dark:bg-orange-900/20"
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/20"
      default:
        return "bg-red-100 dark:bg-red-900/20"
    }
  }

  const getConfirmButtonVariant = () => {
    switch (type) {
      case "delete":
        return "destructive"
      case "financial":
        return "default"
      case "sensitive":
        return "destructive"
      case "warning":
        return "destructive"
      default:
        return "destructive"
    }
  }

  const getConfirmText = () => {
    if (confirmText) return confirmText
    
    switch (actionType) {
      case "delete":
        return "حذف"
      case "complete":
        return "إكمال"
      case "approve":
        return "موافقة"
      case "reject":
        return "رفض"
      default:
        return "تأكيد"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
              {getIcon()}
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warning && (
          <Alert variant="default" className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">{warning}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 border rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="flex-shrink-0">
              {type === "financial" && amount ? (
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {itemName}
              </p>
              {type === "financial" && amount && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-lg font-bold text-green-600">
                    {amount.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-sm text-muted-foreground">{currency}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {type === "delete" && "هذا الإجراء لا يمكن التراجع عنه"}
                {type === "financial" && "سيتم تسجيل هذه المعاملة المالية"}
                {type === "sensitive" && "هذا إجراء حساس يتطلب تأكيد إضافي"}
                {type === "warning" && "يرجى التأكد من صحة المعلومات قبل المتابعة"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isProcessing}
            className="min-w-[100px]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                جاري المعالجة...
              </>
            ) : (
              <>
                {actionType === "delete" && <Trash2 className="w-4 h-4 mr-2" />}
                {actionType === "complete" && <CheckCircle className="w-4 h-4 mr-2" />}
                {actionType === "approve" && <CheckCircle className="w-4 h-4 mr-2" />}
                {actionType === "reject" && <X className="w-4 h-4 mr-2" />}
                {getConfirmText()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Specialized confirmation dialogs
export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = "العنصر",
  error,
  isLoading = false
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemName: string
  itemType?: string
  error?: string
  isLoading?: boolean
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="تأكيد الحذف"
    description={`هل أنت متأكد من حذف ${itemType}؟ لا يمكن التراجع عن هذا الإجراء.`}
    itemName={itemName}
    type="delete"
    actionType="delete"
    error={error}
    isLoading={isLoading}
    confirmText="حذف"
  />
)

export const FinancialConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  amount,
  currency = "ريال",
  transactionType = "income",
  error,
  isLoading = false
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemName: string
  amount: number
  currency?: string
  transactionType?: "income" | "expense"
  error?: string
  isLoading?: boolean
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title="تأكيد المعاملة المالية"
    description={`هل أنت متأكد من تسجيل ${transactionType === "income" ? "دخل" : "مصروف"} جديد؟`}
    itemName={itemName}
    type="financial"
    actionType="complete"
    amount={amount}
    currency={currency}
    error={error}
    isLoading={isLoading}
    confirmText="تأكيد المعاملة"
  />
)

export const SensitiveActionConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  actionType = "approve",
  error,
  isLoading = false
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  actionType?: "approve" | "reject"
  error?: string
  isLoading?: boolean
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    onConfirm={onConfirm}
    title={title}
    description={description}
    itemName={itemName}
    type="sensitive"
    actionType={actionType}
    error={error}
    isLoading={isLoading}
    confirmText={actionType === "approve" ? "موافقة" : "رفض"}
  />
) 