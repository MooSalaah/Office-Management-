"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/ui/chart"
import { Transaction } from "@/lib/types"
import { TrendingUp, TrendingDown } from "lucide-react"

interface FinancialChartProps {
    transactions: Transaction[]
}

export function FinancialChart({ transactions }: FinancialChartProps) {
    const chartData = useMemo(() => {
        // Group by month (last 6 months)
        const months = []
        const incomeData = []
        const expenseData = []

        const today = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
            const monthName = d.toLocaleDateString('ar-SA', { month: 'short' })
            months.push(monthName)

            const monthIncome = transactions
                .filter(t => {
                    const tDate = new Date(t.date)
                    return t.type === 'income' &&
                        tDate.getMonth() === d.getMonth() &&
                        tDate.getFullYear() === d.getFullYear()
                })
                .reduce((sum, t) => sum + t.amount, 0)

            const monthExpense = transactions
                .filter(t => {
                    const tDate = new Date(t.date)
                    return t.type === 'expense' &&
                        tDate.getMonth() === d.getMonth() &&
                        tDate.getFullYear() === d.getFullYear()
                })
                .reduce((sum, t) => sum + t.amount, 0)

            incomeData.push(monthIncome)
            expenseData.push(monthExpense)
        }

        return {
            labels: months,
            datasets: [
                {
                    label: 'الدخل',
                    data: incomeData,
                    backgroundColor: 'hsla(142, 76%, 36%, 0.2)', // Green with opacity
                    borderColor: 'hsl(142, 76%, 36%)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'المصروفات',
                    data: expenseData,
                    backgroundColor: 'hsla(0, 84%, 60%, 0.2)', // Red with opacity
                    borderColor: 'hsl(0, 84%, 60%)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                }
            ]
        }
    }, [transactions])

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>التحليل المالي</CardTitle>
                <CardDescription>مقارنة الدخل والمصروفات لآخر 6 أشهر</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <LineChart
                    data={chartData}
                    height={350}
                    options={{
                        plugins: {
                            legend: {
                                position: 'top',
                                align: 'end',
                                labels: {
                                    font: {
                                        family: 'inherit'
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value: any) => `${value.toLocaleString()} ر.س`
                                }
                            }
                        }
                    }}
                />
                <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">إجمالي الدخل</p>
                            <p className="font-bold text-green-600">{totalIncome.toLocaleString()} ر.س</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                            <p className="font-bold text-red-600">{totalExpense.toLocaleString()} ر.س</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
