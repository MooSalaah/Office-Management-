"use client"

import * as React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import { cn } from "@/lib/utils"

// تسجيل مكونات Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// إعدادات Chart.js الافتراضية
ChartJS.defaults.color = 'hsl(var(--muted-foreground))'
ChartJS.defaults.borderColor = 'hsl(var(--border))'
ChartJS.defaults.font.family = 'inherit'

// أنواع الرسوم البيانية
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut'

// تكوين الرسم البياني
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    color?: string
    backgroundColor?: string
    borderColor?: string
  }
}

// خصائص البيانات
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
    tension?: number
  }[]
}

// خصائص الرسم البياني
export interface ChartProps {
  type: ChartType
  data: ChartData
  config?: ChartConfig
  options?: any
  className?: string
  height?: number | string
  width?: number | string
}

// مكون الرسم البياني الرئيسي
export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  config = {},
  options = {},
  className,
  height = 300,
  width = '100%'
}) => {
  // إعدادات افتراضية
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'hsl(var(--muted-foreground))',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--background))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--muted-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: type !== 'pie' && type !== 'doughnut' ? {
      x: {
        grid: {
          color: 'hsl(var(--border))',
          borderColor: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        grid: {
          color: 'hsl(var(--border))',
          borderColor: 'hsl(var(--border))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
    } : undefined,
  }

  // دمج الإعدادات
  const mergedOptions = React.useMemo(() => {
    return {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
      },
    }
  }, [options])

  // تطبيق التكوين على البيانات
  const processedData = React.useMemo(() => {
    if (!config || Object.keys(config).length === 0) {
      return data
    }

    return {
      ...data,
      datasets: data.datasets.map((dataset, index) => {
        const configKey = dataset.label || `dataset-${index}`
        const datasetConfig = config[configKey]

        if (!datasetConfig) {
          return dataset
        }

        return {
          ...dataset,
          backgroundColor: datasetConfig.backgroundColor || dataset.backgroundColor,
          borderColor: datasetConfig.borderColor || dataset.borderColor,
        }
      }),
    }
  }, [data, config])

  // اختيار مكون الرسم البياني المناسب
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={processedData} options={mergedOptions} />
      case 'bar':
        return <Bar data={processedData} options={mergedOptions} />
      case 'pie':
        return <Pie data={processedData} options={mergedOptions} />
      case 'doughnut':
        return <Doughnut data={processedData} options={mergedOptions} />
      default:
        return <Line data={processedData} options={mergedOptions} />
    }
  }

  return (
    <div
      className={cn(
        "flex aspect-video justify-center text-xs",
        className
      )}
      style={{ height, width }}
    >
      {renderChart()}
    </div>
  )
}

// مكونات مساعدة للرسوم البيانية المختلفة
export const LineChart: React.FC<Omit<ChartProps, 'type'>> = (props) => (
  <Chart type="line" {...props} />
)

export const BarChart: React.FC<Omit<ChartProps, 'type'>> = (props) => (
  <Chart type="bar" {...props} />
)

export const PieChart: React.FC<Omit<ChartProps, 'type'>> = (props) => (
  <Chart type="pie" {...props} />
)

export const DoughnutChart: React.FC<Omit<ChartProps, 'type'>> = (props) => (
  <Chart type="doughnut" {...props} />
)

// مكون حاوية للرسم البياني
export const ChartContainer: React.FC<{
  children: React.ReactNode
  className?: string
  height?: number | string
  width?: number | string
}> = ({ children, className, height = 300, width = '100%' }) => {
  return (
    <div
      className={cn(
        "flex aspect-video justify-center text-xs",
        className
      )}
      style={{ height, width }}
    >
      {children}
    </div>
  )
}

// تصدير المكونات
// تصدير المكونات
export { Chart as default }
