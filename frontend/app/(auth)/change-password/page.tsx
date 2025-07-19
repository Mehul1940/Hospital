"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Key, ShieldCheck } from "lucide-react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: ""
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Calculate password strength in real-time
  const calculatePasswordStrength = useCallback((password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    return strength
  }, [])

  const validate = () => {
    const newErrors: Record<string, string[]> = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = ["Current password is required"]
    }

    if (formData.newPassword.length < 8) {
      newErrors.newPassword = ["Password must be at least 8 characters"]
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = ["Must contain an uppercase letter"]
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = ["Must contain a number"]
    } else if (!/[^A-Za-z0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = ["Must contain a special character"]
    }

    if (formData.newPassword !== formData.confirm) {
      newErrors.confirm = ["Passwords do not match"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-password/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          old_password: formData.oldPassword,
          new_password: formData.newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        setTimeout(() => router.push("/login"), 2000)
      } else {
        handleApiErrors(data)
      }
    } catch (err) {
      setErrors({ general: ["Network error. Please try again later."] })
    } finally {
      setLoading(false)
    }
  }

  const handleApiErrors = (data: any) => {
    const apiErrors: Record<string, string[]> = {}

    if (data.old_password) {
      apiErrors.oldPassword = Array.isArray(data.old_password)
        ? data.old_password
        : [data.old_password]
    }

    if (data.new_password) {
      apiErrors.newPassword = Array.isArray(data.new_password)
        ? data.new_password
        : [data.new_password]
    }

    if (data.detail) {
      apiErrors.general = [data.detail]
    }

    if (Object.keys(apiErrors).length === 0) {
      apiErrors.general = ["Failed to change password. Please try again."]
    }

    setErrors(apiErrors)
  }

  const handleChange = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setFormData(prev => ({ ...prev, [field]: value }))
      
      // Update password strength for new password field
      if (field === "newPassword") {
        setPasswordStrength(calculatePasswordStrength(value))
      }
      
      // Clear errors when typing
      if (errors[field]) {
        const newErrors = { ...errors }
        delete newErrors[field]
        setErrors(newErrors)
      }
    }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) =>
    () => {
      setShowPasswords(prev => ({
        ...prev,
        [field]: !prev[field]
      }))
    }

  // Password strength indicators
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500"
  ]
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Medium",
    "Strong",
    "Very Strong"
  ]

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="mx-auto bg-cyan-50 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <ShieldCheck className="text-cyan-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Change Password
        </h2>
        <p className="text-gray-500 mt-2">
          Secure your account with a new password
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {errors.general.map((err, i) => (
            <p key={i} className="text-center font-medium">{err}</p>
          ))}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 bg-green-50 text-green-600 rounded-lg border border-green-100 text-center">
          Password changed successfully! Redirecting to login...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { 
            label: "Current Password", 
            field: "oldPassword", 
            showField: "old",
            icon: <Lock className="text-gray-400" size={18} />,
            placeholder: "Enter your current password"
          },
          { 
            label: "New Password", 
            field: "newPassword", 
            showField: "new",
            icon: <Key className="text-gray-400" size={18} />,
            placeholder: "Create a strong password"
          },
          { 
            label: "Confirm New Password", 
            field: "confirm", 
            showField: "confirm",
            icon: <Lock className="text-gray-400" size={18} />,
            placeholder: "Re-enter your new password"
          }
        ].map(({ label, field, showField, icon, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {label}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {icon}
              </div>
              <input
                type={showPasswords[showField as keyof typeof showPasswords] ? "text" : "password"}
                value={formData[field as keyof typeof formData]}
                onChange={handleChange(field as keyof typeof formData)}
                disabled={loading || success}
                className="w-full p-3 border rounded-lg disabled:opacity-70 pl-10 pr-10 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder={placeholder}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility(showField as keyof typeof showPasswords)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showPasswords[showField as keyof typeof showPasswords]
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            </div>
            {errors[field] && errors[field].map((err, i) => (
              <p key={i} className="text-red-500 text-sm mt-1 flex items-start">
                <span className="mr-1">•</span> {err}
              </p>
            ))}

            {/* Password strength meter for new password */}
            {field === "newPassword" && formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <div className="text-sm font-medium text-gray-700 mr-2">
                    Strength: 
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {strengthLabels[passwordStrength]}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${strengthColors[passwordStrength]}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {passwordStrength < 3 && "Include uppercase, numbers & special characters"}
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-lg hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-md"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating Password...
            </>
          ) : "Change Password"}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading || success}
            className="text-cyan-600 hover:text-cyan-800 text-sm font-medium disabled:opacity-50"
          >
            ← Back to previous page
          </button>
        </div>
      </form>
    </div>
  )
}