import Image from "next/image"
import { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left panel - hidden on mobile, shown on medium screens and up */}
      <div 
        className="hidden md:block md:w-1/2 relative bg-gradient-to-r from-blue-900 to-indigo-800"
        aria-hidden="true"
      >
        <Image
          src="/images/pharmacy.jpg"
          alt="Modern pharmacy interior with organized medicine shelves"
          fill
          className="object-cover opacity-90"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-8 text-center">
          <div className="max-w-lg">
            <div 
              className="mb-6 bg-white/10 backdrop-blur-sm p-2 rounded-full w-16 h-16 flex items-center justify-center mx-auto"
              aria-hidden="true"
            >
              <div 
                className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-white text-2xl font-bold">C</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white tracking-tight">
              Welcome to <span className="text-blue-300">CareConnect</span>
            </h1>
            <p className="text-lg text-blue-100 max-w-md mx-auto">
              Your trusted partner for comprehensive healthcare solutions and wellness support.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - main content area */}
      <main className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden flex justify-center">
            <div 
              className="bg-blue-600 rounded-xl w-16 h-16 flex items-center justify-center"
              aria-label="CareConnect logo"
            >
              <span className="text-white text-2xl font-bold">C</span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-600">
            <p>&copy; {currentYear} CareConnect. All rights reserved.</p>
            <nav className="mt-2 space-x-3">
              <a 
                href="/privacy" 
                className="text-blue-600 hover:underline transition-colors duration-200"
                aria-label="Privacy Policy"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="text-blue-600 hover:underline transition-colors duration-200"
                aria-label="Terms of Service"
              >
                Terms of Service
              </a>
            </nav>
          </footer>
        </div>
      </main>
    </div>
  )
}