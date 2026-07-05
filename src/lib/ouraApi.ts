import type { OuraToken, PersonalInfo, DailyMetrics, HeartRateDataPoint } from "@/types/oura"
import { getNextDay, toIsoDate } from "./utils"

const CLIENT_ID = "c64fde91-0fa4-4a71-b8bb-35617aeb408e"
const BACKEND_URL = "https://memo-backend.onrender.com"

// Scopes for OAuth
const OURA_SCOPES = ["daily", "heartrate", "workout", "personal", "spo2", "stress"]

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
  const hashContent = hash.slice(1)
  if (!hashContent.includes("access_token=")) return null
  const params = new URLSearchParams(hashContent)
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
    if (token.expiresAt && token.expiresAt < Date.now()) {
      clearStoredToken()
      return null
    }
    return token
  } catch { return null }
}
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ===================== API CALLS VIA BACKEND =====================

async function fetchFromBackend(endpoint: string, token: string): Promise<any> {
  // Call our backend proxy instead of Oura directly
  const url = `${BACKEND_URL}/api/oura/${endpoint}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) throw Object.assign(new Error("TOKEN_EXPIRED"), { code: "TOKEN_EXPIRED" })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// ===================== DATA EXTRACTION =====================

function extractSleep(item: any) {
  const c = item.contributors || {}
  return {
    score: item.score ?? 0,
    deepSleep: c.deep_sleep ?? 0,
    remSleep: c.rem_sleep ?? 0,
    efficiency: c.efficiency ?? 0,
    latency: c.latency ?? 0,
    totalSleep: c.total_sleep ?? 0,
  }
}

function extractReadiness(item: any) {
  const c = item.contributors || {}
  return {
    score: item.score ?? 0,
    restingHeartRate: c.resting_heart_rate ?? 0,
    hrvBalance: c.hrv_balance ?? 0,
    bodyTemperature: c.body_temperature ?? 0,
  }
}

function extractActivity(item: any) {
  return {
    score: item.score ?? 0,
    steps: item.steps ?? 0,
    activeCalories: item.active_calories ?? 0,
    totalCalories: item.total_calories ?? 0,
    highIntensityMin: item.high_intensity_minutes ?? 0,
    distance: item.equivalent_walking_distance ?? 0,
  }
}

function extractSpO2(item: any) {
  return {
    average: item.average ?? 0,
    breathingDisturbanceIndex: item.breathing_disturbance_index ?? 0,
  }
}

function extractStress(item: any) {
  return {
    stressHigh: item.stress_high ?? 0,
    recoveryHigh: item.recovery_high ?? 0,
    daySummary: item.day_summary ?? 0,
  }
}

function extractResilience(item: any) {
  return {
    score: item.score ?? 0,
    level: item.level ?? "",
  }
}

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

// Night HR: filter to nighttime hours 10 PM - 6 AM
function calculateNightHR(hrData: HeartRateDataPoint[]): { avg: number; min: number; max: number } | null {
  if (!hrData || hrData.length === 0) return null
  const nightReadings = hrData.filter((h) => {
    const hour = new Date(h.timestamp).getHours()
    return hour >= 22 || hour < 6
  })
  if (nightReadings.length === 0) return null
  const bpms = nightReadings.map((h) => h.bpm)
  return {
    avg: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
    min: Math.min(...bpms),
    max: Math.max(...bpms),
  }
}

// ===================== STATUS TYPE =====================

export interface EndpointStatus {
  sleep: string
  readiness: string
  activity: string
  heartRate: string
  workout: string
  spo2: string
  stress: string
  resilience: string
}

// ===================== MAIN FETCH =====================

export async function fetchDailyMetrics(
  token: string,
  date: string,
  onStatus?: (status: EndpointStatus) => void
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  const s = date
  const e = date

  const status: EndpointStatus = {
    sleep: "loading", readiness: "loading", activity: "loading",
    heartRate: "loading", workout: "loading", spo2: "loading",
    stress: "loading", resilience: "loading",
  }

  const update = (key: keyof EndpointStatus, value: string) => {
    status[key] = value
    onStatus?.({ ...status })
  }

  // Fetch ALL in parallel via backend
  const [sleepD, readinessD, activityD, hrD, workoutD, spo2D, stressD, resilienceD] =
    await Promise.all([
      fetchFromBackend(`daily_sleep?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("sleep", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("sleep", "failed"); return { data: [] } }),
      fetchFromBackend(`daily_readiness?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("readiness", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("readiness", "failed"); return { data: [] } }),
      fetchFromBackend(`daily_activity?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("activity", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("activity", "failed"); return { data: [] } }),
      fetchFromBackend(`heartrate?start_datetime=${s}T00:00:00&end_datetime=${e}T23:59:59`, token)
        .then(d => { update("heartRate", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("heartRate", "failed"); return { data: [] } }),
      fetchFromBackend(`workout?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("workout", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("workout", "failed"); return { data: [] } }),
      fetchFromBackend(`daily_spo2?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("spo2", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("spo2", "failed"); return { data: [] } }),
      fetchFromBackend(`daily_stress?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("stress", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("stress", "failed"); return { data: [] } }),
      fetchFromBackend(`daily_resilience?start_date=${s}&end_date=${e}`, token)
        .then(d => { update("resilience", d.data?.length > 0 ? "loaded" : "no data"); return d })
        .catch(() => { update("resilience", "failed"); return { data: [] } }),
    ])

  // Extract data using day maps to handle Oura's +1 day offset for sleep/readiness
  const sleepMap = new Map<string, ReturnType<typeof extractSleep>>()
  for (const item of (sleepD.data || [])) sleepMap.set(item.day || date, extractSleep(item))

  const readinessMap = new Map<string, ReturnType<typeof extractReadiness>>()
  for (const item of (readinessD.data || [])) readinessMap.set(item.day || date, extractReadiness(item))

  const activityMap = new Map<string, ReturnType<typeof extractActivity>>()
  for (const item of (activityD.data || [])) activityMap.set(item.day || date, extractActivity(item))

  const spo2Map = new Map<string, ReturnType<typeof extractSpO2>>()
  for (const item of (spo2D.data || [])) spo2Map.set(item.day || date, extractSpO2(item))

  const stressMap = new Map<string, ReturnType<typeof extractStress>>()
  for (const item of (stressD.data || [])) stressMap.set(item.day || date, extractStress(item))

  const resilienceMap = new Map<string, ReturnType<typeof extractResilience>>()
  for (const item of (resilienceD.data || [])) resilienceMap.set(item.day || date, extractResilience(item))

  // Heart rate — all-day + nighttime (10 PM - 6 AM)
  const hrReadings = (hrD.data || []) as HeartRateDataPoint[]
  const hrValues = hrReadings.map((h) => h.bpm).filter((b: number) => typeof b === "number")
  const nightHR = calculateNightHR(hrReadings)

  let heartRate = null
  if (hrValues.length > 0) {
    const sorted = [...hrValues].sort((a, b) => a - b)
    heartRate = {
      resting: Math.round(sorted[Math.floor(sorted.length * 0.1)]),
      avg: Math.round(hrValues.reduce((a: number, b: number) => a + b, 0) / hrValues.length),
      min: Math.min(...hrValues),
      max: Math.max(...hrValues),
      nightAvg: nightHR?.avg ?? 0,
      nightMin: nightHR?.min ?? 0,
      nightMax: nightHR?.max ?? 0,
    }
  }

  // Workouts
  const workouts = (workoutD.data || []).length > 0
    ? (workoutD.data || []).map(extractWorkout)
    : null

  // Oura records sleep/readiness with +1 day offset
  const nextDay = getNextDay(date)

  const sleepData = sleepMap.get(date) || sleepMap.get(nextDay) || null
  const readinessData = readinessMap.get(nextDay) || readinessMap.get(date) || null
  const activityData = activityMap.get(date) || null
  const spo2Data = spo2Map.get(date) || null
  const stressData = stressMap.get(date) || null
  const resilienceData = resilienceMap.get(date) || null

  const metrics: DailyMetrics = {
    date,
    sleep: sleepData,
    readiness: readinessData,
    activity: activityData,
    heartRate,
    spo2: spo2Data,
    stress: stressData,
    resilience: resilienceData,
    workouts,
  }

  return { metrics, status }
}

// Backward-compatible cached wrapper — delegates to fetchDailyMetrics since backend proxy is reliable
const dailyMetricsCache = new Map<string, DailyMetrics>()

export async function fetchDailyMetricsCached(
  token: string,
  date: string,
  onStatus?: (status: EndpointStatus) => void
): Promise<{ metrics: DailyMetrics; status: EndpointStatus }> {
  const cached = dailyMetricsCache.get(date)
  if (cached) {
    return {
      metrics: cached,
      status: {
        sleep: "cached", readiness: "cached", activity: "cached",
        heartRate: "cached", workout: "cached", spo2: "cached",
        stress: "cached", resilience: "cached",
      },
    }
  }
  const result = await fetchDailyMetrics(token, date, onStatus)
  dailyMetricsCache.set(date, result.metrics)
  return result
}

export async function fetchPersonalInfo(token: string): Promise<PersonalInfo | null> {
  try {
    const data = await fetchFromBackend("personal_info", token)
    return data as PersonalInfo
  } catch {
    return null
  }
}

export async function fetchWeeklyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
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
  const results = await Promise.all(
    dates.map((d) => fetchDailyMetricsCached(token, d).then((r) => r.metrics))
  )
  return results
}
