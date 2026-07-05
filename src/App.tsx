import { Routes, Route, Navigate } from "react-router-dom"
import { useData } from "@/context/DataContext"
import Layout from "@/components/Layout"
import Connect from "@/pages/Connect"
import Dashboard from "@/pages/Dashboard"
import Trends from "@/pages/Trends"
import Recommendations from "@/pages/Recommendations"
import Settings from "@/pages/Settings"
import Notes from "@/pages/Notes"

function App() {
  const { isAuthenticated, showConnect } = useData()

  /* The app shows content immediately — no loading spinner.
     Data loads in the background. If no token exists after 500ms,
     showConnect becomes true and we redirect to /connect. */
  return (
    <Layout>
      <Routes>
        <Route
          path="/connect"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Connect />}
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : showConnect ? (
              <Navigate to="/connect" replace />
            ) : (
              /* Brief grace period — renders nothing while we check for token */
              <div className="min-h-[60dvh] bg-memo-bg" />
            )
          }
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
