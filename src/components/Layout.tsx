import { NavLink } from "react-router-dom"
import {
  Activity,
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  FileText,
  Settings,
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { AnimatePresence, motion } from "framer-motion"

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/recommendations", label: "Care Plan", icon: Lightbulb },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useData()

  return (
    <div className="min-h-[100dvh] bg-memo-bg">
      {/* ====== Top Navigation Bar — ALWAYS VISIBLE ====== */}
      <AnimatePresence>
        {isAuthenticated && (
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E0DA]"
          >
            <div className="flex items-center justify-between px-4 md:px-8 h-16">
              {/* Logo */}
              <NavLink
                to="/"
                className="flex items-center gap-2.5 flex-shrink-0"
              >
                <div className="w-9 h-9 rounded-xl bg-[#8B6F4E] flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-memo-text tracking-tight">
                  Memo
                </span>
              </NavLink>

              {/* Nav Links */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-[#8B6F4E] text-white shadow-md shadow-[#8B6F4E]/25"
                          : "text-memo-text-secondary hover:bg-[#F5EDE3] hover:text-memo-text"
                      }`
                    }
                  >
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    <span className="hidden md:inline">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ====== Main Content — FULL WIDTH ====== */}
      {/* pt-0: Dashboard has its own pt-6 padding. Add top padding on other pages only. */}
      <main className="w-full relative">{children}</main>
    </div>
  )
}
