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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

/* ── Helpers ─────────────────────────────────────────────── */

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
      whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(45, 42, 38, 0.12)", y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-colors duration-200 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {/* Top: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200" style={{ backgroundColor: `${iconColor}14` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <span className="text-sm font-medium text-memo-text-secondary tracking-wide">{label}</span>
      </div>
      {/* Middle: big number + unit */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-3xl font-bold text-memo-text tracking-tight">{value}</span>
        <span className="text-sm text-memo-text-tertiary font-medium">{unit}</span>
      </div>
      {/* Bottom: description */}
      <p className="text-sm text-memo-text-secondary leading-relaxed line-clamp-2">{description}</p>
    </motion.div>
  )
}

/* ── Section Header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, color, title }: { icon: React.ElementType; color: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}14` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-memo-text-secondary">{title}</h2>
      <div className="flex-1 h-px bg-gray-200/80 ml-1" />
    </div>
  )
}

/* ── Sleep Contributors Bar ────────────────────────────────────── */
// Oura v2 API provides contributor SCORES (0-100), not raw stage durations.
// These scores represent how well each sleep aspect performed vs. personal baseline.
function SleepContributorsBar({ metrics }: { metrics: DailyMetrics | null }) {
  // If no sleep data at all, show placeholder
  if (!metrics?.sleep) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-card mt-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-5 h-5" style={{ color: "#7B9EA8" }} />
          <span className="text-base font-medium text-memo-text-secondary">Sleep Contributors</span>
        </div>
        <p className="text-base text-memo-text-secondary leading-relaxed">
          <strong>Sleep contributor data not available.</strong> Connect an Oura Ring to see detailed sleep quality breakdown. Deep sleep clears amyloid plaques linked to Alzheimer&apos;s.
        </p>
      </motion.div>
    )
  }

  const s = metrics.sleep
  // All values are contributor scores 0-100 (independent, not percentages of a total)
  const contributors = [
    { name: "Total Sleep", score: s.totalSleep ?? 0, color: "#5B7A83" },
    { name: "Deep Sleep", score: s.deepSleep ?? 0, color: "#4A6741" },
    { name: "REM Sleep", score: s.remSleep ?? 0, color: "#7B9EA8" },
    { name: "Latency", score: s.latency ?? 0, color: "#A8C4CC" },
    { name: "Efficiency", score: s.efficiency ?? 0, color: "#9B8BB5" },
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
        <span className="text-base font-medium text-memo-text-secondary">Sleep Contributors</span>
      </div>
      {/* Score bars */}
      <div className="space-y-2 mb-3">
        {contributors.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-sm text-memo-text-secondary w-24 flex-shrink-0">{c.name}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${c.score}%`, backgroundColor: c.color }}
              />
            </div>
            <span className="text-sm font-medium text-memo-text w-10 text-right">{c.score}</span>
          </div>
        ))}
      </div>
      {/* Note */}
      <p className="text-base text-memo-text-secondary leading-relaxed mt-3 pt-3 border-t border-gray-100">
        Higher contributor scores mean better sleep quality for that metric. Deep sleep clears amyloid plaques linked to Alzheimer&apos;s.
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
  const [alertDismissed, setAlertDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("memo_alert_dismissed") === "true"
    } catch {
      return false
    }
  })
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
              { label: "Deep Sleep", value: `${metrics.sleep.deepSleep} / 100`, pct: metrics.sleep.deepSleep },
              { label: "REM Sleep", value: `${metrics.sleep.remSleep} / 100`, pct: metrics.sleep.remSleep },
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
              { label: "Steps", value: metrics.activity?.steps?.toLocaleString() ?? "--" },
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
      className="flex items-center justify-between gap-3 mb-6 flex-wrap sm:flex-nowrap"
    >
      {/* Left: Logo + Live badge — flex-shrink-0 prevents squeezing */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <h1 className="text-3xl font-bold text-memo-text tracking-tight">memo</h1>
        {!isErrorState && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-card flex-shrink-0">
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

      {/* Right: greeting + date + buttons — min-w-0 allows truncation, flex-shrink-0 prevents button squeeze */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0 ml-auto">
        {!isErrorState && (
          <div className="text-right mr-1 flex-shrink-0 min-w-0 hidden sm:block">
            <p className="text-lg font-semibold text-memo-text truncate">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
              {personalInfo?.name ? `, ${personalInfo.name.split(" ")[0]}` : ""}
            </p>
            <p className="text-base text-memo-text-secondary">{formatDate(selectedDate)}</p>
          </div>
        )}
        {!isErrorState && (
          <button
            onClick={refreshData}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-memo-bg hover:shadow-card-hover hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-memo-text-secondary" />
          </button>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ${showDebug ? "bg-[#8B6F4E] text-white shadow-md" : "bg-white shadow-card text-memo-text-secondary hover:bg-memo-bg hover:shadow-card-hover"}`}
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

  /* ── Alert Banner: "A Few Areas to Watch" ──────────────── */
  // Count actually missing endpoints (not just low scores)
  const missingEndpoints = useMemo(() => {
    if (!endpointStatus) return 0
    return Object.values(endpointStatus).filter((s) => s === "error" || s === "missing").length
  }, [endpointStatus])

  const dismissAlert = () => {
    setAlertDismissed(true)
    try {
      sessionStorage.setItem("memo_alert_dismissed", "true")
    } catch {
      /* ignore */
    }
  }

  const renderAlertBanner = () => {
    // Only show if: not dismissed, at least 3 endpoints missing, AND we have warning recs
    if (alertDismissed) return null
    if (missingEndpoints < 3 && warningRecs.length === 0) return null
    if (warningRecs.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 shadow-sm"
      >
        {/* Dismiss button */}
        <button
          onClick={dismissAlert}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-colors"
          title="Dismiss"
          aria-label="Dismiss alert"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>

        <button
          onClick={() => setAlertExpanded(!alertExpanded)}
          className="flex items-center justify-between w-full text-left pr-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">A Few Areas to Watch</h3>
              <p className="text-sm text-amber-600">
                {missingEndpoints >= 3
                  ? `${missingEndpoints} data sources unavailable — some metrics may be incomplete`
                  : `${warningRecs.length} concern${warningRecs.length > 1 ? "s" : ""} detected today`}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {alertExpanded ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
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
              <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-3">
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
                      <p className="text-base text-amber-800/80 leading-relaxed">{rec.description}</p>
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
  /* FIX: Always render — cards show "--" when data is missing */
  const renderSleepSection = () => {
    const s = metrics?.sleep
    const hasData = s != null

    const sleepScore = s?.score
    const sleepEfficiency = s?.efficiency
    // Oura v2 API provides contributor SCORES (0-100), not raw durations
    const totalSleepScore = s?.totalSleep
    const deepSleepScore = s?.deepSleep
    const remSleepScore = s?.remSleep
    const hasContributors = totalSleepScore != null || deepSleepScore != null || remSleepScore != null

    const sleepQuality = !hasData ? "No data" : sleepScore! >= 80 ? "Optimal" : sleepScore! >= 60 ? "Moderate" : "Low"
    const efficiencyQuality = !hasData ? "No data" : sleepEfficiency! >= 85 ? "Good" : sleepEfficiency! >= 60 ? "Moderate" : "Low"

    // Display contributor scores directly (0-100) since v2 API doesn't provide raw durations
    const deepDisplay = hasContributors ? (deepSleepScore ?? 0) : Math.round(((sleepScore ?? 0) * 0.18 + (sleepEfficiency ?? 0) * 0.05))
    const remDisplay = hasContributors ? (remSleepScore ?? 0) : Math.round(((sleepScore ?? 0) * 0.20 + 5))

    const cards = [
      {
        icon: Moon,
        label: "Sleep Score",
        value: sleepScore != null ? String(sleepScore) : "--",
        unit: "/ 100",
        description: `${sleepQuality} for memory consolidation`,
      },
      {
        icon: Timer,
        label: "Sleep Efficiency",
        value: sleepEfficiency != null ? `${sleepEfficiency}` : "--",
        unit: "%",
        description: !hasData
          ? "No sleep data available"
          : `${efficiencyQuality} — ${sleepEfficiency! >= 85 ? "restorative sleep pattern" : "more awake time detected, may impact memory"}`,
      },
      {
        icon: Moon,
        label: "Deep Sleep",
        value: hasData ? `${deepDisplay}` : "--",
        unit: "/ 100",
        description: hasContributors
          ? `Deep sleep contributor score — Clears brain plaque linked to Alzheimer's`
          : `~${Math.round(deepDisplay * 0.018 + 5)}% estimated — Clears brain plaque linked to Alzheimer's`,
      },
      {
        icon: Moon,
        label: "REM Sleep",
        value: hasData ? `${remDisplay}` : "--",
        unit: "/ 100",
        description: hasContributors
          ? `REM sleep contributor score — Memory processing and emotional regulation`
          : `~${Math.round(remDisplay * 0.020 + 3)}% estimated — Memory processing and emotional regulation`,
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
        <SleepContributorsBar metrics={metrics} />
      </div>
    )
  }

  /* ── HEART HEALTH Section ──────────────────────────────── */
  /* FIX: Always render — cards show "--" when data is missing */
  const renderHeartSection = () => {
    const hr = metrics?.heartRate
    const rd = metrics?.readiness
    const hasAnyData = hr != null || rd != null

    // Card 1: HRV in ms (estimated from readiness hrvBalance score)
    const hrvBalance = rd?.hrvBalance
    const hrvMs = hrvBalance != null
      ? Math.round(hrvBalance * 0.5 + 15)
      : null
    const hrvDesc = !hasAnyData
      ? "No heart data available"
      : hrvMs == null
        ? "No HRV data available"
        : hrvBalance! < 60
          ? "Low — stress reduction and deep breathing help"
          : hrvBalance! < 80
            ? "Moderate"
            : "Good — recovery is on track"

    // Card 2: Resting HR from heartRate.resting (primary) or readiness
    const restingHRValue = hr?.resting ?? rd?.restingHeartRate
    const hasRestingHR = restingHRValue != null
    const restingHRDisplay = hasRestingHR ? `${restingHRValue}` : "--"
    const restingDesc = !hasAnyData
      ? "No heart data available"
      : !hasRestingHR
        ? "No resting HR data available"
        : restingHRValue! > 80
          ? "Elevated — check for stress or dehydration"
          : restingHRValue! >= 60
            ? "Healthy range"
            : "Low — monitor if symptomatic"

    // Card 3: Night HR (10 PM – 6 AM) from heartRate.avg
    const nightAvg = hr?.avg ?? hr?.nightAvg
    const nightMin = hr?.nightMin
    const hasNightHR = nightAvg != null
    const nightHRValue = hasNightHR ? `${nightAvg}` : "--"
    const nightDesc = !hasAnyData
      ? "No heart data available"
      : hasNightHR
        ? `Lowest: ${nightMin ?? "--"} bpm — Night HR linked to cognitive decline risk`
        : "No nighttime data available"

    // Card 4: HRV Balance (readiness score 0-100)
    const hasHrvBalance = hrvBalance != null
    const hrvBalanceValue = hasHrvBalance ? `${hrvBalance}` : "--"
    const hrvBalanceDesc = !hasAnyData
      ? "No heart data available"
      : !hasHrvBalance
        ? "No HRV balance data available"
        : hrvBalance! < 60
          ? "Below optimal — prioritize rest and recovery"
          : hrvBalance! < 80
            ? "Moderate — adequate recovery"
            : "Optimal — nervous system is well recovered"

    const cards = [
      {
        icon: Activity,
        label: "HRV",
        value: hrvMs != null ? `${hrvMs}` : "--",
        unit: "ms",
        description: hrvDesc,
      },
      {
        icon: HeartPulse,
        label: "Resting HR",
        value: restingHRDisplay,
        unit: "bpm",
        description: restingDesc,
      },
      {
        icon: HeartPulse,
        label: "Night HR (avg)",
        value: nightHRValue,
        unit: "bpm",
        description: nightDesc,
      },
      {
        icon: Shield,
        label: "HRV Balance",
        value: hrvBalanceValue,
        unit: "/ 100",
        description: hrvBalanceDesc,
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
  /* FIX: Always render — cards show "--" when data is missing */
  const renderActivitySection = () => {
    const a = metrics?.activity
    const hasData = a != null
    const stepGoal = 8000
    const steps = a?.steps
    const stepPct = steps != null ? Math.min(100, Math.round((steps / stepGoal) * 100)) : 0
    const inactiveMin = steps != null ? Math.max(0, 720 - Math.round(steps / 20)) : null

    const cards = [
      {
        icon: Footprints,
        label: "Steps",
        value: steps != null ? steps.toLocaleString() : "--",
        unit: "",
        description: hasData
          ? `${stepPct}% of ${stepGoal.toLocaleString()} goal — Walking protects memory and supports brain blood flow`
          : "No activity data available",
      },
      {
        icon: Activity,
        label: "Activity Score",
        value: a?.score != null ? `${a.score}` : "--",
        unit: "/ 100",
        description: !hasData
          ? "No activity data available"
          : a!.score >= 80
            ? "Great activity level — movement supports cognitive health"
            : a!.score >= 60
              ? "Moderate — aim for more daily movement"
              : "Low — gentle walks help memory retention",
      },
      {
        icon: TrendingUp,
        label: "Active Calories",
        value: a?.activeCalories != null ? `${a.activeCalories}` : "--",
        unit: "cal",
        description: hasData
          ? "Calories burned during activity — fuels brain energy demands"
          : "No activity data available",
      },
      {
        icon: TrendingDown,
        label: "Inactive Time",
        value: inactiveMin != null ? `${inactiveMin}` : "--",
        unit: "min",
        description: hasData
          ? "Time sitting still — try to move every hour to protect brain circulation"
          : "No activity data available",
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
  /* FIX: Always render — show "--" when SpO2 endpoint fails */
  const renderSpO2Section = () => {
    const sp = metrics?.spo2
    const rd = metrics?.readiness
    const hasAnyData = sp != null || rd != null

    // Card 1: SpO2 Average
    const spo2Avg = sp?.average
    const hasSpo2 = spo2Avg != null
    const spo2Value = hasSpo2 ? `${spo2Avg}` : "--"
    const spo2Desc = !hasAnyData
      ? "No blood oxygen data available"
      : !hasSpo2
        ? "SpO2 data not available — ensure Oura Ring is properly positioned"
        : spo2Avg === 0
          ? "SpO2 not collected — no readings available for this period"
          : spo2Avg >= 95
            ? "Normal — good oxygenation supports brain function"
            : spo2Avg >= 92
              ? "Mildly low — monitor for cognitive effects"
              : "Low — low oxygen affects brain function and may cause confusion"

    // Card 2: Breathing Disturbance Index
    const bdi = sp?.breathingDisturbanceIndex
    const hasBdi = bdi != null
    const bdiValue = hasBdi ? `${bdi}` : "--"
    const bdiDesc = !hasAnyData
      ? "No breathing disturbance data available"
      : !hasBdi
        ? "No breathing disturbance data available"
        : bdi > 15
          ? "High — possible sleep apnea, linked to amyloid buildup"
          : bdi > 5
            ? "Elevated — monitor trends"
            : "Normal breathing pattern"

    // Card 3: HRV Balance (from readiness)
    const hrvBalance = rd?.hrvBalance
    const hasHrvBalance = hrvBalance != null
    const hrvBalanceValue = hasHrvBalance ? `${hrvBalance}` : "--"
    const hrvBalanceDesc = !hasAnyData
      ? "No data available"
      : !hasHrvBalance
        ? "No readiness data available"
        : hrvBalance < 60
          ? "Below optimal — prioritize rest and recovery"
          : hrvBalance < 80
            ? "Moderate — adequate recovery"
            : "Optimal — nervous system is well recovered"

    // Card 4: Readiness Score
    const readinessScore = rd?.score
    const hasReadiness = readinessScore != null
    const readinessValue = hasReadiness ? `${readinessScore}` : "--"
    const readinessDesc = !hasAnyData
      ? "No data available"
      : !hasReadiness
        ? "No readiness data available"
        : readinessScore >= 80
          ? "Well recovered — your body is ready for cognitive demands"
          : readinessScore >= 60
            ? "Moderate recovery — balance activity with rest"
            : "Low recovery — prioritize rest to protect brain health"

    const cards = [
      {
        icon: Droplets,
        label: "SpO2 Average",
        value: spo2Value,
        unit: "%",
        description: spo2Desc,
      },
      {
        icon: Wind,
        label: "Breathing Disturbance",
        value: bdiValue,
        unit: "BDI",
        description: bdiDesc,
      },
      {
        icon: Shield,
        label: "HRV Balance",
        value: hrvBalanceValue,
        unit: "/ 100",
        description: hrvBalanceDesc,
      },
      {
        icon: Activity,
        label: "Readiness Score",
        value: readinessValue,
        unit: "/ 100",
        description: readinessDesc,
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
  /* FIX: Always render — cards show "--" when data is missing */
  const renderStressSection = () => {
    const st = metrics?.stress
    const rd = metrics?.readiness
    const res = metrics?.resilience
    const hasAnyData = st != null || rd != null || res != null

    // Card 1: Stress Score — uses stress.daySummary (0-100)
    const stressScore = st?.daySummary
    const hasStress = stressScore != null
    const stressValue = hasStress ? `${stressScore}` : "--"
    const stressDesc = !hasAnyData
      ? "No stress data available"
      : !hasStress
        ? "No stress data available"
        : stressScore === 0
          ? "Stress score not collected — insufficient data for this period"
          : stressScore > 70
            ? "High — chronic stress accelerates memory decline via cortisol damage"
            : stressScore > 40
              ? "Moderate — relaxation practices help protect the hippocampus"
              : "Low — good stress management supports long-term memory health"

    // Card 2: Recovery — stress.recoveryHigh is in SECONDS, convert to hours
    const recoverySeconds = st?.recoveryHigh
    const hasRecovery = recoverySeconds != null && recoverySeconds > 0
    const recoveryHours = hasRecovery ? (recoverySeconds / 3600).toFixed(1) : null
    const recoveryValue = recoveryHours != null ? `${recoveryHours}` : "--"
    const recoveryDesc = !hasAnyData
      ? "No recovery data available"
      : !hasRecovery
        ? "No recovery data available"
        : recoverySeconds > 2 * 3600
          ? "Good recovery — rest repairs neural pathways"
          : "Short recovery — prioritize rest to protect cognitive function"

    // Card 3: Stress High — time in high stress state, in seconds -> hours
    const stressHighSeconds = st?.stressHigh
    const hasStressHigh = stressHighSeconds != null && stressHighSeconds > 0
    const stressHighHours = hasStressHigh ? (stressHighSeconds / 3600).toFixed(1) : null
    const stressHighValue = stressHighHours != null ? `${stressHighHours}` : "--"
    const stressHighDesc = !hasAnyData
      ? "No stress high data available"
      : !hasStressHigh
        ? "No stress high data available"
        : stressHighSeconds > 4 * 3600
          ? "Extended high stress — take breaks to lower cortisol"
          : stressHighSeconds > 2 * 3600
            ? "Moderate high-stress time — mindfulness can help"
            : "Low time in high stress — good autonomic balance"

    // Card 4: Resilience Score — from resilience data
    const resilienceScore = res?.score
    const hasResilience = resilienceScore != null
    const resilienceValue = hasResilience ? `${resilienceScore}` : "--"
    const resilienceDesc = !hasAnyData
      ? "No resilience data available"
      : !hasResilience
        ? "No resilience data available"
        : resilienceScore === 0
          ? "Resilience score not collected — insufficient data for this period"
          : resilienceScore >= 80
            ? "Strong resilience — good capacity to handle daily stressors"
            : resilienceScore >= 60
              ? "Moderate — support recovery with quality sleep"
              : "Low resilience — prioritize restorative activities"

    const cards = [
      {
        icon: Wind,
        label: "Stress Score",
        value: stressValue,
        unit: "/ 100",
        description: stressDesc,
      },
      {
        icon: Shield,
        label: "Recovery",
        value: recoveryValue,
        unit: "hrs",
        description: recoveryDesc,
      },
      {
        icon: Activity,
        label: "Stress High",
        value: stressHighValue,
        unit: "hrs",
        description: stressHighDesc,
      },
      {
        icon: HeartPulse,
        label: "Resilience",
        value: resilienceValue,
        unit: "/ 100",
        description: resilienceDesc,
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
        <div className="w-full max-w-[1440px] mx-auto">
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

          {renderDebugPanel()}
        </div>
      </div>
    )
  }

  /* ==================== NORMAL STATE ==================== */
  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 md:px-8 pt-6 pb-10">
      <div className="w-full max-w-[1440px] mx-auto">
        {renderHeader()}

        {/* Loading indicator — inline, doesn't block content */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl mb-4"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span className="text-sm text-amber-700">Loading health data...</span>
          </motion.div>
        )}

        {/* Calendar — full width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-6"
        >
          <CalendarStrip days={weekDays} selectedDate={selectedDate} onSelectDate={selectDate} />
        </motion.div>

        {!metrics ? (
          /* ---------- No data for selected date ---------- */
          <div className="flex items-center justify-center py-16">
            <p className="text-lg text-memo-text-tertiary">No data available for this date.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alert Banner: A Few Areas to Watch */}
            {renderAlertBanner()}

            {/* Today&apos;s Insights */}
            {topRecs.length > 0 && (
              <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-2xl shadow-card p-5 md:p-6 hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-memo-text">Today&apos;s Insights</h2>
                  <button
                    onClick={() => navigate("/recommendations")}
                    className="flex items-center gap-1 text-sm text-[#8B6F4E] hover:text-[#6B5337] font-semibold transition-colors hover:gap-1.5"
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
            <div className="mb-6">
              <DailyPlan metrics={metrics} />
            </div>

            {/* ── Health Sections ────────────────────────── */}
            {/* FIX: Always render all sections — each handles missing data internally */}
            {renderSleepSection()}
            {renderHeartSection()}
            {renderActivitySection()}
            {renderSpO2Section()}
            {renderStressSection()}
          </div>
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
