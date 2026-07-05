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
  initialLoadDone: boolean
  showConnect: boolean
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
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const isAuthenticated = !!token
  // initializing is kept for backward compat but always false — content shows immediately
  const initializing = false

  // Use a ref to track personalInfo without creating a useCallback
  // dependency cycle. loadData sets personalInfo, which would otherwise
  // change loadData's reference and re-trigger the data-loading effect.
  const personalInfoRef = useRef(personalInfo)
  personalInfoRef.current = personalInfo

  const loadData = useCallback(
    async (accessToken: string, date: string) => {
      // Don't block if we already have data for this date
      if (metrics?.date === date && metrics?.sleep !== undefined) {
        setInitialLoadDone(true)
        return // Already have data, fetch in background
      }

      setLoading(true)
      setError(null)
      try {
        const cachedInfo = personalInfoRef.current
        const [metricsResult, info] = await Promise.all([
          fetchDailyMetrics(accessToken, date),
          cachedInfo ? Promise.resolve(cachedInfo) : fetchPersonalInfo(accessToken),
        ])
        setMetrics(metricsResult.metrics)
        setEndpointStatus(metricsResult.status)
        setPersonalInfo(info)
        setInitialLoadDone(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics]
  )

  // If no token after 500ms, show Connect page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token && !getStoredToken()) {
        setShowConnect(true)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [token])

  // Load data when token becomes available or date changes
  useEffect(() => {
    if (token) {
      // Small delay to let React render first — prevents blank page
      const timer = setTimeout(() => {
        loadData(token.accessToken, selectedDate)
      }, 100)
      return () => clearTimeout(timer)
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
    setInitialLoadDone(false)
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
        initialLoadDone,
        showConnect,
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
