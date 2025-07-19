"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, server?: string}>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = () => {
    const newErrors: {email?: string} = {}
    
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail()) return
    
    setIsLoading(true)
    setMessage(null)
    setErrors({})
    
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage("Password reset instructions have been sent to your email.")
        setIsSuccess(true)
      } else {
        setErrors({
          server: data.email?.[0] || 
                 data.detail || 
                 "Failed to send reset instructions. Please try again."
        })
      }
    } catch (err) {
      setErrors({
        server: "Network error. Please check your connection and try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-blue-900">Forgot Password?</h1>
        <p className="mt-2 text-blue-700">
          Enter your email to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.server && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center">
            <div>
              <strong>Error:</strong> {errors.server}
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="font-medium">{message}</p>
              <p className="mt-3 text-sm">
                Didn't receive the email?{" "}
                <button 
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="font-medium text-green-800 hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        ) : (
          <>
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
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-blue-900 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email 
                      ? "border-red-500 focus:ring-red-200" 
                      : "border-blue-300 focus:ring-blue-200"
                  }`}
                  placeholder="your.email@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email}
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
                  Sending instructions...
                </>
              ) : "Send Reset Instructions"}
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <Link 
            href="/login" 
            className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}