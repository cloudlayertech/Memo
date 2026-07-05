import { Routes, Route, Navigate } from "react-router-dom"
import { useData } from "@/context/DataContext"
import Layout from "@/components/Layout"
import Connect from "@/pages/Connect"
import Dashboard from "@/pages/Dashboard"
import Trends from "@/pages/Trends"
import Recommendations from "@/pages/Recommendations"
import Settings from "@/pages/Settings"
import Notes from "@/pages/Notes"
import { RefreshCw } from "lucide-react"

function App() {
  const { isAuthenticated, initializing } = useData()

  /* Show loading screen while checking for stored token — prevents
     blank page flash or premature redirect to /connect */
  if (initializing) {
    return (
      <div className="min-h-[100dvh] bg-memo-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#8B6F4E] animate-spin mx-auto mb-3" />
          <p className="text-lg text-memo-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/connect"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Connect />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/connect" replace />}
        />
        <Route
          path="/trends"
          element={isAuthenticated ? <Trends /> : <Navigate to="/connect" replace />}
        />
        <Route
          path="/recommendations"
          element={isAuthenticated ? <Recommendations /> : <Navigate to="/connect" replace />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/connect" replace />}
        />
        <Route
          path="/notes"
          element={isAuthenticated ? <Notes /> : <Navigate to="/connect" replace />}
        />
      </Routes>
    </Layout>
  )
}

export default App
