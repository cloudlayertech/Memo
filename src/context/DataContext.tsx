import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { DailyMetrics, PersonalInfo, OuraToken } from "@/types/oura"
import {
  parseOAuthCallback,
  getStoredToken,
  setStoredToken,
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
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const isAuthenticated = !!token

  const loadData = useCallback(
    async (accessToken: string, date: string) => {
      setLoading(true)
      setError(null)
      try {
        const [metricsData, info] = await Promise.all([
          fetchDailyMetrics(accessToken, date),
          personalInfo ? Promise.resolve(personalInfo) : fetchPersonalInfo(accessToken),
        ])
        setMetrics(metricsData)
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
      setStoredToken(oauthToken)
      setToken(oauthToken)
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
