'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Hospital, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Blinds,
  Stethoscope,
  Bed,
  Mouse,
  Users,
  UserPlus,
  Handshake,
  MonitorSmartphone,
  ClipboardPlus,
} from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { name: "Hospitals", icon: Hospital, href: "/admin/hospitals" },
  { name: "Buildings", icon: Building2, href: "/admin/buildings" },
  { name: "Floors", icon: Blinds, href: "/admin/floors" },
  { name: "Wards", icon: Stethoscope, href: "/admin/wards" },
  { name: "Beds", icon: Bed, href: "/admin/beds" },
  { name: "Devices", icon: Mouse, href: "/admin/devices" },
  { name: "Staffs", icon: Users, href: "/admin/staffteams" },
  { name: "Nurses", icon: UserPlus, href: "/admin/nurses" },
  { name: "Assignments", icon: Handshake, href: "/admin/team_assignments" },
  { name: "Calls", icon: MonitorSmartphone, href: "/admin/calls" },
  { name: "Patients", icon: ClipboardPlus, href: "/admin/patients" },
];

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen
}: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}) {
  const pathname = usePathname()
  const [activeItem, setActiveItem] = useState(pathname)
  const [isHovering, setIsHovering] = useState(false)
  
  useEffect(() => {
    setActiveItem(pathname)
  }, [pathname])
  
  useEffect(() => {
    if (sidebarOpen && window.innerWidth > 768) {
      setMobileMenuOpen(false)
    }
  }, [sidebarOpen, setMobileMenuOpen])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-xl transition-all duration-300 z-30 ${
          sidebarOpen ? "w-64" : "w-20"
        } hidden md:flex flex-col`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Clickable logo area for collapse */}
        <div 
          className="p-5 border-b border-slate-700 flex items-center cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-3 flex-1 flex items-center justify-between"
              >
                <div>
                  <h1 className="font-bold text-xl">CareConnect</h1>
                  <p className="text-xs text-slate-400">Nurse Calling Systems</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-slate-400" />
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarOpen && (
            <ChevronRight className="h-5 w-5 ml-1 text-slate-400" />
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    activeItem === item.href 
                      ? "bg-cyan-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700"
                  } ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`ml-4 ${!sidebarOpen ? "hidden" : "block"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          >
           <motion.div 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25 }}
                className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-lg z-50 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >

              <div 
                className="p-5 border-b border-slate-700 flex items-center cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="ml-3 flex-1 flex items-center justify-between">
                  <div>
                    <h1 className="font-bold text-xl">CareConnect</h1>
                    <p className="text-xs text-slate-400">Nurse Calling System</p>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              
             <div className="flex-1 overflow-y-auto">
                <nav className="py-4 px-2">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center p-3 rounded-lg transition-all ${
                            activeItem === item.href 
                              ? "bg-cyan-600 text-white shadow-lg"
                              : "text-slate-300 hover:bg-slate-700"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-4">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="p-4 border-t border-slate-700">
                  <button className="w-full flex items-center justify-center p-3 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors">
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}