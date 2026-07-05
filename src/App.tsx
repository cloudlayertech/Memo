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
  const { isAuthenticated } = useData()

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
