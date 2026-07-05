import type {
  OuraToken, PersonalInfo, DailyMetrics, HeartRateDataPoint,
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
  "resilience",
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

  // After OAuth redirect, hash is like: #access_token=xxx&token_type=bearer...
  // HashRouter normally uses: #/  or #/trends etc.
  // We need to detect if this is an OAuth callback vs a normal route

  const hashContent = hash.slice(1) // Remove leading #

  // Check if this contains OAuth params
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

  // Clean the URL - remove the token from the hash
  // DON'T add #/ here - let the router handle it
  window.history.replaceState({}, document.title, window.location.pathname)

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



// ── Multi-proxy fetch ────────────────────────────────────────────────
// Try multiple approaches: direct, proxy with header, proxy with token in URL.
// The token is embedded as access_token query param (Oura supports this).
// Authorization header is also sent as a fallback for proxies that preserve it.
async function tryFetch(endpoint: string, token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const url = `${OURA_BASE}${endpoint}`

  // Build proxy URLs with token in the query string (Oura supports this)
  const separator = url.includes("?") ? "&" : "?"
  const urlWithToken = `${url}${separator}access_token=${token}`

  const proxies = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
  ]

  // Try each proxy
  for (const proxy of proxies) {
    try {
      const proxyUrl = proxy + encodeURIComponent(urlWithToken)
      const res = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
      })

      if (res.ok) {
        const data = await res.json()
        return { ok: true, data }
      }
      if (res.status === 401) return { ok: false, error: "TOKEN_EXPIRED" }
      if (res.status === 404) return { ok: true, data: { data: [] } }

      console.warn(`[Memo] Proxy ${proxy}: HTTP ${res.status}`)
    } catch (e: any) {
      console.warn(`[Memo] Proxy ${proxy} failed: ${e.message}`)
    }
  }

  return { ok: false, error: "All proxies failed" }
}

// ── Safe fetch with cache ────────────────────────────────────────────
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

  const result = await tryFetch(endpoint, token)
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
  workout: string; spo2: string; stress: string; resilience: string
}

// Oura v2 API "contributors" fields are SCORES (0-100), NOT raw seconds.
// The "score" field is also 0-100. Actual durations are NOT available in v2 daily_sleep.
function extractSleep(item: any) {
  const c = item.contributors || {}
  return {
    day: item.day || "",
    score: item.score ?? 0,
    totalSleep: c.total_sleep ?? 0,   // contributor score 0-100
    deepSleep: c.deep_sleep ?? 0,     // contributor score 0-100
    remSleep: c.rem_sleep ?? 0,       // contributor score 0-100
    latency: c.latency ?? 0,          // latency SCORE 0-100 (not seconds)
    efficiency: c.efficiency ?? 0,    // efficiency SCORE 0-100
  }
}

// Readiness: All extracted fields are contributor SCORES (0-100), NOT raw values.
// resting_heart_rate and body_temperature come from contributors, not the top level.
// Actual resting HR (in BPM) comes from the /heartrate endpoint, not readiness.
function extractReadiness(item: any) {
  const c = item.contributors || {}
  return {
    day: item.day || "",
    score: item.score ?? 0,
    restingHeartRate: c.resting_heart_rate ?? 0,  // SCORE 0-100 (not BPM)
    hrvBalance: c.hrv_balance ?? 0,                // SCORE 0-100
    bodyTemperature: c.body_temperature ?? 0,      // SCORE 0-100
  }
}

// Activity: v2 daily_activity returns actual values (steps, calories, distance)
// at the top level. Field names must match Oura API exactly.
function extractActivity(item: any) {
  return {
    day: item.day || "",
    score: item.score ?? 0,
    steps: item.steps ?? 0,
    activeCalories: item.active_calories ?? 0,
    totalCalories: item.total_calories ?? 0,
    highIntensityMin: item.high_intensity_minutes ?? 0,
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

// Resilience: Oura provides a daily resilience score (0-100) and a text level.
function extractResilience(item: any) {
  return {
    day: item.day || "",
    score: item.score ?? 0,       // 0-100 resilience score
    level: item.level ?? "",       // e.g. "limited", "adequate", "solid", "strong"
  }
}

// Night HR: filter to nighttime hours 10 PM - 6 AM
export function calculateNightHR(hrData: HeartRateDataPoint[]): { avg: number; min: number; max: number } | null {
  if (!hrData || hrData.length === 0) return null
  // Filter to nighttime hours: 10 PM - 6 AM
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
    heartRate: "loading", workout: "loading", spo2: "loading",
    stress: "loading", resilience: "loading",
  }
  const update = (key: keyof EndpointStatus, value: string) => {
    status[key] = value
    onStatus?.({ ...status })
  }

  // Fetch ALL endpoints in PARALLEL — total time = slowest endpoint only
  const [
    sleepR, readinessR, activityR, hrR, workoutR, spo2R, stressR, resilienceR
  ] = await Promise.all([
    safeFetch(`/daily_sleep${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractSleep), [])
      .then(r => { update("sleep", r.status); return r }),
    safeFetch(`/daily_readiness${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractReadiness), [])
      .then(r => { update("readiness", r.status); return r }),
    safeFetch(`/daily_activity${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractActivity), [])
      .then(r => { update("activity", r.status); return r }),
    safeFetch(`/heartrate${dtr(date, date)}`, token,
      (d) => (d.data || []) as any[], [])
      .then(r => { update("heartRate", r.status); return r }),
    safeFetch(`/workout${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractWorkout), [])
      .then(r => { update("workout", r.status); return r }),
    safeFetch(`/daily_spo2${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractSpO2), [])
      .then(r => { update("spo2", r.status); return r }),
    safeFetch(`/daily_stress${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractStress), [])
      .then(r => { update("stress", r.status); return r }),
    safeFetch(`/daily_resilience${dr(date, date)}`, token,
      (d) => ((d.data || []) as any[]).map(extractResilience), [])
      .then(r => { update("resilience", r.status); return r }),
  ])

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

  const resilienceMap = new Map<string, ReturnType<typeof extractResilience>>()
  for (const r of resilienceR.data) resilienceMap.set(r.day || date, r)

  // Heart rate calculation — split into all-day and nighttime (10 PM - 6 AM)
  const hrReadings = (hrR.data || []) as HeartRateDataPoint[]
  const hrValues = hrReadings.map((h) => h.bpm).filter((b: number) => typeof b === "number")

  // Nighttime HR (10 PM - 6 AM) using dedicated calculator
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
  const workouts = workoutR.data.length > 0 ? workoutR.data : null

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
    sleep: sleepData ? {
      score: sleepData.score,
      totalSleep: sleepData.totalSleep,
      deepSleep: sleepData.deepSleep,
      remSleep: sleepData.remSleep,
      latency: sleepData.latency,
      efficiency: sleepData.efficiency,
    } : null,
    readiness: readinessData ? {
      score: readinessData.score,
      restingHeartRate: readinessData.restingHeartRate,
      hrvBalance: readinessData.hrvBalance,
      bodyTemperature: readinessData.bodyTemperature,
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
    resilience: resilienceData ? {
      score: resilienceData.score,
      level: resilienceData.level,
    } : null,
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
        resilience: "cached",
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

// ── Single endpoint tester ───────────────────────────────────────────
export async function testEndpoint(token: string, endpoint: string): Promise<any> {
  return await tryFetch(endpoint, token)
}

// ── Full endpoint tester (call from browser console for debugging) ───
export async function testOuraEndpoints(token: string): Promise<Record<string, any>> {
  const endpoints = [
    { name: "daily_sleep", url: `/daily_sleep?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "daily_readiness", url: `/daily_readiness?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "daily_activity", url: `/daily_activity?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "heartrate", url: `/heartrate?start_datetime=2025-07-04T00:00:00&end_datetime=2025-07-05T23:59:59` },
    { name: "workout", url: `/workout?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "daily_spo2", url: `/daily_spo2?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "daily_stress", url: `/daily_stress?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "daily_resilience", url: `/daily_resilience?start_date=2025-07-04&end_date=2025-07-05` },
    { name: "personal_info", url: `/personal_info` },
  ]

  const results: Record<string, any> = {}
  for (const ep of endpoints) {
    const result = await tryFetch(ep.url, token)
    if (result.ok && result.data) {
      results[ep.name] = {
        status: "ok",
        itemCount: result.data.data?.length ?? 0,
        firstItem: result.data.data?.[0] ?? null,
        raw: result.data,
      }
    } else {
      results[ep.name] = { status: "error", error: result.error || "failed" }
    }
  }
  return results
}
