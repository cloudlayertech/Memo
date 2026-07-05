import { NavLink } from "react-router-dom"
import { LayoutDashboard, TrendingUp, Lightbulb, Settings } from "lucide-react"
import { useData } from "@/context/DataContext"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/recommendations", label: "Tips", icon: Lightbulb },
  { to: "/settings", label: "Settings", icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useData()

  return (
    <div className="min-h-[100dvh] bg-memo-bg text-memo-text flex flex-col">
      <main className="flex-1 pb-20 md:pb-6">{children}</main>

      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-memo-bg z-50 md:hidden">
          <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                    isActive ? "text-primary" : "text-memo-text-tertiary"
                  }`
                }
              >
                <item.icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
