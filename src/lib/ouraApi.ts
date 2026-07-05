import type {
  OuraToken, SleepDayData, ReadinessDayData, ActivityDayData,
  HeartRateDataPoint, WorkoutData, SpO2DayData, StressDayData,
  ResilienceDayData, PersonalInfo, DailyMetrics,
} from "@/types/oura"
import { getNextDay, toIsoDate } from "./utils"

const CLIENT_ID = "c64fde91-0fa4-4a71-b8bb-35617aeb408e"
const OURA_BASE = "https://api.ouraring.com/v2/usercollection"

// All Oura API v2 scopes
const OURA_SCOPES = [
  "daily_activity",
  "daily_readiness",
  "daily_sleep",
  "daily_spo2",
  "daily_stress",
  "daily_resilience",
  "heartrate",
  "workout",
  "personal_info",
]

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname
}

export function getOuraAuthUrl(): string {
  const redirect = encodeURIComponent(getRedirectUri())
  const scope = OURA_SCOPES.join("+")
  return `https://cloud.ouraring.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=token&scope=${scope}`
}

export function parseOAuthCallback(): OuraToken | null {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return null
  const params = new URLSearchParams(hash.slice(1))
  const accessToken = params.get("access_token")
  const expiresIn = params.get("expires_in")
  if (!accessToken) return null
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  return {
    accessToken,
    expiresAt: Date.now() + (Number(expiresIn) || 86400) * 1000,
  }
}

const TOKEN_KEY = "memo_oura_token"

export function setStoredToken(token: OuraToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function getStoredToken(): OuraToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const token: OuraToken = JSON.parse(raw)
    if (token.expiresAt && token.expiresAt < Date.now()) {
      clearStoredToken()
      return null
    }
    return token
  } catch {
    return null
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// === CORS Proxy Strategy ===
// GitHub Pages is static hosting and Oura's API blocks cross-origin requests.
// We ALWAYS route requests through a CORS proxy that forwards headers.
// Primary:  allorigins.win  (fast, reliable, forwards headers)
// Backup:   corsproxy.io   (fallback if primary fails)

const PRIMARY_PROXY = "https://api.allorigins.win/raw?url="
const BACKUP_PROXY = "https://corsproxy.io/?"
const REQUEST_TIMEOUT_MS = 15000

function buildProxyUrl(proxyBase: string, targetUrl: string): string {
  return proxyBase + encodeURIComponent(targetUrl)
}

function isGitHubPages(): boolean {
  return typeof window !== "undefined" && window.location.hostname.includes("github.io")
}

// Fetch with timeout. Rejects if the request takes longer than timeoutMs.
function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    fetch(url, init)
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// Core fetch through CORS proxy.
// Always uses the proxy (no direct fetch attempt).
// Returns { ok, data, error } — never throws.
async function tryFetch(url: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }

  const credentials: RequestCredentials = "omit"

  console.log(`[Memo] ${isGitHubPages() ? "GitHub Pages" : "local"} - fetching via proxy: ${url}`)

  // --- Try primary proxy (allorigins) ---
  try {
    const proxyUrl = buildProxyUrl(PRIMARY_PROXY, url)
    const res = await fetchWithTimeout(
      proxyUrl,
      { method: "GET", headers, credentials },
      REQUEST_TIMEOUT_MS
    )

    if (res.ok) {
      const data = await res.json()
      console.log(`[Memo] Primary proxy OK: ${url}`)
      return { ok: true, data }
    }

    // 401 Unauthorized -> token expired
    if (res.status === 401) {
      console.warn(`[Memo] 401 from Oura API - token expired: ${url}`)
      return { ok: false, error: "TOKEN_EXPIRED" }
    }

    // 404 Not Found -> no data for that day (treat as success with empty data)
    if (res.status === 404) {
      console.log(`[Memo] 404 from Oura API - no data for this day: ${url}`)
      return { ok: true, data: { data: [] } }
    }

    // Other HTTP errors -> log and try backup proxy
    console.warn(`[Memo] Primary proxy HTTP ${res.status}: ${url}`)
  } catch (err: any) {
    console.warn(`[Memo] Primary proxy failed (${err?.message || "network error"}), trying backup: ${url}`)
  }

  // --- Try backup proxy (corsproxy.io) ---
  try {
    const proxyUrl = buildProxyUrl(BACKUP_PROXY, url)
    const res = await fetchWithTimeout(
      proxyUrl,
      { method: "GET", headers, credentials },
      REQUEST_TIMEOUT_MS
    )

    if (res.ok) {
      const data = await res.json()
      console.log(`[Memo] Backup proxy OK: ${url}`)
      return { ok: true, data }
    }

    if (res.status === 401) {
      console.warn(`[Memo] 401 from Oura API (backup) - token expired: ${url}`)
      return { ok: false, error: "TOKEN_EXPIRED" }
    }

    if (res.status === 404) {
      console.log(`[Memo] 404 from Oura API (backup) - no data for this day: ${url}`)
      return { ok: true, data: { data: [] } }
    }

    console.warn(`[Memo] Backup proxy HTTP ${res.status}: ${url}`)
    return { ok: false, error: `HTTP ${res.status} from Oura API via backup proxy` }
  } catch (err: any) {
    console.error(`[Memo] Backup proxy also failed (${err?.message || "network error"}): ${url}`)
    return { ok: false, error: `All CORS proxies failed (${err?.message || "network error"}). Direct API calls are blocked on GitHub Pages.` }
  }
}

// Safe fetch wrapper - returns empty/default on failure, never throws
async function safeFetch<T>(
  _name: string,
  endpoint: string,
  token: string,
  extract: (data: any) => T,
  fallback: T
): Promise<{ data: T; status: string }> {
  const result = await tryFetch(`${OURA_BASE}${endpoint}`, token)
  if (result.ok && result.data) {
    try {
      const extracted = extract(result.data)
      return { data: extracted, status: "loaded" }
    } catch (e) {
      return { data: fallback, status: `parse error: ${(e as Error).message}` }
    }
  }
  if (result.error === "TOKEN_EXPIRED") {
    throw Object.assign(new Error("TOKEN_EXPIRED"), { code: "TOKEN_EXPIRED" })
  }
  return { data: fallback, status: result.error || "failed" }
}

function dateRange(start: string, end: string) {
  return `?start_date=${start}&end_date=${end}`
}

function dateTimeRange(start: string, end: string) {
  return `?start_datetime=${start}T00:00:00&end_datetime=${end}T23:59:59`
}

export async function fetchPersonalInfo(token: string): Promise<PersonalInfo | null> {
  const result = await safeFetch(
    "personal_info",
    "/personal_info",
    token,
    (d) => d as PersonalInfo,
    null
  )
  return result.data
}

// Type for per-endpoint status tracking
export interface EndpointStatus {
  sleep: string
  readiness: string
  activity: string
  heartRate: string
  workout: string
  spo2: string
  stress: string
  resilience: string
  personalInfo: string
}

export async function fetchDailyMetrics(
  token: string,
  date: string,
  onStatus?: (status: EndpointStatus) => void
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  const start = date
  const end = date

  const status: EndpointStatus = {
    sleep: "loading",
    readiness: "loading",
    activity: "loading",
    heartRate: "loading",
    workout: "loading",
    spo2: "loading",
    stress: "loading",
    resilience: "loading",
    personalInfo: "loading",
  }

  const update = (key: keyof EndpointStatus, value: string) => {
    status[key] = value
    onStatus?.({ ...status })
  }

  // Fetch all endpoints independently
  const sleepResult = await safeFetch(
    "sleep", `/daily_sleep${dateRange(start, end)}`, token,
    (d) => (d.data || []) as SleepDayData[], []
  )
  update("sleep", sleepResult.status)

  const readinessResult = await safeFetch(
    "readiness", `/daily_readiness${dateRange(start, end)}`, token,
    (d) => (d.data || []) as ReadinessDayData[], []
  )
  update("readiness", readinessResult.status)

  const activityResult = await safeFetch(
    "activity", `/daily_activity${dateRange(start, end)}`, token,
    (d) => (d.data || []) as ActivityDayData[], []
  )
  update("activity", activityResult.status)

  const hrResult = await safeFetch(
    "heartrate", `/heartrate${dateTimeRange(start, end)}`, token,
    (d) => (d.data || []) as HeartRateDataPoint[], []
  )
  update("heartRate", hrResult.status)

  const workoutResult = await safeFetch(
    "workout", `/workout${dateRange(start, end)}`, token,
    (d) => (d.data || []) as WorkoutData[], []
  )
  update("workout", workoutResult.status)

  const spo2Result = await safeFetch(
    "spo2", `/daily_spo2${dateRange(start, end)}`, token,
    (d) => (d.data || []) as SpO2DayData[], []
  )
  update("spo2", spo2Result.status)

  const stressResult = await safeFetch(
    "stress", `/daily_stress${dateRange(start, end)}`, token,
    (d) => (d.data || []) as StressDayData[], []
  )
  update("stress", stressResult.status)

  const resilienceResult = await safeFetch(
    "resilience", `/daily_resilience${dateRange(start, end)}`, token,
    (d) => (d.data || []) as ResilienceDayData[], []
  )
  update("resilience", resilienceResult.status)

  // Build maps
  const sleepMap = new Map<string, SleepDayData>()
  for (const d of sleepResult.data) sleepMap.set(d.day, d)

  const readinessMap = new Map<string, ReadinessDayData>()
  for (const d of readinessResult.data) readinessMap.set(d.day, d)

  const activityMap = new Map<string, ActivityDayData>()
  for (const d of activityResult.data) activityMap.set(d.day, d)

  const spo2Map = new Map<string, SpO2DayData>()
  for (const d of spo2Result.data) spo2Map.set(d.day, d)

  const stressMap = new Map<string, StressDayData>()
  for (const d of stressResult.data) stressMap.set(d.day, d)

  const resilienceMap = new Map<string, ResilienceDayData>()
  for (const d of resilienceResult.data) resilienceMap.set(d.day, d)

  const nextDay = getNextDay(date)

  const sleep = sleepMap.get(date) || null
  const readiness = readinessMap.get(nextDay) || readinessMap.get(date) || null
  const activity = activityMap.get(date) || null
  const heartRate = calculateHeartRateMetrics(hrResult.data)
  const workouts = workoutResult.data.length > 0 ? buildWorkoutSummary(workoutResult.data) : null
  const spo2 = spo2Map.get(date) || null
  const stress = stressMap.get(date) || null
  const resilience = resilienceMap.get(date) || null

  const metrics: DailyMetrics = {
    date,
    sleep: sleep ? { score: sleep.score, totalDuration: sleep.total_sleep_duration, deepDuration: sleep.deep_sleep_duration, remDuration: sleep.rem_sleep_duration, lightDuration: sleep.light_sleep_duration, latency: sleep.latency, efficiency: sleep.efficiency } : null,
    readiness: readiness ? { score: readiness.score, temperatureDeviation: readiness.temperature_deviation, restingHR: readiness.resting_heart_rate, hrvBalance: readiness.hrv_balance } : null,
    activity: activity ? { score: activity.score, steps: activity.steps, activeCalories: activity.calories_active, totalCalories: activity.total_calories, highIntensityMin: activity.high_intensity_minutes, distance: activity.equivalent_walking_distance } : null,
    heartRate,
    spo2: spo2 ? { average: spo2.average, breathingDisturbanceIndex: spo2.breathing_disturbance_index } : null,
    stress: stress ? { stressHigh: stress.stress_high, recoveryHigh: stress.recovery_high, daySummary: stress.day_summary } : null,
    resilience: resilience ? { score: resilience.score, level: resilience.level } : null,
    workouts,
  }

  return { metrics, status }
}

function calculateHeartRateMetrics(hrData: HeartRateDataPoint[]): { resting: number; avg: number; min: number; max: number } | null {
  if (!hrData || hrData.length === 0) return null
  const bpms = hrData.map((d) => d.bpm)
  const sorted = [...bpms].sort((a, b) => a - b)
  const resting = Math.round(sorted[Math.floor(sorted.length * 0.1)])
  const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length)
  const min = Math.min(...bpms)
  const max = Math.max(...bpms)
  return { resting, avg, min, max }
}

function buildWorkoutSummary(workouts: WorkoutData[]): { activity: string; calories: number; duration: number; distance: number }[] {
  return workouts.map((w) => {
    const start = new Date(w.start_datetime).getTime()
    const end = new Date(w.end_datetime).getTime()
    const duration = Math.round((end - start) / 60000)
    return { activity: w.activity, calories: w.calories, duration, distance: w.distance }
  })
}

export async function fetchWeeklyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d).then((r) => r.metrics)))
  return results
}

export async function fetchMonthlyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d).then((r) => r.metrics)))
  return results
}
