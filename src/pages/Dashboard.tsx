import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Moon, HeartPulse, Footprints, Droplets, Gauge, Wind, Shield, Zap, RefreshCw, ChevronRight
} from "lucide-react"
import { useData } from "@/context/DataContext"
import { getRecommendationsForData } from "@/lib/recommendations"
import { formatDate, formatDuration, getWeekDays } from "@/lib/utils"
import MetricCard from "@/components/MetricCard"
import CalendarStrip from "@/components/CalendarStrip"
import DetailSheet from "@/components/DetailSheet"
import SkeletonCard from "@/components/SkeletonCard"
import type { DailyMetrics, MetricCategory } from "@/types/oura"
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
      subtitle: m.sleep ? formatDuration(m.sleep.totalDuration) : "No data",
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
      subtitle: m.readiness ? `HRV: ${m.readiness.hrvBalance}` : "No data",
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
      subtitle: m.activity ? `${m.activity.activeCalories} cal active` : "No data",
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
      subtitle: m.heartRate ? `Avg: ${m.heartRate.avg} bpm` : "No data",
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
      subtitle: m.spo2 ? `BDI: ${m.spo2.breathingDisturbanceIndex}` : "No data",
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
      subtitle: m.stress ? `Recovery: ${m.stress.recoveryHigh}%` : "No data",
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
      subtitle: m.resilience ? m.resilience.level : "No data",
      progress: m.resilience?.score ?? 0,
    }),
  },
}

export default function Dashboard() {
  const { personalInfo, metrics, loading, error, selectedDate, selectDate, refreshData } = useData()
  const [activeSheet, setActiveSheet] = useState<MetricCategory | null>(null)
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

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-memo-bg flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Zap className="w-12 h-12 text-memo-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-memo-text mb-2">Unable to Load Data</h2>
          <p className="text-memo-text-secondary mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-primary hover:bg-primary-dark text-white font-semibold h-12 px-6 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-memo-bg px-4 pt-5 pb-24">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-semibold text-memo-text">
              {new Date().getHours() < 12
                ? "Good morning"
                : new Date().getHours() < 17
                ? "Good afternoon"
                : "Good evening"}
              {personalInfo?.name ? `, ${personalInfo.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-base text-memo-text-secondary mt-0.5">{formatDate(selectedDate)}</p>
          </div>
          <button
            onClick={refreshData}
            className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center hover:bg-memo-bg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-memo-text-secondary" />
          </button>
        </motion.div>

        {/* Calendar */}
        <CalendarStrip days={weekDays} selectedDate={selectedDate} onSelectDate={selectDate} />

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
                  <h2 className="text-lg font-semibold text-memo-text">Today's Insights</h2>
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

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(categoryConfig) as MetricCategory[]).map((cat, i) => {
                const cfg = categoryConfig[cat]
                const formatted = metrics ? cfg.format(metrics) : { value: "--", subtitle: "Loading...", progress: 0 }
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
                    onClick={() => metrics && setActiveSheet(cat)}
                  />
                )
              })}
            </div>
          </>
        )}
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
