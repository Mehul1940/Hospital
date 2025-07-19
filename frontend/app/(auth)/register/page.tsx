"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "" 
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!form.username.trim()) {
      newErrors.username = "Username is required"
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
    }
    
    if (!form.password) {
      newErrors.password = "Password is required"
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = "Password must contain an uppercase letter"
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = "Password must contain a number"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "nurse" })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed. Please try again.")
      }
      
      router.push("/login?registered=true")
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        server: err.message || "An unexpected error occurred" 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center justify-center gap-2">
          <User className="h-8 w-8" />
          CREATE ACCOUNT
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.server && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
            <div>
              <strong>Registration Failed:</strong> {errors.server}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-blue-900 mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-blue-700" />
            </div>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 text-blue-900 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.username 
                  ? "border-red-500 focus:ring-red-200" 
                  : "border-blue-700 focus:ring-blue-200"
              }`}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              placeholder="Enter your username"
            />
          </div>
          {errors.username && (
            <p id="username-error" className="mt-1 text-sm text-red-600">
              {errors.username}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-blue-700" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 text-blue-900 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email 
                  ? "border-red-500 focus:ring-red-200" 
                  : "border-blue-700 focus:ring-blue-200"
              }`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-blue-700" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 text-blue-900 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password 
                  ? "border-red-500 focus:ring-red-200" 
                  : "border-blue-700 focus:ring-blue-200"
              }`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {errors.password}
            </p>
          ) : (
            <p className="mt-1 text-xs text-blue-700">
              Must be at least 8 characters with uppercase and number
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white shadow-sm transition flex justify-center items-center ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : "Register"}
        </button>

        <div className="mt-6 text-center text-sm pt-4 border-t border-blue-100">
          <p className="text-blue-600">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}