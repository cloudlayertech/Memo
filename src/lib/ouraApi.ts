import type {
  OuraToken, SleepDayData, ReadinessDayData, ActivityDayData,
  HeartRateDataPoint, WorkoutData, SpO2DayData, StressDayData,
  ResilienceDayData, PersonalInfo, DailyMetrics,
} from "@/types/oura"
import { getNextDay, toIsoDate } from "./utils"

const CLIENT_ID = "c64fde91-0fa4-4a71-b8bb-35617aeb408e"

const OURA_BASE = "https://api.ouraring.com/v2/usercollection"

function getRedirectUri(): string {
  const origin = window.location.origin
  const path = window.location.pathname
  return origin + path
}

export function getOuraAuthUrl(): string {
  const redirect = encodeURIComponent(getRedirectUri())
  const scope = encodeURIComponent(
    "daily_readiness daily_sleep daily_activity daily_spo2 daily_stress daily_resilience heartrate workout personal_info"
  )
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

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

async function fetchOura<T>(endpoint: string, token: string): Promise<T> {
  const url = `${OURA_BASE}${endpoint}`
  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
    credentials: "omit",
  })
  if (res.status === 401) {
    const err: any = new Error("TOKEN_EXPIRED")
    err.code = "TOKEN_EXPIRED"
    throw err
  }
  if (!res.ok) {
    throw new Error(`Oura API error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data
}

function dateRange(start: string, end: string) {
  return `?start_date=${start}&end_date=${end}`
}

function dateTimeRange(start: string, end: string) {
  return `?start_datetime=${start}T00:00:00&end_datetime=${end}T23:59:59`
}

async function fetchSleep(token: string, start: string, end: string): Promise<SleepDayData[]> {
  const data = await fetchOura<{ data: SleepDayData[] }>(`/daily_sleep${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchReadiness(token: string, start: string, end: string): Promise<ReadinessDayData[]> {
  const data = await fetchOura<{ data: ReadinessDayData[] }>(`/daily_readiness${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchActivity(token: string, start: string, end: string): Promise<ActivityDayData[]> {
  const data = await fetchOura<{ data: ActivityDayData[] }>(`/daily_activity${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchHeartRate(token: string, start: string, end: string): Promise<HeartRateDataPoint[]> {
  const data = await fetchOura<{ data: HeartRateDataPoint[] }>(`/heartrate${dateTimeRange(start, end)}`, token)
  return data.data || []
}

async function fetchWorkouts(token: string, start: string, end: string): Promise<WorkoutData[]> {
  const data = await fetchOura<{ data: WorkoutData[] }>(`/workout${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchSpO2(token: string, start: string, end: string): Promise<SpO2DayData[]> {
  const data = await fetchOura<{ data: SpO2DayData[] }>(`/daily_spo2${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchStress(token: string, start: string, end: string): Promise<StressDayData[]> {
  const data = await fetchOura<{ data: StressDayData[] }>(`/daily_stress${dateRange(start, end)}`, token)
  return data.data || []
}

async function fetchResilience(token: string, start: string, end: string): Promise<ResilienceDayData[]> {
  const data = await fetchOura<{ data: ResilienceDayData[] }>(`/daily_resilience${dateRange(start, end)}`, token)
  return data.data || []
}

export async function fetchPersonalInfo(token: string): Promise<PersonalInfo> {
  const data = await fetchOura<PersonalInfo>("/personal_info", token)
  return data
}

function buildSleepMap(sleepData: SleepDayData[]): Map<string, SleepDayData> {
  const map = new Map<string, SleepDayData>()
  for (const d of sleepData) {
    map.set(d.day, d)
  }
  return map
}

function buildReadinessMap(readinessData: ReadinessDayData[]): Map<string, ReadinessDayData> {
  const map = new Map<string, ReadinessDayData>()
  for (const d of readinessData) {
    map.set(d.day, d)
  }
  return map
}

function buildActivityMap(activityData: ActivityDayData[]): Map<string, ActivityDayData> {
  const map = new Map<string, ActivityDayData>()
  for (const d of activityData) {
    map.set(d.day, d)
  }
  return map
}

function buildSpO2Map(spo2Data: SpO2DayData[]): Map<string, SpO2DayData> {
  const map = new Map<string, SpO2DayData>()
  for (const d of spo2Data) {
    map.set(d.day, d)
  }
  return map
}

function buildStressMap(stressData: StressDayData[]): Map<string, StressDayData> {
  const map = new Map<string, StressDayData>()
  for (const d of stressData) {
    map.set(d.day, d)
  }
  return map
}

function buildResilienceMap(resilienceData: ResilienceDayData[]): Map<string, ResilienceDayData> {
  const map = new Map<string, ResilienceDayData>()
  for (const d of resilienceData) {
    map.set(d.day, d)
  }
  return map
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
    return {
      activity: w.activity,
      calories: w.calories,
      duration,
      distance: w.distance,
    }
  })
}

export async function fetchDailyMetrics(token: string, date: string): Promise<DailyMetrics> {
  const start = date
  const end = date

  const [sleepData, readinessData, activityData, hrData, workoutData, spo2Data, stressData, resilienceData] =
    await Promise.all([
      fetchSleep(token, start, end),
      fetchReadiness(token, start, end),
      fetchActivity(token, start, end),
      fetchHeartRate(token, start, end),
      fetchWorkouts(token, start, end),
      fetchSpO2(token, start, end),
      fetchStress(token, start, end),
      fetchResilience(token, start, end),
    ])

  const sleepMap = buildSleepMap(sleepData)
  const readinessMap = buildReadinessMap(readinessData)
  const activityMap = buildActivityMap(activityData)
  const spo2Map = buildSpO2Map(spo2Data)
  const stressMap = buildStressMap(stressData)
  const resilienceMap = buildResilienceMap(resilienceData)

  const nextDay = getNextDay(date)

  const sleep = sleepMap.get(date) || null
  const readiness = readinessMap.get(nextDay) || readinessMap.get(date) || null
  const activity = activityMap.get(date) || null
  const heartRate = calculateHeartRateMetrics(hrData)
  const workouts = workoutData.length > 0 ? buildWorkoutSummary(workoutData) : null
  const spo2 = spo2Map.get(date) || null
  const stress = stressMap.get(date) || null
  const resilience = resilienceMap.get(date) || null

  return {
    date,
    sleep: sleep
      ? {
          score: sleep.score,
          totalDuration: sleep.total_sleep_duration,
          deepDuration: sleep.deep_sleep_duration,
          remDuration: sleep.rem_sleep_duration,
          lightDuration: sleep.light_sleep_duration,
          latency: sleep.latency,
          efficiency: sleep.efficiency,
        }
      : null,
    readiness: readiness
      ? {
          score: readiness.score,
          temperatureDeviation: readiness.temperature_deviation,
          restingHR: readiness.resting_heart_rate,
          hrvBalance: readiness.hrv_balance,
        }
      : null,
    activity: activity
      ? {
          score: activity.score,
          steps: activity.steps,
          activeCalories: activity.calories_active,
          totalCalories: activity.total_calories,
          highIntensityMin: activity.high_intensity_minutes,
          distance: activity.equivalent_walking_distance,
        }
      : null,
    heartRate,
    spo2: spo2
      ? {
          average: spo2.average,
          breathingDisturbanceIndex: spo2.breathing_disturbance_index,
        }
      : null,
    stress: stress
      ? {
          stressHigh: stress.stress_high,
          recoveryHigh: stress.recovery_high,
          daySummary: stress.day_summary,
        }
      : null,
    resilience: resilience
      ? {
          score: resilience.score,
          level: resilience.level,
        }
      : null,
    workouts,
  }
}

export async function fetchWeeklyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d)))
  return results
}

export async function fetchMonthlyData(token: string, endDate: string): Promise<DailyMetrics[]> {
  const { subDays } = await import("date-fns")
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    dates.push(toIsoDate(subDays(new Date(endDate + "T00:00:00"), i)))
  }
  const results = await Promise.all(dates.map((d) => fetchDailyMetrics(token, d)))
  return results
}
