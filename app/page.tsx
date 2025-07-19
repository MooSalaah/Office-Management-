"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Lock, User, AlertCircle, RefreshCw } from "lucide-react"
import { login, updateUserPermissionsByRole } from "@/lib/auth"
import { useAppActions } from "@/lib/context/AppContext"
import { resetToDefaultData, showCurrentData } from "@/lib/init-default-data"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setCurrentUser } = useAppActions()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("Login form submitted with:", { email, password })

    try {
      const user = login(email, password)
      console.log("Login result:", user)
      
      if (user) {
        // Update user permissions based on current role
        const updatedUser = updateUserPermissionsByRole(user)
        console.log("Updated user:", updatedUser)
        
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setCurrentUser(updatedUser)
        
        console.log("User set in context, redirecting...")
        
        // Force redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard")
        }, 100)
      } else {
        console.log("Login failed - no user returned")
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetData = () => {
    resetToDefaultData()
    showCurrentData()
    alert("تم إعادة تعيين البيانات الافتراضية بنجاح!")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            نظام إدارة المكتب الهندسي
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            سجل دخولك للوصول إلى النظام
          </CardDescription>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p className="font-semibold mb-2">بيانات تسجيل الدخول الافتراضية:</p>
            <div className="space-y-1 text-xs">
              <p><strong>مدير:</strong> admin@newcorner.sa / admin123</p>
              <p><strong>مهندس:</strong> engineer@newcorner.sa / engineer123</p>
              <p><strong>محاسب:</strong> accountant@newcorner.sa / accountant123</p>
              <p><strong>موارد بشرية:</strong> hr@newcorner.sa / hr123</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@newcorner.sa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleResetData}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة تعيين البيانات الافتراضية
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
