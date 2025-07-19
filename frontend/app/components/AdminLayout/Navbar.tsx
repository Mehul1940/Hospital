// components/Navbar.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Menu, LogOut, User, Settings, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { BASE_URL } from '@/app/utils/api'
import Link from 'next/link'

interface NavbarProps {
  username: string | null
  setMobileMenuOpen: (open: boolean) => void
}

const Navbar: React.FC<NavbarProps> = ({ username, setMobileMenuOpen }) => {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = () => {
    if (!username) return 'AU'
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const response = await fetch(`${BASE_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Logout failed')
      }

      // Clear tokens and user data
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      
      // Redirect to login
      router.push('/login')
      
    } catch (error: any) {
      console.error('Logout error:', error)
      // Fallback to client-side cleanup if API fails
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('username')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 md:px-6 py-3">
        <div className="flex items-center">
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
          </button>
          <h1 className="ml-5 md:ml-15 text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 truncate">Healthcare Dashboard</h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-1 sm:space-x-2 focus:outline-none"
              disabled={loading}
              aria-label="User menu"
            >
              <div className="bg-indigo-500 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-sm sm:text-base">
                {getInitials()}
              </div>
              <span className="hidden sm:inline-block text-gray-700 font-medium text-sm md:text-base truncate max-w-24 sm:max-w-32 md:max-w-none">
                {username || 'Admin'}
              </span>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg z-50 overflow-hidden"
                >
                  <div className="px-3 sm:px-4 py-2 sm:py-3">
                    <p className="text-gray-800 font-medium text-sm sm:text-base truncate">{username || 'Admin User'}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">Administrator</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Link href="/change-password">
                      <button className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-50 flex items-center space-x-2">
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-700 text-xs sm:text-sm">Change Password</span>
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className={`w-full text-left px-3 sm:px-4 py-2 flex items-center space-x-2 ${
                        loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-50'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                      ) : (
                        <LogOut className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-red-600 text-xs sm:text-sm">
                        {loading ? 'Signing out...' : 'Sign Out'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar