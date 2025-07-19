// hooks/useAuthRedirect.ts
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function useAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/login') // use replace to avoid back going to protected page
    }
  }, [router])
}
