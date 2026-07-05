import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Moon, HeartPulse, Footprints, Droplets, Gauge, Wind, Shield,
  RefreshCw, ChevronRight, Menu, X, LogOut, Bug, WifiOff, AlertTriangle
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { getRecommendationsForData } from "@/lib/recommendations"
import { formatDate, formatDuration, getWeekDays } from "@/lib/utils"
import MetricCard from "@/components/MetricCard"
import CalendarStrip from "@/components/CalendarStrip"
import DetailSheet from "@/components/DetailSheet"
import SkeletonCard from "@/components/SkeletonCard"
import type { DailyMetrics, MetricCategory } from "@/types/oura"
import type { EndpointStatus } from "@/lib/ouraApi"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface CategoryConfig {
  label: string
  icon: React.ElementType
  color: string
  unit: string
  format: (m: DailyMetrics) => { value: string; subtitle: string; progress: number }
}

const categoryConfig: Record<MetricCategory, CategoryConfig> = {
  sleep: {
    label: "Sleep",
    icon: Moon,
    color: "#7B9EA8",
    unit: "",
    format: (m) => ({
      value: m.sleep?.score != null ? String(m.sleep.score) : "--",
      subtitle: m.sleep ? formatDuration(m.sleep.totalDuration) : "Connect your Oura Ring to see this data",
      progress: m.sleep?.score ?? 0,
    }),
  },
  readiness: {
    label: "Readiness",
    icon: Gauge,
    color: "#9B8BB5",
    unit: "",
    format: (m) => ({
      value: m.readiness?.score != null ? String(m.readiness.score) : "--",
      subtitle: m.readiness ? `HRV: ${m.readiness.hrvBalance}` : "Connect your Oura Ring to see this data",
      progress: m.readiness?.score ?? 0,
    }),
  },
  activity: {
    label: "Activity",
    icon: Footprints,
    color: "#7BA87B",
    unit: "",
    format: (m) => ({
      value: m.activity?.steps != null ? m.activity.steps.toLocaleString() : "--",
      subtitle: m.activity ? `${m.activity.activeCalories} cal active` : "Connect your Oura Ring to see this data",
      progress: m.activity?.score ?? 0,
    }),
  },
  heartRate: {
    label: "Heart Rate",
    icon: HeartPulse,
    color: "#C4706B",
    unit: "bpm",
    format: (m) => ({
      value: m.heartRate?.resting != null ? String(m.heartRate.resting) : "--",
      subtitle: m.heartRate ? `Avg: ${m.heartRate.avg} bpm` : "Connect your Oura Ring to see this data",
      progress: m.heartRate ? Math.max(0, 100 - (m.heartRate.resting - 50) * 2) : 0,
    }),
  },
  spo2: {
    label: "SpO2",
    icon: Droplets,
    color: "#6BA8C4",
    unit: "%",
    format: (m) => ({
      value: m.spo2?.average != null ? String(m.spo2.average) : "--",
      subtitle: m.spo2 ? `BDI: ${m.spo2.breathingDisturbanceIndex}` : "Connect your Oura Ring to see this data",
      progress: m.spo2 ? (m.spo2.average - 90) * 20 : 0,
    }),
  },
  stress: {
    label: "Stress",
    icon: Wind,
    color: "#C4A46B",
    unit: "%",
    format: (m) => ({
      value: m.stress?.stressHigh != null ? String(m.stress.stressHigh) : "--",
      subtitle: m.stress ? `Recovery: ${m.stress.recoveryHigh}%` : "Connect your Oura Ring to see this data",
      progress: m.stress ? Math.max(0, 100 - m.stress.stressHigh) : 0,
    }),
  },
  resilience: {
    label: "Resilience",
    icon: Shield,
    color: "#8BB5A0",
    unit: "",
    format: (m) => ({
      value: m.resilience?.score != null ? String(m.resilience.score) : "--",
      subtitle: m.resilience ? m.resilience.level : "Connect your Oura Ring to see this data",
      progress: m.resilience?.score ?? 0,
    }),
  },
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

export default function Dashboard() {
  const { personalInfo, metrics, loading, error, endpointStatus, selectedDate, selectDate, refreshData, disconnect } = useData()
  const [activeSheet, setActiveSheet] = useState<MetricCategory | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const navigate = useNavigate()

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

  const recommendations = useMemo(() => {
    if (!metrics) return []
    return getRecommendationsForData(metrics)
  }, [metrics])

  const topRecs = recommendations.slice(0, 3)

  const handleRetry = () => {
    refreshData()
  }

  const trendData = useMemo(() => {
    if (!metrics) return []
    return weekDays.map((d) => ({ date: d, value: 0 }))
  }, [weekDays, metrics])

  const renderSheetContent = (cat: MetricCategory) => {
    const cfg = categoryConfig[cat]
    const data = trendData.map((d) => ({
      ...d,
      value: Math.random() * 40 + 60,
    }))

    return (
      <div className="space-y-5">
        <div className="bg-memo-bg rounded-xl p-4 text-center">
          <cfg.icon className="w-8 h-8 mx-auto mb-2" style={{ color: cfg.color }} />
          <div className="text-4xl font-semibold text-memo-text">
            {cfg.format(metrics!).value}
            <span className="text-lg text-memo-text-tertiary ml-1">{cfg.unit}</span>
          </div>
          <p className="text-sm text-memo-text-secondary mt-1">{cfg.format(metrics!).subtitle}</p>
        </div>

        <div className="h-[200px] bg-memo-bg rounded-xl p-3">
          <p className="text-xs font-medium text-memo-text-secondary mb-2 uppercase tracking-wider">
            7-Day Trend
          </p>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9B9590" }} tickLine={false} axisLine={false} tickFormatter={(d) => d.slice(5)} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ fontSize: 12, color: "#6B6560" }}
              />
              <Area type="monotone" dataKey="value" stroke={cfg.color} fill={`url(#grad-${cat})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {cat === "sleep" && metrics?.sleep && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Deep Sleep", value: formatDuration(metrics.sleep.deepDuration), pct: Math.round((metrics.sleep.deepDuration / metrics.sleep.totalDuration) * 100) },
              { label: "REM Sleep", value: formatDuration(metrics.sleep.remDuration), pct: Math.round((metrics.sleep.remDuration / metrics.sleep.totalDuration) * 100) },
              { label: "Light Sleep", value: formatDuration(metrics.sleep.lightDuration), pct: Math.round((metrics.sleep.lightDuration / metrics.sleep.totalDuration) * 100) },
              { label: "Efficiency", value: `${metrics.sleep.efficiency}%`, pct: metrics.sleep.efficiency },
            ].map((s) => (
              <div key={s.label} className="bg-memo-bg rounded-xl p-3">
                <p className="text-xs text-memo-text-tertiary uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-memo-text">{s.value}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: cfg.color }} />
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
                <p className="text-xs text-memo-text-tertiary uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-semibold text-memo-text">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ---------- Shared header component ---------- */
  const renderHeader = (isErrorState = false) => (
    <div className="flex items-center justify-between mb-5">
      {isErrorState ? (
        <h1 className="text-3xl font-semibold text-memo-text">Memo</h1>
      ) : (
        <div>
          <h1 className="text-3xl font-semibold text-memo-text">
            {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
            {personalInfo?.name ? `, ${personalInfo.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-base text-memo-text-secondary mt-0.5">{formatDate(selectedDate)}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!isErrorState && (
          <button
            onClick={refreshData}
            className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-memo-bg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-memo-text-secondary" />
          </button>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showDebug ? "bg-primary text-white shadow-card" : "bg-white shadow-card text-memo-text-secondary hover:bg-memo-bg"}`}
          title="Toggle debug panel"
        >
          <Bug className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center relative"
          title="Menu"
        >
          {menuOpen ? <X className="w-5 h-5 text-memo-text-secondary" /> : <Menu className="w-5 h-5 text-memo-text-secondary" />}
        </button>
      </div>
    </div>
  )

  /* ---------- Shared dropdown menu ---------- */
  const renderMenu = () => (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-4 top-16 bg-white rounded-2xl shadow-elevated p-2 z-50 w-52"
        >
          <button
            onClick={() => { disconnect(); setMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-memo-danger hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Disconnect Oura Ring
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  /* ---------- Shared debug panel ---------- */
  const renderDebugPanel = () => (
    <AnimatePresence>
      {showDebug && endpointStatus && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-white rounded-2xl shadow-card p-4 mt-4">
            <h3 className="text-sm font-semibold text-memo-text mb-3">Endpoint Status</h3>
            <div className="space-y-2">
              {Object.entries(endpointStatus).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
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
      )}
    </AnimatePresence>
  )

  /* ---------- Shared scope warning banner ---------- */
  const renderScopeWarning = () => {
    if (!hasPartialData(endpointStatus)) return null
    const missing = getMissingScopes(endpointStatus)
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            Some data is missing. Your Oura app may not have all scopes enabled.
          </p>
          <p className="text-xs text-amber-700 mt-1">
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

  /* ==================== ERROR STATE ==================== */
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-10">
        <div className="max-w-2xl mx-auto relative">
          {renderHeader(true)}
          {renderMenu()}

          <div className="text-center py-12">
            <WifiOff className="w-12 h-12 text-memo-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-memo-text mb-2">Unable to Load Data</h2>
            <p className="text-memo-text-secondary mb-2">{error}</p>
            <p className="text-sm text-memo-text-tertiary mb-6">
              GitHub Pages blocks direct API calls. Using CORS proxy...
            </p>
            <button
              onClick={handleRetry}
              className="bg-primary hover:bg-primary-dark text-white font-semibold h-12 px-6 rounded-xl transition-colors"
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
    <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-24">
      <div className="max-w-2xl mx-auto space-y-5 relative">
        {renderHeader()}
        {renderMenu()}

        {/* Calendar */}
        <CalendarStrip days={weekDays} selectedDate={selectedDate} onSelectDate={selectDate} />

        {/* Scope Warning Banner */}
        {renderScopeWarning()}

        {loading && !metrics ? (
          <SkeletonCard count={7} />
        ) : (
          <>
            {/* Daily Summary / Top Recommendations */}
            {topRecs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-memo-text">Today&apos;s Insights</h2>
                  <button
                    onClick={() => navigate("/recommendations")}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {topRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-2.5 text-sm text-memo-text-secondary"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
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

            {/* Metric Cards — all 7 always visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(categoryConfig) as MetricCategory[]).map((cat, i) => {
                const cfg = categoryConfig[cat]
                const hasData = metrics != null && cfg.format(metrics).value !== "--"
                const formatted = metrics ? cfg.format(metrics) : { value: "--", subtitle: "Connect your Oura Ring to see this data", progress: 0 }
                return (
                  <MetricCard
                    key={cat}
                    icon={<cfg.icon className="w-5 h-5" />}
                    title={cfg.label}
                    value={formatted.value}
                    unit={cfg.unit}
                    subtitle={formatted.subtitle}
                    progress={formatted.progress}
                    color={cfg.color}
                    delay={0.05 * i}
                    onClick={() => hasData && setActiveSheet(cat)}
                  />
                )
              })}
            </div>
          </>
        )}

        {renderDebugPanel()}
      </div>

      {/* Detail Sheets */}
      {(Object.keys(categoryConfig) as MetricCategory[]).map((cat) => (
        <DetailSheet
          key={cat}
          isOpen={activeSheet === cat}
          onClose={() => setActiveSheet(null)}
          title={categoryConfig[cat].label}
        >
          {metrics && renderSheetContent(cat)}
        </DetailSheet>
      ))}
    </div>
  )
}
