import type {
  OuraToken, PersonalInfo, DailyMetrics,
} from "@/types/oura"
import { getNextDay, toIsoDate } from "./utils"

const CLIENT_ID = "c64fde91-0fa4-4a71-b8bb-35617aeb408e"
const OURA_BASE = "https://api.ouraring.com/v2/usercollection"

const OURA_SCOPES = [
  "daily",
  "heartrate",
  "workout",
  "personal",
  "spo2",
  "stress",
  "email",
]

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname
}

export function getOuraAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "token",
    scope: OURA_SCOPES.join(" "),
  })
  return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`
}

export function parseOAuthCallback(): OuraToken | null {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return null
  // HashRouter format: #/path or #access_token=...
  // After OAuth redirect, hash is: #access_token=xxx&token_type=bearer...
  // We need to check if the hash contains an access_token

  // Remove the leading # if present
  const hashContent = hash.startsWith("#/") ? hash.slice(2) : hash.slice(1)

  // Check if this looks like an OAuth callback (has access_token)
  if (!hashContent.includes("access_token")) return null

  const params = new URLSearchParams(hashContent)
  const accessToken = params.get("access_token")
  const expiresIn = params.get("expires_in")

  if (!accessToken) return null

  // Store token
  const token: OuraToken = {
    accessToken,
    expiresAt: Date.now() + (Number(expiresIn) || 86400) * 1000,
  }
  setStoredToken(token)

  // Clear the hash WITHOUT reloading the page
  // Use replaceState to clean the token from the URL
  window.history.replaceState({}, document.title, window.location.pathname + "#/")

  return token
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

const PRIMARY_PROXY = "https://corsproxy.io/?"
const BACKUP_PROXY = "https://api.allorigins.win/raw?url="
const REQUEST_TIMEOUT_MS = 15000

// ── Request deduplication cache ──────────────────────────────────────
// Module-level cache persists across imports during the session.
const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCacheKey(endpoint: string, _date: string): string {
  return endpoint
}

function getCached(key: string): any | null {
  const entry = apiCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key)
    return null
  }
  return entry.data
}

function setCached(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() })
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

async function tryFetch(proxyUrl: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const init: RequestInit = {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
  }

  // Extract endpoint name for logging
  const ouraUrlMatch = proxyUrl.match(/usercollection\/([^?]+)/)
  const endpointName = ouraUrlMatch ? ouraUrlMatch[1] : "unknown"

  // Try primary proxy
  try {
    console.log(`[Memo] Fetching ${endpointName}...`)
    const res = await fetchWithTimeout(proxyUrl, init, REQUEST_TIMEOUT_MS)
    console.log(`[Memo] ${endpointName} status: ${res.status}`)
    if (res.ok) {
      const data = await res.json()
      const itemCount = data.data?.length ?? 0
      console.log(`[Memo] ${endpointName}: ${itemCount} items loaded`)
      return { ok: true, data }
    }
    if (res.status === 401) {
      console.warn(`[Memo] ${endpointName}: Token expired (401)`)
      return { ok: false, error: "TOKEN_EXPIRED" }
    }
    if (res.status === 404) {
      console.log(`[Memo] ${endpointName}: No data (404)`)
      return { ok: true, data: { data: [] } }
    }
    console.warn(`[Memo] ${endpointName}: HTTP ${res.status}`)
  } catch (err: any) {
    console.warn(`[Memo] ${endpointName}: Primary proxy error - ${err.message || err}`)
  }

  // Try backup proxy
  try {
    const ouraUrl = decodeURIComponent(proxyUrl.slice(PRIMARY_PROXY.length))
    const backupUrl = BACKUP_PROXY + encodeURIComponent(ouraUrl)
    console.log(`[Memo] ${endpointName}: Trying backup proxy...`)
    const res = await fetchWithTimeout(backupUrl, init, REQUEST_TIMEOUT_MS)
    console.log(`[Memo] ${endpointName} backup status: ${res.status}`)
    if (res.ok) {
      const data = await res.json()
      return { ok: true, data }
    }
    if (res.status === 401) return { ok: false, error: "TOKEN_EXPIRED" }
    if (res.status === 404) return { ok: true, data: { data: [] } }
  } catch (err: any) {
    console.warn(`[Memo] ${endpointName}: Backup proxy error - ${err.message || err}`)
  }

  console.error(`[Memo] ${endpointName}: All proxies failed`)
  return { ok: false, error: "CORS proxy failed" }
}

async function safeFetch<T>(
  endpoint: string,
  token: string,
  extract: (data: any) => T,
  fallback: T
): Promise<{ data: T; status: string }> {
  const cacheKey = getCacheKey(endpoint, "")
  const cached = getCached(cacheKey)
  if (cached) {
    try {
      const extracted = extract(cached)
      return { data: extracted, status: "cached" }
    } catch {
      // Fall through to fetch
    }
  }

  const separator = endpoint.includes("?") ? "&" : "?"
  const ouraUrl = `${OURA_BASE}${endpoint}${separator}access_token=${token}`
  const proxyUrl = PRIMARY_PROXY + encodeURIComponent(ouraUrl)
  const result = await tryFetch(proxyUrl, token)
  if (result.ok && result.data) {
    try {
      setCached(cacheKey, result.data)
      const extracted = extract(result.data)
      return { data: extracted, status: "loaded" }
    } catch {
      return { data: fallback, status: "parse error" }
    }
  }
  if (result.error === "TOKEN_EXPIRED") {
    throw Object.assign(new Error("TOKEN_EXPIRED"), { code: "TOKEN_EXPIRED" })
  }
  return { data: fallback, status: result.error || "failed" }
}

function dr(start: string, end: string) {
  return `?start_date=${start}&end_date=${end}`
}

function dtr(start: string, end: string) {
  return `?start_datetime=${start}T00:00:00&end_datetime=${end}T23:59:59`
}

export interface EndpointStatus {
  sleep: string; readiness: string; activity: string; heartRate: string
  workout: string; spo2: string; stress: string
}

// Oura v2 API "contributors" fields are SCORES (0-100), NOT raw seconds.
// The "score" field is also 0-100. Actual durations are NOT available in v2 daily_sleep.
function extractSleep(item: any) {
  const c = item.contributors || {}
  return {
    day: item.day || "",
    score: item.score ?? 0,
    totalDuration: 0, // v2 daily_sleep does not provide raw duration seconds
    deepDuration: 0,
    remDuration: 0,
    lightDuration: 0,
    latency: c.latency ?? 0, // latency SCORE 0-100 (not seconds)
    efficiency: c.efficiency ?? 0, // efficiency SCORE 0-100
  }
}

// Readiness: Use top-level fields for actual values (resting_heart_rate in bpm,
// temperature_deviation in degrees). hrv_balance from contributors is a SCORE 0-100.
function extractReadiness(item: any) {
  return {
    day: item.day || "",
    score: item.score ?? 0,
    temperatureDeviation: item.temperature_deviation ?? 0,
    restingHR: item.resting_heart_rate ?? 0,
    hrvBalance: item.contributors?.hrv_balance ?? 0,
  }
}

// Activity: v2 daily_activity returns actual values (steps, calories, distance)
// at the top level. high_intensity_minutes is not directly available.
function extractActivity(item: any) {
  return {
    day: item.day || "",
    score: item.score ?? 0,
    steps: item.steps ?? 0,
    activeCalories: item.active_calories ?? 0,
    totalCalories: item.total_calories ?? 0,
    highIntensityMin: 0,
    distance: item.equivalent_walking_distance ?? 0,
  }
}

// Stress: day_summary is the 0-100 score. stress_high and recovery_high are in seconds.
function extractStress(item: any) {
  return {
    day: item.day || "",
    stressHigh: item.stress_high ?? 0,       // seconds, not percentage
    recoveryHigh: item.recovery_high ?? 0,   // seconds
    daySummary: item.day_summary ?? 0,        // 0-100 score
  }
}

// SpO2
function extractSpO2(item: any) {
  return {
    day: item.day || "",
    average: item.average ?? 0,
    breathingDisturbanceIndex: item.breathing_disturbance_index ?? 0,
  }
}

// Workout
function extractWorkout(w: any) {
  const start = new Date(w.start_datetime || w.start_time).getTime()
  const end = new Date(w.end_datetime || w.end_time).getTime()
  return {
    activity: w.activity || "Workout",
    calories: w.calories || 0,
    duration: isNaN(end - start) ? 0 : Math.round((end - start) / 60000),
    distance: w.distance || 0,
  }
}

export async function fetchDailyMetrics(
  token: string,
  date: string,
  onStatus?: (status: EndpointStatus) => void
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {

  const status: EndpointStatus = {
    sleep: "loading", readiness: "loading", activity: "loading",
    heartRate: "loading", workout: "loading", spo2: "loading", stress: "loading",
  }
  const update = (key: keyof EndpointStatus, value: string) => {
    status[key] = value
    onStatus?.({ ...status })
  }

  // Sleep
  const sleepR = await safeFetch(`/daily_sleep${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractSleep), [])
  update("sleep", sleepR.status)

  // Readiness
  const readinessR = await safeFetch(`/daily_readiness${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractReadiness), [])
  update("readiness", readinessR.status)

  // Activity
  const activityR = await safeFetch(`/daily_activity${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractActivity), [])
  update("activity", activityR.status)

  // Heart Rate
  const hrR = await safeFetch(`/heartrate${dtr(date, date)}`, token,
    (d) => (d.data || []) as any[], [])
  update("heartRate", hrR.status)

  // Workouts
  const workoutR = await safeFetch(`/workout${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractWorkout), [])
  update("workout", workoutR.status)

  // SpO2
  const spo2R = await safeFetch(`/daily_spo2${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractSpO2), [])
  update("spo2", spo2R.status)

  // Stress
  const stressR = await safeFetch(`/daily_stress${dr(date, date)}`, token,
    (d) => ((d.data || []) as any[]).map(extractStress), [])
  update("stress", stressR.status)

  // Build maps by day
  const sleepMap = new Map<string, ReturnType<typeof extractSleep>>()
  for (const s of sleepR.data) sleepMap.set(s.day || date, s)

  const readinessMap = new Map<string, ReturnType<typeof extractReadiness>>()
  for (const r of readinessR.data) readinessMap.set(r.day || date, r)

  const activityMap = new Map<string, ReturnType<typeof extractActivity>>()
  for (const a of activityR.data) activityMap.set(a.day || date, a)

  const spo2Map = new Map<string, ReturnType<typeof extractSpO2>>()
  for (const s of spo2R.data) spo2Map.set(s.day || date, s)

  const stressMap = new Map<string, ReturnType<typeof extractStress>>()
  for (const s of stressR.data) stressMap.set(s.day || date, s)

  // Heart rate calculation
  const hrValues = (hrR.data || []).map((h: any) => h.bpm).filter((b: number) => typeof b === "number")
  let heartRate = null
  if (hrValues.length > 0) {
    const sorted = [...hrValues].sort((a, b) => a - b)
    heartRate = {
      resting: Math.round(sorted[Math.floor(sorted.length * 0.1)]),
      avg: Math.round(hrValues.reduce((a: number, b: number) => a + b, 0) / hrValues.length),
      min: Math.min(...hrValues),
      max: Math.max(...hrValues),
    }
  }

  // Workouts
  const workouts = workoutR.data.length > 0 ? workoutR.data : null

  // Oura records sleep/readiness with +1 day offset
  const nextDay = getNextDay(date)

  const sleepData = sleepMap.get(date) || sleepMap.get(nextDay) || null
  const readinessData = readinessMap.get(nextDay) || readinessMap.get(date) || null
  const activityData = activityMap.get(date) || null
  const spo2Data = spo2Map.get(date) || null
  const stressData = stressMap.get(date) || null

  const metrics: DailyMetrics = {
    date,
    sleep: sleepData ? {
      score: sleepData.score,
      totalDuration: sleepData.totalDuration,
      deepDuration: sleepData.deepDuration,
      remDuration: sleepData.remDuration,
      lightDuration: sleepData.lightDuration,
      latency: sleepData.latency,
      efficiency: sleepData.efficiency,
    } : null,
    readiness: readinessData ? {
      score: readinessData.score,
      temperatureDeviation: readinessData.temperatureDeviation,
      restingHR: readinessData.restingHR,
      hrvBalance: readinessData.hrvBalance,
    } : null,
    activity: activityData ? {
      score: activityData.score,
      steps: activityData.steps,
      activeCalories: activityData.activeCalories,
      totalCalories: activityData.totalCalories,
      highIntensityMin: activityData.highIntensityMin,
      distance: activityData.distance,
    } : null,
    heartRate,
    spo2: spo2Data ? {
      average: spo2Data.average,
      breathingDisturbanceIndex: spo2Data.breathingDisturbanceIndex,
    } : null,
    stress: stressData ? {
      stressHigh: stressData.stressHigh,
      recoveryHigh: stressData.recoveryHigh,
      daySummary: stressData.daySummary,
    } : null,
    resilience: null, // No scope available in Oura app
    workouts,
  }

  return { metrics, status }
}

// ── Daily metrics cache (prevents re-fetching same day) ──────────────
const dailyMetricsCache = new Map<string, DailyMetrics>()

export async function fetchDailyMetricsCached(
  token: string,
  date: string,
  onStatus?: (status: EndpointStatus) => void
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  // Check if we already have this day's data cached
  const cached = dailyMetricsCache.get(date)
  if (cached) {
    return {
      metrics: cached,
      status: {
        sleep: "cached",
        readiness: "cached",
        activity: "cached",
        heartRate: "cached",
        workout: "cached",
        spo2: "cached",
        stress: "cached",
      },
    }
  }

  const result = await fetchDailyMetrics(token, date, onStatus)
  dailyMetricsCache.set(date, result.metrics)
  return result
}

export async function fetchPersonalInfo(token: string): Promise<PersonalInfo | null> {
  const result = await safeFetch("/personal_info", token,
    (d) => d as PersonalInfo, null)
  return result.data
}

export async function fetchWeeklyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  // Use cached version — won't re-fetch data we already have
  const results = await Promise.all(
    dates.map((d) => fetchDailyMetricsCached(token, d).then((r) => r.metrics))
  )
  return results
}

export async function fetchMonthlyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  // Use cached version — won't re-fetch data we already have
  const results = await Promise.all(
    dates.map((d) => fetchDailyMetricsCached(token, d).then((r) => r.metrics))
  )
  return results
}
