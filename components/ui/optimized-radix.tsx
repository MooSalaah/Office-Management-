"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from './skeleton'

// مكونات التحميل
const RadixSkeleton = () => <Skeleton className="h-10 w-full" />
const RadixButtonSkeleton = () => <Skeleton className="h-9 w-20" />

// تحميل مكونات Radix UI بشكل ديناميكي
export const OptimizedAccordion = dynamic(
  () => import('@radix-ui/react-accordion').then(mod => ({
    default: mod.Accordion,
    AccordionItem: mod.AccordionItem,
    AccordionTrigger: mod.AccordionTrigger,
    AccordionContent: mod.AccordionContent
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedAlertDialog = dynamic(
  () => import('@radix-ui/react-alert-dialog').then(mod => ({
    default: mod.AlertDialog,
    AlertDialogTrigger: mod.AlertDialogTrigger,
    AlertDialogContent: mod.AlertDialogContent,
    AlertDialogHeader: mod.AlertDialogHeader,
    AlertDialogFooter: mod.AlertDialogFooter,
    AlertDialogTitle: mod.AlertDialogTitle,
    AlertDialogDescription: mod.AlertDialogDescription,
    AlertDialogAction: mod.AlertDialogAction,
    AlertDialogCancel: mod.AlertDialogCancel
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedAvatar = dynamic(
  () => import('@radix-ui/react-avatar').then(mod => ({
    default: mod.Avatar,
    AvatarImage: mod.AvatarImage,
    AvatarFallback: mod.AvatarFallback
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedCheckbox = dynamic(
  () => import('@radix-ui/react-checkbox').then(mod => ({
    default: mod.Checkbox,
    CheckboxIndicator: mod.CheckboxIndicator
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedDialog = dynamic(
  () => import('@radix-ui/react-dialog').then(mod => ({
    default: mod.Dialog,
    DialogTrigger: mod.DialogTrigger,
    DialogContent: mod.DialogContent,
    DialogHeader: mod.DialogHeader,
    DialogFooter: mod.DialogFooter,
    DialogTitle: mod.DialogTitle,
    DialogDescription: mod.DialogDescription
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedDropdownMenu = dynamic(
  () => import('@radix-ui/react-dropdown-menu').then(mod => ({
    default: mod.DropdownMenu,
    DropdownMenuTrigger: mod.DropdownMenuTrigger,
    DropdownMenuContent: mod.DropdownMenuContent,
    DropdownMenuItem: mod.DropdownMenuItem,
    DropdownMenuCheckboxItem: mod.DropdownMenuCheckboxItem,
    DropdownMenuRadioItem: mod.DropdownMenuRadioItem,
    DropdownMenuLabel: mod.DropdownMenuLabel,
    DropdownMenuSeparator: mod.DropdownMenuSeparator,
    DropdownMenuShortcut: mod.DropdownMenuShortcut,
    DropdownMenuGroup: mod.DropdownMenuGroup,
    DropdownMenuPortal: mod.DropdownMenuPortal,
    DropdownMenuSub: mod.DropdownMenuSub,
    DropdownMenuSubContent: mod.DropdownMenuSubContent,
    DropdownMenuSubTrigger: mod.DropdownMenuSubTrigger,
    DropdownMenuRadioGroup: mod.DropdownMenuRadioGroup
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedLabel = dynamic(
  () => import('@radix-ui/react-label').then(mod => ({ default: mod.Label })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedPopover = dynamic(
  () => import('@radix-ui/react-popover').then(mod => ({
    default: mod.Popover,
    PopoverTrigger: mod.PopoverTrigger,
    PopoverContent: mod.PopoverContent
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedSelect = dynamic(
  () => import('@radix-ui/react-select').then(mod => ({
    default: mod.Select,
    SelectGroup: mod.SelectGroup,
    SelectValue: mod.SelectValue,
    SelectTrigger: mod.SelectTrigger,
    SelectContent: mod.SelectContent,
    SelectLabel: mod.SelectLabel,
    SelectItem: mod.SelectItem,
    SelectSeparator: mod.SelectSeparator
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedSeparator = dynamic(
  () => import('@radix-ui/react-separator').then(mod => ({ default: mod.Separator })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedSwitch = dynamic(
  () => import('@radix-ui/react-switch').then(mod => ({ default: mod.Switch })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedTabs = dynamic(
  () => import('@radix-ui/react-tabs').then(mod => ({
    default: mod.Tabs,
    TabsList: mod.TabsList,
    TabsTrigger: mod.TabsTrigger,
    TabsContent: mod.TabsContent
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedToast = dynamic(
  () => import('@radix-ui/react-toast').then(mod => ({
    default: mod.Toast,
    ToastViewport: mod.ToastViewport,
    ToastTitle: mod.ToastTitle,
    ToastDescription: mod.ToastDescription,
    ToastAction: mod.ToastAction,
    ToastClose: mod.ToastClose
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

export const OptimizedTooltip = dynamic(
  () => import('@radix-ui/react-tooltip').then(mod => ({
    default: mod.Tooltip,
    TooltipTrigger: mod.TooltipTrigger,
    TooltipContent: mod.TooltipContent,
    TooltipArrow: mod.TooltipArrow,
    TooltipProvider: mod.TooltipProvider
  })),
  {
    loading: () => <RadixSkeleton />,
    ssr: false
  }
)

// مكون محسن لـ Radix UI مع Suspense
export const OptimizedRadixWrapper: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback = <RadixSkeleton /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Hook لتحسين تحميل مكونات Radix UI
export const useOptimizedRadix = () => {
  const preloadRadixComponent = async (componentName: string) => {
    try {
      switch (componentName) {
        case 'accordion':
          await import('@radix-ui/react-accordion')
          break
        case 'alertDialog':
          await import('@radix-ui/react-alert-dialog')
          break
        case 'avatar':
          await import('@radix-ui/react-avatar')
          break
        case 'checkbox':
          await import('@radix-ui/react-checkbox')
          break
        case 'dialog':
          await import('@radix-ui/react-dialog')
          break
        case 'dropdownMenu':
          await import('@radix-ui/react-dropdown-menu')
          break
        case 'label':
          await import('@radix-ui/react-label')
          break
        case 'popover':
          await import('@radix-ui/react-popover')
          break
        case 'select':
          await import('@radix-ui/react-select')
          break
        case 'separator':
          await import('@radix-ui/react-separator')
          break
        case 'switch':
          await import('@radix-ui/react-switch')
          break
        case 'tabs':
          await import('@radix-ui/react-tabs')
          break
        case 'toast':
          await import('@radix-ui/react-toast')
          break
        case 'tooltip':
          await import('@radix-ui/react-tooltip')
          break
        default:
          break
      }
    } catch (error) {
      console.warn(`فشل في التحميل المسبق لمكون Radix UI ${componentName}:`, error)
    }
  }

  return {
    preloadRadixComponent
  }
} 