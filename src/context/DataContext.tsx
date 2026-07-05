import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { DailyMetrics, PersonalInfo, OuraToken } from "@/types/oura"
import type { EndpointStatus } from "@/lib/ouraApi"
import {
  parseOAuthCallback,
  getStoredToken,
  clearStoredToken,
  fetchDailyMetrics,
  fetchPersonalInfo,
} from "@/lib/ouraApi"
import { todayStr } from "@/lib/utils"

interface DataContextType {
  token: OuraToken | null
  personalInfo: PersonalInfo | null
  metrics: DailyMetrics | null
  loading: boolean
  error: string | null
  endpointStatus: EndpointStatus | null
  selectedDate: string
  isAuthenticated: boolean
  initializing: boolean
  connect: () => void
  disconnect: () => void
  selectDate: (date: string) => void
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer: check OAuth callback (URL hash) FIRST, then fall back to
  // localStorage. This runs synchronously BEFORE the first render so the token
  // is available immediately — no flash of unauthenticated content / blank page.
  const [token, setToken] = useState<OuraToken | null>(() => {
    const oauthToken = parseOAuthCallback()
    return oauthToken || getStoredToken()
  })
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [initializing, setInitializing] = useState(true)
  const isAuthenticated = !!token

  // Use a ref to track personalInfo without creating a useCallback
  // dependency cycle. loadData sets personalInfo, which would otherwise
  // change loadData's reference and re-trigger the data-loading effect.
  const personalInfoRef = useRef(personalInfo)
  personalInfoRef.current = personalInfo

  const loadData = useCallback(
    async (accessToken: string, date: string) => {
      setLoading(true)
      setError(null)
      try {
        const cachedInfo = personalInfoRef.current
        const [metricsResult, info] = await Promise.all([
          fetchDailyMetrics(accessToken, date, (status) => setEndpointStatus(status)),
          cachedInfo ? Promise.resolve(cachedInfo) : fetchPersonalInfo(accessToken),
        ])
        setMetrics(metricsResult.metrics)
        setEndpointStatus(metricsResult.status)
        setPersonalInfo(info)
      } catch (err: any) {
        if (err.code === "TOKEN_EXPIRED" || err.message?.includes("TOKEN_EXPIRED")) {
          clearStoredToken()
          setToken(null)
          setError("Your session expired. Please connect your Oura Ring again.")
        } else {
          setError(err.message || "Failed to load data")
        }
      } finally {
        setLoading(false)
      }
    },
    // Intentionally empty: personalInfo is accessed via ref to avoid
    // circular deps that cause double-fetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    // Safety net: the lazy initializer in useState already checked OAuth
    // callback + localStorage before the first render. This effect handles
    // edge cases (e.g., StrictMode double-mount) and marks init complete.
    setInitializing(false)

    // If token is still null after lazy init, try one more time via
    // localStorage (covers edge cases where lazy init missed it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (!token) {
      const stored = getStoredToken()
      if (stored) setToken(stored)
    }
  }, [])

  useEffect(() => {
    if (token) {
      loadData(token.accessToken, selectedDate)
    }
  }, [token, selectedDate, loadData])

  const connect = useCallback(() => {
    import("@/lib/ouraApi").then(({ getOuraAuthUrl }) => {
      window.location.href = getOuraAuthUrl()
    })
  }, [])

  const disconnect = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setPersonalInfo(null)
    setMetrics(null)
    setError(null)
    setEndpointStatus(null)
    // No need to reload — route guards will redirect to /connect
    // when isAuthenticated becomes false
  }, [])

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const refreshData = useCallback(async () => {
    if (!token) return
    await loadData(token.accessToken, selectedDate)
  }, [token, selectedDate, loadData])

  return (
    <DataContext.Provider
      value={{
        token,
        personalInfo,
        metrics,
        loading,
        error,
        endpointStatus,
        selectedDate,
        isAuthenticated,
        initializing,
        connect,
        disconnect,
        selectDate,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
