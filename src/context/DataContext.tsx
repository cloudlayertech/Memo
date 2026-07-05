import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
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
  connect: () => void
  disconnect: () => void
  selectDate: (date: string) => void
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<OuraToken | null>(getStoredToken)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const isAuthenticated = !!token

  const loadData = useCallback(
    async (accessToken: string, date: string) => {
      setLoading(true)
      setError(null)
      try {
        const [metricsResult, info] = await Promise.all([
          fetchDailyMetrics(accessToken, date, (status) => setEndpointStatus(status)),
          personalInfo ? Promise.resolve(personalInfo) : fetchPersonalInfo(accessToken),
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
    [personalInfo]
  )

  useEffect(() => {
    const oauthToken = parseOAuthCallback()
    if (oauthToken) {
      // parseOAuthCallback already stored the token in localStorage
      setToken(oauthToken)
    } else {
      // Check if we already have a stored token (e.g. from previous session)
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
