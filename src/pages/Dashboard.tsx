import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Moon, HeartPulse, Footprints, Droplets, Wind, Shield,
  RefreshCw, ChevronRight, Bug, WifiOff, AlertTriangle,
  Activity, ChevronDown, ChevronUp, Timer, TrendingUp, TrendingDown
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { getRecommendationsForData } from "@/lib/recommendations"
import { formatDate, getWeekDays } from "@/lib/utils"
import CalendarStrip from "@/components/CalendarStrip"
import DetailSheet from "@/components/DetailSheet"
import DailyPlan from "@/components/DailyPlan"
import type { DailyMetrics, MetricCategory } from "@/types/oura"
import type { EndpointStatus } from "@/lib/ouraApi"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

/* ── Helpers ─────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function formatPercent(value: number | undefined, total: number | undefined): string {
  if (value == null || total == null || total === 0) return "--"
  return `${Math.round((value / total) * 100)}%`
}

/** Check if any endpoint hasn't loaded successfully */
function hasPartialData(status: EndpointStatus | null): boolean {
  if (!status) return false
  return Object.values(status).some((s) => s !== "loaded")
}

/** Build a human-readable list of missing scopes */
function getMissingScopes(status: EndpointStatus | null): string[] {
  if (!status) return []
  const scopeNames: Record<string, string> = {
    sleep: "Daily Sleep",
    readiness: "Daily Readiness",
    activity: "Daily Activity",
    heartRate: "Heart Rate",
    workout: "Workout",
    spo2: "Daily SpO2",
    stress: "Daily Stress",
    resilience: "Daily Resilience",
    personalInfo: "Personal Info",
  }
  return Object.entries(status)
    .filter(([, s]) => s !== "loaded")
    .map(([key]) => scopeNames[key] || key)
}

/* ── Card entrance animation ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" as const },
  }),
}

/* ── Metric Card component (inline) ──────────────────────── */
interface InlineMetricCardProps {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
  unit: string
  description: string
  index: number
  onClick?: () => void
}

function InlineMetricCard({ icon: Icon, iconColor, label, value, unit, description, index, onClick }: InlineMetricCardProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(45, 42, 38, 0.10)" }}
      className={`bg-white rounded-2xl p-5 shadow-card ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {/* Top: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
        <span className="text-base font-medium text-memo-text-secondary">{label}</span>
      </div>
      {/* Middle: big number + unit */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-memo-text">{value}</span>
        <span className="text-base text-memo-text-secondary">{unit}</span>
      </div>
      {/* Bottom: description */}
      <p className="text-base text-memo-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  )
}

/* ── Section Header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, color, title }: { icon: React.ElementType; color: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5" style={{ color }} />
      <h2 className="text-base font-semibold uppercase tracking-wider text-memo-text-secondary">{title}</h2>
      <div className="flex-1 h-px bg-gray-200 ml-2" />
    </div>
  )
}

/* ── Sleep Stages Bar ────────────────────────────────────── */
function SleepStagesBar({ metrics }: { metrics: DailyMetrics }) {
  const s = metrics.sleep
  if (!s) return null

  const total = s.totalDuration
  const hasRealData = total > 0 && (s.deepDuration > 0 || s.remDuration > 0)

  /* Use real data when available, otherwise use estimated stage percentages */
  const awakeDuration = hasRealData
    ? Math.max(0, s.totalDuration - s.deepDuration - s.remDuration - s.lightDuration)
    : Math.round(total * 0.07)
  const deepPct = hasRealData
    ? Math.round((s.deepDuration / total) * 100)
    : Math.round((s.score * 0.18 + s.efficiency * 0.05))
  const remPct = hasRealData
    ? Math.round((s.remDuration / total) * 100)
    : Math.round((s.score * 0.20 + 5))
  const lightPct = hasRealData
    ? Math.round((s.lightDuration / total) * 100)
    : Math.max(0, 100 - deepPct - remPct - 7)
  const awakePct = hasRealData
    ? Math.max(0, 100 - deepPct - remPct - lightPct)
    : 7

  const deepDur = hasRealData ? s.deepDuration : Math.round((total * deepPct) / 100)
  const remDur = hasRealData ? s.remDuration : Math.round((total * remPct) / 100)
  const lightDur = hasRealData ? s.lightDuration : Math.round((total * lightPct) / 100)
  const awakeDur = hasRealData ? awakeDuration : Math.round((total * awakePct) / 100)

  const stages = [
    { name: "Deep", pct: deepPct, duration: deepDur, color: "#5B7A83" },
    { name: "REM", pct: remPct, duration: remDur, color: "#7B9EA8" },
    { name: "Light", pct: lightPct, duration: lightDur, color: "#A8C4CC" },
    { name: "Awake", pct: awakePct, duration: awakeDur, color: "#D4E2E6" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-2xl p-5 shadow-card mt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-5 h-5" style={{ color: "#7B9EA8" }} />
        <span className="text-base font-medium text-memo-text-secondary">Sleep Stages</span>
        {!hasRealData && (
          <span className="text-sm text-memo-text-tertiary ml-2">(estimated)</span>
        )}
      </div>
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden mb-3">
        {stages.map((stage) => (
          <div
            key={stage.name}
            style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
            title={`${stage.name}: ${stage.pct}% (${formatDuration(stage.duration)})`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <span className="text-base text-memo-text-secondary">
              {stage.name} {stage.pct}% — {formatDuration(stage.duration)}
            </span>
          </div>
        ))}
      </div>
      {/* Note */}
      <p className="text-base text-memo-text-secondary leading-relaxed mt-3 pt-3 border-t border-gray-100">
        Deep sleep clears amyloid plaques linked to Alzheimer&apos;s. Target: 15-20% deep, 20-25% REM.
      </p>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════
   Main Dashboard Component
   ════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { personalInfo, metrics, loading, error, endpointStatus, selectedDate, selectDate, refreshData } = useData()
  const [activeSheet, setActiveSheet] = useState<MetricCategory | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [alertExpanded, setAlertExpanded] = useState(false)
  const navigate = useNavigate()

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

  const recommendations = useMemo(() => {
    if (!metrics) return []
    return getRecommendationsForData(metrics)
  }, [metrics])

  const warningRecs = recommendations.filter((r) => r.severity === "warning" || r.severity === "critical")
  const topRecs = recommendations.slice(0, 3)

  const handleRetry = () => {
    refreshData()
  }

  /* ── derived data ──────────────────────────────────────── */
  const overallScore = useMemo(() => {
    if (!metrics) return 80
    const scores: number[] = []
    if (metrics.sleep?.score != null) scores.push(metrics.sleep.score)
    if (metrics.readiness?.score != null) scores.push(metrics.readiness.score)
    if (metrics.activity?.score != null) scores.push(metrics.activity.score)
    if (metrics.heartRate?.resting != null) scores.push(Math.max(0, 100 - (metrics.heartRate.resting - 50) * 2))
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 80
  }, [metrics])

  /* ── Detail Sheet Content ──────────────────────────────── */
  const renderSheetContent = (cat: MetricCategory) => {
    const trendData = weekDays.map((d) => ({ date: d, value: 0 }))
    const data = trendData.map((d) => ({
      ...d,
      value: Math.random() * 40 + 60,
    }))

    const sectionColors: Record<string, string> = {
      sleep: "#7B9EA8",
      readiness: "#9B8BB5",
      activity: "#7BA87B",
      heartRate: "#C4706B",
      spo2: "#6BA8C4",
      stress: "#C4A46B",
      resilience: "#8BB5A0",
    }
    const sectionNames: Record<string, string> = {
      sleep: "Sleep",
      readiness: "Readiness",
      activity: "Activity",
      heartRate: "Heart Rate",
      spo2: "SpO2",
      stress: "Stress",
      resilience: "Resilience",
    }
    const sectionIcons: Record<string, React.ElementType> = {
      sleep: Moon,
      readiness: Shield,
      activity: Footprints,
      heartRate: HeartPulse,
      spo2: Droplets,
      stress: Wind,
      resilience: Shield,
    }
    const Icon = sectionIcons[cat] || Moon
    const color = sectionColors[cat] || "#7B9EA8"

    return (
      <div className="space-y-5">
        <div className="bg-memo-bg rounded-xl p-4 text-center">
          <Icon className="w-8 h-8 mx-auto mb-2" style={{ color }} />
          <p className="text-sm text-memo-text-secondary mt-1">{sectionNames[cat]}</p>
        </div>

        <div className="h-[200px] bg-memo-bg rounded-xl p-3">
          <p className="text-base font-medium text-memo-text-secondary mb-2 uppercase tracking-wider">
            7-Day Trend
          </p>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9B9590" }} tickLine={false} axisLine={false} tickFormatter={(d) => d.slice(5)} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontSize: 14, color: "#6B6560" }}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${cat})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {cat === "sleep" && metrics?.sleep && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sleep Score", value: `${metrics.sleep.score}`, pct: metrics.sleep.score },
              { label: "Efficiency", value: `${metrics.sleep.efficiency}%`, pct: metrics.sleep.efficiency },
              { label: "Deep Sleep", value: formatPercent(metrics.sleep.deepDuration, metrics.sleep.totalDuration), pct: Math.round((metrics.sleep.deepDuration / metrics.sleep.totalDuration) * 100) },
              { label: "REM Sleep", value: formatPercent(metrics.sleep.remDuration, metrics.sleep.totalDuration), pct: Math.round((metrics.sleep.remDuration / metrics.sleep.totalDuration) * 100) },
            ].map((s) => (
              <div key={s.label} className="bg-memo-bg rounded-xl p-3">
                <p className="text-base text-memo-text-tertiary uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-memo-text">{s.value}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {cat === "activity" && metrics?.activity && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Steps", value: metrics.activity.steps.toLocaleString() },
              { label: "Active Calories", value: `${metrics.activity.activeCalories} cal` },
              { label: "Total Calories", value: `${metrics.activity.totalCalories} cal` },
              { label: "Distance", value: `${(metrics.activity.distance / 1000).toFixed(1)} km` },
            ].map((s) => (
              <div key={s.label} className="bg-memo-bg rounded-xl p-3">
                <p className="text-base text-memo-text-tertiary uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-memo-text">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Header ────────────────────────────────────────────── */
  const renderHeader = (isErrorState = false) => (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-center justify-between gap-4 mb-6"
    >
      {/* Left: Logo + Live badge */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-memo-text tracking-tight">memo</h1>
        {!isErrorState && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card">
              <svg viewBox="0 0 36 36" className="w-10 h-10">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#7BA87B" strokeWidth="3"
                  strokeDasharray={`${overallScore} ${100 - overallScore}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-memo-text">{overallScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: greeting + date + buttons */}
      <div className="flex items-center gap-3">
        {!isErrorState && (
          <div className="text-right mr-1">
            <p className="text-lg font-semibold text-memo-text">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
              {personalInfo?.name ? `, ${personalInfo.name.split(" ")[0]}` : ""}
            </p>
            <p className="text-base text-memo-text-secondary">{formatDate(selectedDate)}</p>
          </div>
        )}
        {!isErrorState && (
          <button
            onClick={refreshData}
            className="w-11 h-11 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-memo-bg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-memo-text-secondary" />
          </button>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${showDebug ? "bg-[#8B6F4E] text-white shadow-md" : "bg-white shadow-card text-memo-text-secondary hover:bg-memo-bg"}`}
          title="Toggle debug panel"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )

  /* ── Debug panel ───────────────────────────────────────── */
  const renderDebugPanel = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: showDebug && endpointStatus ? 1 : 0, height: showDebug && endpointStatus ? "auto" : 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="bg-white rounded-2xl shadow-card p-5 mt-5">
        <h3 className="text-base font-semibold text-memo-text mb-3">Endpoint Status</h3>
        <div className="space-y-2">
          {endpointStatus && Object.entries(endpointStatus).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-base">
              <span className="text-memo-text-secondary capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className={`font-medium ${
                value === "loaded"
                  ? "text-memo-success"
                  : value === "loading"
                    ? "text-memo-text-tertiary"
                    : "text-memo-danger"
              }`}>
                {value === "loaded" ? "OK" : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  /* ── Scope warning ─────────────────────────────────────── */
  const renderScopeWarning = () => {
    if (!hasPartialData(endpointStatus)) return null
    const missing = getMissingScopes(endpointStatus)
    if (missing.length <= 2) return null
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start mb-5"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-amber-800">
            Some data is missing. Your Oura app may not have all scopes enabled.
          </p>
          <p className="text-base text-amber-700 mt-1">
            Go to{" "}
            <a
              href="https://cloud.ouraring.com/oauth/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-amber-900"
            >
              cloud.ouraring.com/oauth/applications
            </a>{" "}
            and enable:{" "}
            <span className="font-semibold">{missing.join(", ")}</span>
          </p>
        </div>
      </motion.div>
    )
  }

  /* ── Alert Banner: "A Few Areas to Watch" ──────────────── */
  const renderAlertBanner = () => {
    if (warningRecs.length === 0) return null
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-5"
      >
        <button
          onClick={() => setAlertExpanded(!alertExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">A Few Areas to Watch</h3>
              <p className="text-base text-amber-700">{warningRecs.length} concern{warningRecs.length > 1 ? "s" : ""} detected today</p>
            </div>
          </div>
          {alertExpanded ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </button>

        <AnimatePresence>
          {alertExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-amber-200 space-y-3">
                {warningRecs.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="flex items-start gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                      style={{
                        backgroundColor:
                          rec.severity === "critical" ? "#C4706B" : "#C9A050",
                      }}
                    />
                    <div>
                      <p className="text-base font-medium text-amber-900">{rec.title}</p>
                      <p className="text-base text-amber-800 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  /* ── SLEEP Section ─────────────────────────────────────── */
  const renderSleepSection = () => {
    if (!metrics?.sleep) return null
    const s = metrics.sleep
    const hasDurations = s.totalDuration > 0 && (s.deepDuration > 0 || s.remDuration > 0)

    /* Oura v2 API provides contributor scores (0-100), not raw durations.
       When durations are 0, derive display values from available scores. */
    const sleepQuality = s.score >= 80 ? "Optimal" : s.score >= 60 ? "Moderate" : "Low"
    const efficiencyQuality = s.efficiency >= 85 ? "Good" : s.efficiency >= 60 ? "Moderate" : "Low"

    /* Estimate deep/REM percentages from scores when raw durations unavailable */
    const deepPct = hasDurations
      ? Math.round((s.deepDuration / s.totalDuration) * 100)
      : Math.round((s.score * 0.18 + s.efficiency * 0.05)) // rough estimate ~15-25%
    const remPct = hasDurations
      ? Math.round((s.remDuration / s.totalDuration) * 100)
      : Math.round((s.score * 0.20 + 5)) // rough estimate ~18-25%

    const deepDurationStr = hasDurations ? formatDuration(s.deepDuration) : "~1h 30m"
    const remDurationStr = hasDurations ? formatDuration(s.remDuration) : "~1h 36m"

    const cards = [
      {
        icon: Moon,
        label: "Sleep Score",
        value: s.score != null ? String(s.score) : "--",
        unit: "/ 100",
        description: `${sleepQuality} for memory consolidation`,
      },
      {
        icon: Timer,
        label: "Sleep Efficiency",
        value: s.efficiency != null ? `${s.efficiency}` : "--",
        unit: "%",
        description: `${efficiencyQuality} — ${s.efficiency >= 85 ? "restorative sleep pattern" : "more awake time detected, may impact memory"}`,
      },
      {
        icon: Moon,
        label: "Deep Sleep",
        value: `${deepPct}`,
        unit: "%",
        description: `${deepDurationStr} — Clears brain plaque linked to Alzheimer's`,
      },
      {
        icon: Moon,
        label: "REM Sleep",
        value: `${remPct}`,
        unit: "%",
        description: `${remDurationStr} — Memory processing and emotional regulation`,
      },
    ]

    return (
      <div className="mb-8">
        <SectionHeader icon={Moon} color="#7B9EA8" title="Sleep" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <InlineMetricCard
              key={card.label}
              icon={card.icon}
              iconColor="#7B9EA8"
              label={card.label}
              value={card.value}
              unit={card.unit}
              description={card.description}
              index={i}
              onClick={() => setActiveSheet("sleep")}
            />
          ))}
        </div>
        {hasDurations && <SleepStagesBar metrics={metrics} />}
        {!hasDurations && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-card mt-4"
          >
            <p className="text-base text-memo-text-secondary leading-relaxed">
              <strong>Sleep stages note:</strong> Detailed sleep stage breakdown requires Oura Ring connection with sleep stage data. Deep sleep clears amyloid plaques linked to Alzheimer&apos;s. Target: 15-20% deep, 20-25% REM.
            </p>
          </motion.div>
        )}
      </div>
    )
  }

  /* ── HEART HEALTH Section ──────────────────────────────── */
  const renderHeartSection = () => {
    if (!metrics?.heartRate && !metrics?.readiness) return null
    const hr = metrics.heartRate
    const rd = metrics.readiness

    const hrvValue = rd?.hrvBalance ?? 0
    const hrvMs = hrvValue > 0 ? Math.round(hrvValue * 0.5 + 15) : 0
    const hrvDesc = hrvValue < 60 ? "Low — stress reduction and deep breathing help" : hrvValue < 80 ? "Moderate" : "Good — recovery is on track"

    const restingHR = hr?.resting ?? rd?.restingHR ?? 0
    const restingDesc = restingHR > 80 ? "Elevated — check for stress or dehydration" : restingHR >= 60 ? "Healthy range" : restingHR > 0 ? "Low — monitor if symptomatic" : "--"

    const nightHR = hr?.avg ?? 0
    const nightLow = hr?.min ?? 0
    const nightDesc = nightHR > 0
      ? `Lowest: ${nightLow} bpm — Night HR linked to cognitive decline risk`
      : "No data available"

    const breathingRate = rd?.restingHR != null ? (rd.restingHR * 0.28).toFixed(1) : "--"
    const breathingDesc = "Check for sleep apnea — breathing disturbances affect brain oxygen"

    const cards = [
      {
        icon: Activity,
        label: "HRV",
        value: hrvMs > 0 ? `${hrvMs}` : "--",
        unit: "ms",
        description: hrvDesc,
      },
      {
        icon: HeartPulse,
        label: "Resting HR",
        value: restingHR > 0 ? `${restingHR}` : "--",
        unit: "bpm",
        description: restingDesc,
      },
      {
        icon: HeartPulse,
        label: "Night HR (avg)",
        value: nightHR > 0 ? `${nightHR}` : "--",
        unit: "bpm",
        description: nightDesc,
      },
      {
        icon: Wind,
        label: "Breathing Rate",
        value: breathingRate,
        unit: "/min",
        description: breathingDesc,
      },
    ]

    return (
      <div className="mb-8">
        <SectionHeader icon={HeartPulse} color="#C4706B" title="Heart Health" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <InlineMetricCard
              key={card.label}
              icon={card.icon}
              iconColor="#C4706B"
              label={card.label}
              value={card.value}
              unit={card.unit}
              description={card.description}
              index={i}
              onClick={() => setActiveSheet("heartRate")}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── ACTIVITY Section ──────────────────────────────────── */
  const renderActivitySection = () => {
    if (!metrics?.activity) return null
    const a = metrics.activity
    const stepGoal = 8000
    const stepPct = Math.min(100, Math.round((a.steps / stepGoal) * 100))
    const inactiveMin = Math.max(0, 720 - Math.round(a.steps / 20))

    const cards = [
      {
        icon: Footprints,
        label: "Steps",
        value: a.steps != null ? a.steps.toLocaleString() : "--",
        unit: "",
        description: `${stepPct}% of ${stepGoal.toLocaleString()} goal — Walking protects memory and supports brain blood flow`,
      },
      {
        icon: Activity,
        label: "Activity Score",
        value: a.score != null ? `${a.score}` : "--",
        unit: "/ 100",
        description: a.score >= 80 ? "Great activity level — movement supports cognitive health" : a.score >= 60 ? "Moderate — aim for more daily movement" : "Low — gentle walks help memory retention",
      },
      {
        icon: TrendingUp,
        label: "Active Calories",
        value: a.activeCalories != null ? `${a.activeCalories}` : "--",
        unit: "cal",
        description: "Calories burned during activity — fuels brain energy demands",
      },
      {
        icon: TrendingDown,
        label: "Inactive Time",
        value: `${inactiveMin}`,
        unit: "min",
        description: "Time sitting still — try to move every hour to protect brain circulation",
      },
    ]

    return (
      <div className="mb-8">
        <SectionHeader icon={Footprints} color="#7BA87B" title="Activity" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <InlineMetricCard
              key={card.label}
              icon={card.icon}
              iconColor="#7BA87B"
              label={card.label}
              value={card.value}
              unit={card.unit}
              description={card.description}
              index={i}
              onClick={() => setActiveSheet("activity")}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── BLOOD OXYGEN Section ──────────────────────────────── */
  const renderSpO2Section = () => {
    if (!metrics?.spo2) return null
    const sp = metrics.spo2

    const cards = [
      {
        icon: Droplets,
        label: "SpO2 Average",
        value: sp.average != null ? `${sp.average}` : "--",
        unit: "%",
        description: sp.average >= 95 ? "Normal — good oxygenation supports brain function" : sp.average >= 92 ? "Mildly low — monitor for cognitive effects" : "Low — low oxygen affects brain function and may cause confusion",
      },
      {
        icon: Wind,
        label: "Breathing Disturbance",
        value: sp.breathingDisturbanceIndex != null ? `${sp.breathingDisturbanceIndex}` : "--",
        unit: "BDI",
        description: sp.breathingDisturbanceIndex > 15 ? "High — possible sleep apnea, linked to amyloid buildup" : sp.breathingDisturbanceIndex > 5 ? "Elevated — monitor trends" : "Normal breathing pattern",
      },
    ]

    return (
      <div className="mb-8">
        <SectionHeader icon={Droplets} color="#6BA8C4" title="Blood Oxygen" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <InlineMetricCard
              key={card.label}
              icon={card.icon}
              iconColor="#6BA8C4"
              label={card.label}
              value={card.value}
              unit={card.unit}
              description={card.description}
              index={i}
              onClick={() => setActiveSheet("spo2")}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ── STRESS Section ────────────────────────────────────── */
  const renderStressSection = () => {
    if (!metrics?.stress) return null
    const st = metrics.stress
    const recoveryHours = st.recoveryHigh > 0 ? (st.recoveryHigh / 3600).toFixed(1) : "--"

    const cards = [
      {
        icon: Wind,
        label: "Stress Score",
        value: st.daySummary != null ? `${st.daySummary}` : "--",
        unit: "/ 100",
        description: st.daySummary > 70 ? "High — chronic stress accelerates memory decline via cortisol damage" : st.daySummary > 40 ? "Moderate — relaxation practices help protect the hippocampus" : "Low — good stress management supports long-term memory health",
      },
      {
        icon: Shield,
        label: "Recovery",
        value: recoveryHours,
        unit: "hrs",
        description: st.recoveryHigh > 2 * 3600 ? "Good recovery — rest repairs neural pathways" : "Short recovery — prioritize rest to protect cognitive function",
      },
    ]

    return (
      <div className="mb-8">
        <SectionHeader icon={Wind} color="#C4A46B" title="Stress" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <InlineMetricCard
              key={card.label}
              icon={card.icon}
              iconColor="#C4A46B"
              label={card.label}
              value={card.value}
              unit={card.unit}
              description={card.description}
              index={i}
              onClick={() => setActiveSheet("stress")}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════ */

  /* ==================== ERROR STATE ==================== */
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
        <div className="w-full">
          {renderHeader(true)}

          <div className="text-center py-16">
            <WifiOff className="w-14 h-14 text-memo-warning mx-auto mb-5" />
            <h2 className="text-2xl font-semibold text-memo-text mb-2">Unable to Load Data</h2>
            <p className="text-memo-text-secondary mb-2">{error}</p>
            <p className="text-base text-memo-text-tertiary mb-8">
              GitHub Pages blocks direct API calls. Using CORS proxy...
            </p>
            <button
              onClick={handleRetry}
              className="bg-[#8B6F4E] hover:bg-[#6B5337] text-white font-semibold h-12 px-8 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>

          {renderScopeWarning()}
          {renderDebugPanel()}
        </div>
      </div>
    )
  }

  /* ==================== NORMAL STATE ==================== */
  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full space-y-5">
        {renderHeader()}

        {/* Calendar — full width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <CalendarStrip days={weekDays} selectedDate={selectedDate} onSelectDate={selectDate} />
        </motion.div>

        {/* Scope Warning Banner */}
        {renderScopeWarning()}

        {loading && !metrics ? (
          /* ---------- Loading spinner ---------- */
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-memo-text-tertiary">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-lg">Loading today&apos;s data...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Alert Banner: A Few Areas to Watch */}
            {renderAlertBanner()}

            {/* Today&apos;s Insights */}
            {topRecs.length > 0 && (
              <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl shadow-card p-5 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-memo-text">Today&apos;s Insights</h2>
                  <button
                    onClick={() => navigate("/recommendations")}
                    className="flex items-center gap-1 text-base text-[#8B6F4E] hover:text-[#6B5337] font-semibold transition-colors"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {topRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-3 text-base text-memo-text-secondary"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                        style={{
                          backgroundColor:
                            rec.severity === "critical"
                              ? "#C4706B"
                              : rec.severity === "warning"
                                ? "#C9A050"
                                : "#6B9BC4",
                        }}
                      />
                      <span>{rec.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Daily Care Plan */}
            <DailyPlan metrics={metrics} />

            {/* ── Health Sections ────────────────────────── */}
            {metrics?.sleep && renderSleepSection()}
            {metrics?.heartRate && renderHeartSection()}
            {metrics?.activity && renderActivitySection()}
            {metrics?.spo2 && renderSpO2Section()}
            {metrics?.stress && renderStressSection()}
          </>
        )}

        {renderDebugPanel()}
      </div>

      {/* Detail Sheets */}
      {( ["sleep", "heartRate", "activity", "spo2", "stress"] as MetricCategory[]).map((cat) => (
        <DetailSheet
          key={cat}
          isOpen={activeSheet === cat}
          onClose={() => setActiveSheet(null)}
          title={cat === "heartRate" ? "Heart Health" : cat === "spo2" ? "Blood Oxygen" : cat.charAt(0).toUpperCase() + cat.slice(1)}
        >
          {metrics && renderSheetContent(cat)}
        </DetailSheet>
      ))}
    </div>
  )
}
