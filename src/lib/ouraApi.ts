import type { OuraToken, PersonalInfo, DailyMetrics } from "@/types/oura"
import { toIsoDate } from "./utils"

const CLIENT_ID = "c64fde91-0fa4-4a71-b8bb-35617aeb408e"
const OURA_BASE = "https://api.ouraring.com/v2/usercollection"
const PROXY = "https://corsproxy.io/?"

const SCOPES = ["daily", "heartrate", "workout", "personal", "spo2", "stress"]

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname
}

export function getOuraAuthUrl(): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "token",
    scope: SCOPES.join(" "),
  })
  return `https://cloud.ouraring.com/oauth/authorize?${p.toString()}`
}

export function parseOAuthCallback(): OuraToken | null {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return null
  const content = hash.startsWith("#/") ? hash.slice(2) : hash.slice(1)
  if (!content.includes("access_token=")) return null
  const params = new URLSearchParams(content)
  const accessToken = params.get("access_token")
  const expiresIn = params.get("expires_in")
  if (!accessToken) return null
  const token: OuraToken = {
    accessToken,
    expiresAt: Date.now() + (Number(expiresIn) || 86400) * 1000,
  }
  setStoredToken(token)
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
    if (token.expiresAt < Date.now()) {
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

// Fetch via CORS proxy
async function ouraFetch(endpoint: string, token: string): Promise<any> {
  const url = `${OURA_BASE}${endpoint}`
  const proxyUrl = PROXY + encodeURIComponent(url)
  const res = await fetch(proxyUrl, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
  })
  if (res.status === 401) throw Object.assign(new Error("TOKEN_EXPIRED"), { code: "TOKEN_EXPIRED" })
  if (res.status === 404) return { data: [] }
  if (!res.ok) throw new Error(`Oura API error: ${res.status}`)
  return res.json()
}

// Extract functions
const exSleep = (item: any) => ({
  score: item.score ?? 0,
  totalDuration: item.contributors?.total_sleep ?? 0,
  deepDuration: item.contributors?.deep_sleep ?? 0,
  remDuration: item.contributors?.rem_sleep ?? 0,
  lightDuration: item.contributors?.light_sleep ?? 0,
  latency: item.contributors?.latency ?? 0,
  efficiency: item.contributors?.efficiency ?? 0,
})

const exReadiness = (item: any) => ({
  score: item.score ?? 0,
  temperatureDeviation: item.contributors?.body_temperature ?? 0,
  restingHR: item.contributors?.resting_heart_rate ?? 0,
  hrvBalance: item.contributors?.hrv_balance ?? 0,
})

const exActivity = (item: any) => ({
  score: item.score ?? 0,
  steps: item.steps ?? 0,
  activeCalories: item.active_calories ?? 0,
  totalCalories: item.total_calories ?? 0,
  highIntensityMin: item.high_intensity_minutes ?? 0,
  distance: item.equivalent_walking_distance ?? 0,
})

const exSpO2 = (item: any) => ({
  average: item.average ?? 0,
  breathingDisturbanceIndex: item.breathing_disturbance_index ?? 0,
})

const exStress = (item: any) => ({
  daySummary: item.day_summary ?? 0,
  stressHigh: item.stress_high ?? 0,
  recoveryHigh: item.recovery_high ?? 0,
})

const exResilience = (item: any) => ({
  score: item.score ?? 0,
  level: item.level ?? "",
})

const exWorkout = (w: any) => {
  const s = new Date(w.start_datetime).getTime()
  const e = new Date(w.end_datetime).getTime()
  return {
    activity: w.activity,
    calories: w.calories,
    duration: Math.round((e - s) / 60000),
    distance: w.distance,
  }
}

export interface EndpointStatus {
  sleep: string; readiness: string; activity: string; heartRate: string
  workout: string; spo2: string; stress: string; resilience: string
}

export async function fetchDailyMetrics(
  token: string, date: string
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  const d = date
  const status: EndpointStatus = {
    sleep: "loading", readiness: "loading", activity: "loading",
    heartRate: "loading", workout: "loading", spo2: "loading",
    stress: "loading", resilience: "loading",
  }

  const update = (key: keyof EndpointStatus, val: string) => { status[key] = val }

  // Fetch ALL in parallel via CORS proxy
  const [sleepD, readinessD, activityD, hrD, workoutD, spo2D, stressD, resilienceD] =
    await Promise.all([
      ouraFetch(`/daily_sleep?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/daily_readiness?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/daily_activity?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/heartrate?start_datetime=${d}T00:00:00&end_datetime=${d}T23:59:59`, token).catch(() => ({ data: [] })),
      ouraFetch(`/workout?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/daily_spo2?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/daily_stress?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
      ouraFetch(`/daily_resilience?start_date=${d}&end_date=${d}`, token).catch(() => ({ data: [] })),
    ])

  update("sleep", sleepD.data?.length ? "loaded" : "no data")
  update("readiness", readinessD.data?.length ? "loaded" : "no data")
  update("activity", activityD.data?.length ? "loaded" : "no data")
  update("heartRate", hrD.data?.length ? "loaded" : "no data")
  update("workout", workoutD.data?.length ? "loaded" : "no data")
  update("spo2", spo2D.data?.length ? "loaded" : "no data")
  update("stress", stressD.data?.length ? "loaded" : "no data")
  update("resilience", resilienceD.data?.length ? "loaded" : "no data")

  const sleep = (sleepD.data || []).map(exSleep)[0] || null
  const readiness = (readinessD.data || []).map(exReadiness)[0] || null
  const activity = (activityD.data || []).map(exActivity)[0] || null
  const spo2 = (spo2D.data || []).map(exSpO2)[0] || null
  const stress = (stressD.data || []).map(exStress)[0] || null
  const resilience = (resilienceD.data || []).map(exResilience)[0] || null

  const hrVals = (hrD.data || []).map((h: any) => h.bpm).filter((b: number) => typeof b === "number")
  let heartRate = null
  if (hrVals.length > 0) {
    const sorted = [...hrVals].sort((a: number, b: number) => a - b)
    const avg = Math.round(hrVals.reduce((a: number, b: number) => a + b, 0) / hrVals.length)
    const min = Math.min(...hrVals)
    const max = Math.max(...hrVals)
    heartRate = {
      resting: Math.round(sorted[Math.floor(sorted.length * 0.1)]),
      avg,
      min,
      max,
      nightAvg: avg,
      nightMin: min,
      nightMax: max,
    }
  }

  const workouts = (workoutD.data || []).length > 0 ? (workoutD.data || []).map(exWorkout) : null

  return {
    metrics: { date, sleep, readiness, activity, heartRate, spo2, stress, resilience, workouts },
    status,
  }
}

const metricsCache: Record<string, { metrics: DailyMetrics; status: EndpointStatus }> = {}

export async function fetchDailyMetricsCached(
  token: string, date: string
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  const key = `${token.slice(0, 8)}_${date}`
  if (metricsCache[key]) return metricsCache[key]
  const result = await fetchDailyMetrics(token, date)
  metricsCache[key] = result
  return result
}

export async function fetchPersonalInfo(token: string): Promise<PersonalInfo | null> {
  try {
    const data = await ouraFetch("/personal_info", token)
    return data as PersonalInfo
  } catch { return null }
}

export async function fetchWeeklyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d).then((r) => r.metrics)))
  return results
}

export async function fetchMonthlyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d).then((r) => r.metrics)))
  return results
}
