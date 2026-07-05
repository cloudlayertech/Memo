export interface OuraToken {
  accessToken: string;
  expiresAt: number;
}

export interface SleepDayData {
  day: string;
  score: number;
  total_sleep_duration: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  latency: number;
  efficiency: number;
}

export interface ReadinessDayData {
  day: string;
  score: number;
  temperature_deviation: number;
  resting_heart_rate: number;
  hrv_balance: number;
}

export interface ActivityDayData {
  day: string;
  score: number;
  steps: number;
  calories_active: number;
  total_calories: number;
  high_intensity_minutes: number;
  equivalent_walking_distance: number;
}

export interface HeartRateDataPoint {
  bpm: number;
  timestamp: string;
}

export interface WorkoutData {
  activity: string;
  calories: number;
  day: string;
  distance: number;
  start_datetime: string;
  end_datetime: string;
}

export interface SpO2DayData {
  day: string;
  average: number;
  breathing_disturbance_index: number;
}

export interface StressDayData {
  day: string;
  stress_high: number;
  recovery_high: number;
  day_summary: number;
}

export interface ResilienceDayData {
  day: string;
  score: number;
  level: string;
}

export interface PersonalInfo {
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  biological_sex: string | null;
}

export interface SleepMetrics {
  score: number;
  totalSleep: number;        // contributor score 0-100
  deepSleep: number;         // contributor score 0-100
  remSleep: number;          // contributor score 0-100
  latency: number;           // contributor score 0-100
  efficiency: number;        // contributor score 0-100
}

export interface ReadinessMetrics {
  score: number;
  restingHeartRate: number;  // contributor score 0-100 (not actual BPM)
  hrvBalance: number;        // contributor score 0-100
  bodyTemperature: number;   // contributor score 0-100
}

export interface ActivityMetrics {
  score: number;
  steps: number;
  activeCalories: number;
  totalCalories: number;
  highIntensityMin: number;
  distance: number;
}

export interface HeartRateMetrics {
  resting: number;
  avg: number;
  min: number;
  max: number;
  nightAvg: number;
  nightMin: number;
  nightMax: number;
}

export interface SpO2Metrics {
  average: number;
  breathingDisturbanceIndex: number;
}

export interface StressMetrics {
  stressHigh: number;
  recoveryHigh: number;
  daySummary: number;
}

export interface ResilienceMetrics {
  score: number;
  level: string;
}

export interface WorkoutSummary {
  activity: string;
  calories: number;
  duration: number;
  distance: number;
}

export interface DailyMetrics {
  date: string;
  sleep: SleepMetrics | null;
  readiness: ReadinessMetrics | null;
  activity: ActivityMetrics | null;
  heartRate: HeartRateMetrics | null;
  spo2: SpO2Metrics | null;
  stress: StressMetrics | null;
  resilience: ResilienceMetrics | null;
  workouts: WorkoutSummary[] | null;
}

export type MetricCategory =
  | 'sleep'
  | 'readiness'
  | 'activity'
  | 'heartRate'
  | 'spo2'
  | 'stress'
  | 'resilience';

export type RecCategory =
  | 'sleep'
  | 'exercise'
  | 'heart'
  | 'mental'
  | 'social'
  | 'nutrition'
  | 'medical';

export type Severity = 'info' | 'warning' | 'critical';

export interface Recommendation {
  id: string;
  category: RecCategory;
  title: string;
  description: string;
  severity: Severity;
  condition: (metrics: DailyMetrics) => boolean;
  actions: string[];
  scienceNote: string;
}
